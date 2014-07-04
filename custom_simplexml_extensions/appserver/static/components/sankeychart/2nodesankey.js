//
//   Copyright 2014 by mathias herzog, <mathu at gmx dot ch>
//
//   Licensed under the Apache License, Version 2.0 (the "License");
//   you may not use this file except in compliance with the License.
//   You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
//   Unless required by applicable law or agreed to in writing, software
//   distributed under the License is distributed on an "AS IS" BASIS,
//   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//   See the License for the specific language governing permissions and
//   limitations under the License.
//


// Sankey Chart
//
// this displays page flow information as sankey diagramm
// supports drilldown on a sankey node
//   the drilldown refers to the current dashboard, using form.page as token

// available settings:
// - currentField: the field for the first sankey nodes
// - next_Field: the field for the second sankey nodes
// - countField:  the count
// - height: the height of the panel

// ---expected data format---
// a splunk search like this: |rest splunk_server=local /servicesNS/-/-/authentication/users count=0 | stats count(roles) as count by realname roles

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
    var delim = "_n-";

    // create map out of a collection
    // concat the append-string to every extracted item of the collection
    function pluck(arr, key, append) {
      return $.map(arr, function(e) {
        try {
          return e[key].concat(append);
        } catch (e) {
          return "na";
      }
      });
    }

    var SankeyView = SimpleSplunkView.extend({

        className: "splunk-toolkit-sankey-chart",

        options: {
            managerid: null,
            data: "preview",
            currentField: null,
            countField: 'count',
            nextField: null
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
            this.settings.on("change:currentField", this.render, this);
            this.settings.on("change:nextField", this.render, this);
            this.settings.on("change:countField", this.render, this);

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

            var margin = {top: 0, right: 1, bottom: 8, left: 0};
            var availableWidth = parseInt(this.settings.get("width") || this.$el.width());
            var availableHeight = parseInt(this.settings.get("height") || this.$el.height());
            var width = availableWidth - margin.left - margin.right;
            var height = availableHeight - margin.top - margin.bottom;

            this.$el.html("");

            var svg = d3.select(this.el)
                .append("svg")
                .attr("width", width)
                .attr("height", height)
                .attr("pointer-events", "all")
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            var tooltip = d3.select(this.el).append("div")
                .attr("class", "sankey-chart-tooltip");

            // The returned object gets passed to updateView as viz
            return { container: this.$el, svg: svg, margin: margin, tooltip: tooltip};
        },

        // making the data look how we want it to for updateView to do its job
        formatData: function(data) {
            // getting settings
            var current_field = this.settings.get('currentField');
            var next_field = this.settings.get('nextField');
            var count_field = this.settings.get('countField');

            // Format Splunk data for Sankey
            var collection = data;
            var next_append = "_n-1";
            var nodeList = _.uniq(_.pluck(collection, current_field).concat(pluck(collection, next_field, next_append)));

            var links = []

            for (var i=0; i < collection.length; i++) {
              cp = collection[i][current_field]
              np = collection[i][next_field].concat(next_append)
              if (cp != np) {
                links.push({ 'source': parseInt(nodeList.indexOf(cp)), 'target': parseInt(nodeList.indexOf(np)), 'value': parseInt(collection[i]['count']) })
              }
            }

            id = "name";
            var nodes = _.map(nodeList, function(node) { return { name: node } });

            var sankeychart = {'nodes': nodes, 'links': links}
            //height = nodeList.length * 25;

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
            var that = this;

            // adjust svg container width in case of browser windows resize
            var svg_container = d3.selectAll("svg")
              .attr("width", width)

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
            .attr("xlink:href", function(d) { return uri +"?form.node="+  d.name.split(delim)[0]; })
            .attr("transform", function(d)  { return "translate(" + d.x + "," + d.y + ")"; })
            .call(d3.behavior.drag()
            .origin(function(d) { return d; })
            .on("dragstart", function() { this.parentNode.appendChild(this); })
            .on("drag", dragmove));

        node.append("rect")
            .attr("height", function(d) { return d.dy; })
            .attr("width", sankey.nodeWidth())
            .style("fill", function(d) { return d.color = color(d.name.replace(/ .*/, "")); })
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
