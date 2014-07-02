//  Sankey 3 node chart

/*   Copyright 2014 by mathias herzog, <mathu at gmx dot ch>

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.

 this chart displays page flow information as sankey diagramm
 the result is showing previous, current and next page
 supports drilldown on a sankey node
   the drilldown refers to the current dashboard, using form.page as token
 */

/*
 --- available settings ---
 - pageField:       the current page
 - prev_pageField:  previous page
 - next_pageField:  next page
 - count1Field:     the count of path page-to-n1_page
 - count2Field:     the count of path n1_page-to-n2_page
 - height:          the height of the panel

 --- expected data format ---
 a splunk search like this: source=foo |
                            streamstats current=f last(page) as n1_page by client_id  |
                            streamstats count(n1_page) as c1 by page n1_page |
                            streamstats current=f last(n1_page) as n2_page by client_id |
                            streamstats count(n2_page) as c2 by n2_page n1_page |
                            search n1_page=<filter page that will be in the middle of the sankey nodes>
 where:
  "page"     will refer to prev_pageField
  "n1_page"  will refer to pageField
  "n2_page"  will refer to next_pageField
 */

define(function(require, exports, module) {

  var _ = require('underscore');
  var SimpleSplunkView = require("splunkjs/mvc/simplesplunkview");
  require("css!./sankeychart.css");
  require("./d3.v2.min");
  require("./sankey-native");

  var formatNumber = d3.format(",.0f"),
  format = function(d) { return "count = " + formatNumber(d); },
  color = d3.scale.category20();

  // sankey diagramms don't like it when source and target pages have the same name
  // so we append a string to every nX_page value
  // this string will be replaced later on in the sankey node- and link titles
  delim = "_n-"

    // create map out of a collection
    // concat the append-string to every extracted item of the collection
    function pluck(arr, key, append) {
    return $.map(arr, function(e) {
      try {
        s = e[key].concat(append);
        return s;
      } catch (f) {
        return "";
      }
    })
  }

  var SankeyView = SimpleSplunkView.extend({
    className: "splunk-toolkit-sankey-chart",
    options: {
      managerid: null,
      data: "preview",
      pageField: null,
      count1Field: 'count',
      count2Field: 'count',
      next_pageField: null,
      prev_pageField: null
    },

    output_mode: "json",

    initialize: function() {
      _.extend(this.options, {
        formatName: _.identity,
        formatTitle: function(d) {
          return (d.source.name + ' -> ' + d.target.name +
              ': ' + d.value);
        }
      });
      SimpleSplunkView.prototype.initialize.apply(this, arguments);

      this.settings.enablePush("value");

      // in the case that any options are changed, it will dynamically update
      // without having to refresh. copy the following line for whichever field
      // you'd like dynamic updating on
      this.settings.on("change:pageField", this.render, this);
      this.settings.on("change:next_pageField", this.render, this);
      this.settings.on("change:prev_pageField", this.render, this);
      this.settings.on("change:count1Field", this.render, this);
      this.settings.on("change:count2Field", this.render, this);

      // Set up resize callback. The first argument is a this
      // pointer which gets passed into the callback event
      $(window).resize(this, _.debounce(this._handleResize, 20));
    },

    _handleResize: function(e){
      // e.data is the this pointer passed to the callback.
      // here it refers to this object and we call render()
      e.data.render();
    },

    createView: function() {
      var margin = {top: 0, right: 0, bottom: 8, left: 0};
      var availableWidth = parseInt(this.settings.get("width") || this.$el.width());
      var availableHeight = parseInt(this.settings.get("height") || this.$el.height());
      var width = availableWidth - margin.left - margin.right;
      var height = availableHeight - margin.top - margin.bottom;

      this.$el.html("");

      var svg = d3.select(this.el)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .attr("pointer-events", "all")
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      // The returned object gets passed to updateView as viz
      return { container: this.$el, svg: svg, margin: margin};
    },

    // making the data look how we want it to for updateView to do its job
    formatData: function(data) {
      // getting settings
      var pageField = this.settings.get('pageField');
      var prev_pageField = this.settings.get('prev_pageField');
      var next_pageField = this.settings.get('next_pageField');
      var count1Field = this.settings.get('count1Field');
      var count2Field = this.settings.get('count2Field');

      // Format Splunk data for Sankey
      var collection = data;
      var n1_append = "_n-1";
      var n2_append = "_n-2";

      // create a list of all uniq nodes for the sankey diagram
      var nodeList = _.uniq(_.pluck(collection, prev_pageField)
        .concat(pluck(collection, pageField, n1_append))
        .concat(pluck(collection, next_pageField, n2_append)));

      // TODO: this is an ugly bugfix because some values in nodeList
      //  can be undefined. has maybe to do with enconding??
      for (var i = 0; i<nodeList.length; i++) {
        var s = nodeList[i];
        if (typeof s == "undefined") {
          nodeList[i] = "";
        }
      }

      var links = []

      // temporary array because streamstats count delivers duplicate entries
      var p_pp_paths = [];
      var pp_ppp_paths = [];

      for (var i=0; i < collection.length; i++) {
        var c1 = collection[i][count1Field];
        var c2 = collection[i][count2Field];
        var p = collection[i][prev_pageField];

        try {
          // create page to n1_page relation
          pp = collection[i][pageField].concat(n1_append);
          p_pp_path = p.concat(pp);
          var s = p_pp_paths.indexOf(p_pp_path);
          if (s  < 0) {
            p_pp_paths.push(p_pp_path);
            links.push({ 'source': parseInt(nodeList.indexOf(p)), 'target': parseInt(nodeList.indexOf(pp)), 'value':  c1})
          }

          // create n1_page to n2_page relation
          try {
            ppp = collection[i][next_pageField].concat(n2_append);
            pp_ppp_path = pp.concat(ppp);
            var s = pp_ppp_paths.indexOf(pp_ppp_path);
            if (s  < 0) {
              pp_ppp_paths.push(pp_ppp_path);
              links.push({ 'source': parseInt(nodeList.indexOf(pp)), 'target': parseInt(nodeList.indexOf(ppp)), 'value':  c2})
            }
          } catch (e) {
          }

        } catch (e) {
        }
      }

      var nodes = _.map(nodeList, function(node) { return { name: node } });
      var sankeychart = {'nodes': nodes, 'links': links}

      return sankeychart; // this is passed into updateView as 'data'
    },

    updateView: function(viz, data) {

      // Clear svg
      var svg1 = $(viz.svg[0]);
      svg1.empty();

      var availableWidth = parseInt(this.$el.width());
      var availableHeight = parseInt(this.$el.height());
      var width = availableWidth - viz.margin.left - viz.margin.right;
      var height = availableHeight - viz.margin.top - viz.margin.bottom;

      // adjust svg container width in case of browser windows resize
      var svg_container = d3.selectAll("svg")
        // follwoing line does not work, tell me why
        //.attr("height", availableHeight)
        .attr("width", availableWidth)

      var sankey = d3.sankey()
      .nodeWidth(15)
      .nodePadding(10)
      .size([width, height]);

      var path = sankey.link();

      sankey
      .nodes(data.nodes)
      .links(data.links)
      .layout(32);

      var graph = viz.svg;

      var uri = graph[0][0].baseURI.split("?")[0]

      // generate the link between the nodes
      var link = graph.append("g").selectAll(".link")
      .attr("class", "clickable")
      .data(data.links)
      .enter().append("path")
      .attr("class", "link")
      .attr("d", path)
      .style("stroke-width", function(d) { return Math.max(1, d.dy); })
      .sort(function(a, b) { return b.dy - a.dy; });

      link.append("title")
      .text(function(d) { return d.source.name.split(delim)[0] + " >> " + d.target.name.split(delim)[0] + "\n" + format(d.value); });

      // generate the node
      var node = graph.append("g").selectAll("a.node")
      .data(data.nodes)
      .enter().append("a")
      .attr("class", "node")
      // add hyperlink for drilldown
      .attr("xlink:href", function(d) { return uri +"?form.node_token="+  d.name.split(delim)[0]; })
      .attr("transform", function(d)  { return "translate(" + d.x + "," + d.y + ")"; })
      .call(d3.behavior.drag()
          .origin(function(d) { return d; })
          .on("dragstart", function() { this.parentNode.appendChild(this); })
          .on("drag", dragmove));

      node.append("rect")
      .attr("height", function(d) { return d.dy; })
      .attr("width", sankey.nodeWidth())
      .style("fill", function(d) {
        return d.color = color(d.name.replace(/ .*/, ""));
      })
      .style("stroke", function(d) { return d3.rgb(d.color).darker(2); })
      .append("title")
      .text(function(d) { return d.name.split(delim)[0] + "\n" + format(d.value); });

      node.append("text")
      .attr("x", -6)
      .attr("y", function(d) { return d.dy / 2; })
      .attr("dy", ".35em")
      .attr("text-anchor", "end")
      .attr("transform", null)
      .text(function(d) { return d.name.split(delim)[0]; })
      .filter(function(d) { return d.x < width/ 2; })
      .attr("x", 6 + sankey.nodeWidth())
      .attr("text-anchor", "start");

      sankey.relayout();

      function dragmove(d) {
        d3.select(this).attr("transform", "translate(" + d.x + "," + (d.y = Math.max(0, Math.min(height - d.dy, d3.event.y))) + ")");
        sankey.relayout();
        link.attr("d", path);
      }

    }
  });
  return SankeyView;
});
