//  d3.js Sunburst chart for Splunk

/*   Copyright 2014 by mathias herzog, <mathu at gmx dot ch>

   The Code for d3.js sunburst sequece diagramm originally comes from
   http://bl.ocks.org/kerryrodden
   http://bl.ocks.org/kerryrodden/7090426

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.

   this chart displays page flow information as sunburst diagramm
 */

define(function(require, exports, module) {

  var _ = require('underscore');
  var SimpleSplunkView = require("splunkjs/mvc/simplesplunkview");
  require("css!./sunburst.css");
  require("./d3.v2.min");

  // Breadcrumb dimensions: width, height, spacing, width of tip/tail.
  var b = {
    w: 75, h: 30, s: 3, t: 10
  };

  var color = d3.scale.category20c();

  var SunburstView = SimpleSplunkView.extend({
    className: "splunk-toolkit-sunburst-chart",
    options: {
      managerid: null,
      data: "preview",
      pageField: null
    },

    initialize: function() {
      SimpleSplunkView.prototype.initialize.apply(this, arguments);
      this.settings.on("change:pageField", this.render, this);
      $(window).resize(this, _.debounce(this._handleResize, 20));
    },

    _handleResize: function(e){
      e.data.render();
    },

    createView: function() {
      var margin = {top: 10, right: 0, bottom: 10, left: 0};
      var availableWidth = parseInt(this.settings.get("width") || this.$el.width());
      var availableHeight = parseInt(this.settings.get("height") || this.$el.height());
      var width = availableWidth - margin.left - margin.right;
      var height = availableHeight - margin.top - margin.bottom;

      this.$el.html("");

      this.$el.append("<div id=\"sequence\"></div>")
      this.$el.append("<div id=\"explanation\" style=\"visibility: hidden;\" ><span id=\"percentage\"></span> &nbsp; of visits begin with this sequence of pages</div>")

      var svg = d3.select(this.el)
        .append("svg:svg")
        .attr("width", width)
        .attr("height", height)
        .append("svg:g")
        .attr("id", "container")
        .attr("transform", "translate(" + width / 2 + "," + height / 2   +  ")");

      // initialize breadccrump trail
      // Add the svg area.
      var trail = d3.select("#sequence").append("svg:svg")
          .attr("width", width)
          .attr("height", 30)
          .attr("id", "trail");

      // The returned object gets passed to updateView as viz
      return { container: this.$el, svg: svg, margin: margin};
    },

    // making the data look how we want it to for updateView to do its job
    formatData: function(data) {
      // getting settings
      var pageField = this.settings.get('pageField');

      return data; // this is passed into updateView as 'data'
    },

    updateView: function(viz, data) {
      // clear svg
      var svg1 = $(viz.svg[0]);
      svg1.empty();

      var availableWidth = parseInt(this.$el.width());
      var availableHeight = parseInt(this.$el.height());
      var width = availableWidth - viz.margin.left - viz.margin.right;
      var height = availableHeight - viz.margin.top - viz.margin.bottom;
      var radius = Math.min(width, height) / 2 - 30;

      // adjust svg container width in case of browser windows resize
      var svg_container = d3.selectAll("svg")
        // follwoing line does not work, tell me why
        //.attr("height", availableHeight)
        .attr("width", availableWidth)

      var partition = d3.layout.partition()
        .size([2 * Math.PI, radius * radius])
        .value(function(d) { return d.size; });

      var arc = d3.svg.arc()
        .startAngle(function(d) { return d.x; })
        .endAngle(function(d) { return d.x + d.dx; })
        .innerRadius(function(d) { return Math.sqrt(d.y); })
        .outerRadius(function(d) { return Math.sqrt(d.y + d.dy); });

      var graph = viz.svg
        .attr("width", width)
        .attr("height", height)
        .attr("transform", "translate(" + width / 2 + "," + height / 2 +  ")");

      var json = buildHierarchy(data);
      createVisualization(json);

      // Main function to draw and set up the visualization, once we have the data.
      function createVisualization(json) {

        // TODO: enable and move to createView
        // drawLegend();
        d3.select("#togglelegend").on("click", toggleLegend);

        // Bounding circle underneath the sunburst, to make it easier to detect
        // when the mouse leaves the parent g.
        graph.append("svg:circle")
            .attr("r", radius)
            .style("opacity", 0);

        // For efficiency, filter nodes to keep only those large enough to see.
        var nodes = partition.nodes(json)
            .filter(function(d) {
              return (d.dx > 0.005); // 0.005 radians = 0.29 degrees
            });

        var path = graph.data([json]).selectAll("path")
            .data(nodes)
            .enter().append("svg:path")
            .attr("display", function(d) { return d.depth ? null : "none"; })
            .attr("d", arc)
            .attr("fill-rule", "evenodd")
            .style("fill", function(d) { return color(d.name); })
            .style("opacity", 1)
            .on("mouseover", mouseover);

        var svg_container = this.$.find("svg")

        // Add the mouseleave handler to the bounding circle.
        d3.select("#container").on("mouseleave", mouseleave);

        // Get total size of the tree = value of root node from partition.
        totalSize = path.node().__data__.value;
       };

      // Fade all but the current sequence, and show it in the breadcrumb trail.
      function mouseover(d) {

        var percentage = (100 * d.value / totalSize).toPrecision(3);
        var percentageString = percentage + "%";
        if (percentage < 0.1) {
          percentageString = "< 0.1%";
        }

        d3.select("#percentage")
            .text(percentageString);

        d3.select("#explanation")
            .style("visibility", "");

        var sequenceArray = getAncestors(d);
        updateBreadcrumbs(sequenceArray, percentageString);

        // Fade all the segments.
        d3.selectAll("path")
            .style("opacity", 0.3);

        // Then highlight only those that are an ancestor of the current segment.
        graph.selectAll("path")
            .filter(function(node) {
                      return (sequenceArray.indexOf(node) >= 0);
                    })
            .style("opacity", 1);
      }

      // Restore everything to full opacity when moving off the visualization.
      function mouseleave(d) {

        // Hide the breadcrumb trail
        d3.select("#trail")
            .style("visibility", "hidden");

        // Deactivate all segments during transition.
        d3.selectAll("path").on("mouseover", null);

        // Transition each segment to full opacity and then reactivate it.
        d3.selectAll("path")
            .transition()
            .duration(1000)
            .style("opacity", 1)
            .each("end", function() {
                    d3.select(this).on("mouseover", mouseover);
                  });

        d3.select("#explanation")
            .transition()
            .duration(1000)
            .style("visibility", "hidden");
      }

      // Given a node in a partition layout, return an array of all of its ancestor
      // nodes, highest first, but excluding the root.
      function getAncestors(node) {
        var path = [];
        var current = node;
        while (current.parent) {
          path.unshift(current);
          current = current.parent;
        }
        return path;
      }

      // Generate a string that describes the points of a breadcrumb polygon.
      function breadcrumbPoints(d, i) {
        var points = [];
        points.push("0,0");
        points.push(d.width + ",0");
        points.push(d.width + b.t + "," + (b.h / 2));
        points.push(d.width + "," + b.h);
        points.push("0," + b.h);
        if (i > 0) { // Leftmost breadcrumb; don't include 6th vertex.
          points.push(b.t + "," + (b.h / 2));
        }
        return points.join(" ");
      }

      // Update the breadcrumb trail to show the current sequence and percentage.
      function updateBreadcrumbs(nodeArray, percentageString) {

        // Data join; key function combines name and depth (= position in sequence).
        var g = d3.select("#trail")
            .selectAll("g")
            .data(nodeArray, function(d) { return d.name + d.depth; });

        // Add breadcrumb and label for entering nodes.
        var entering = g.enter().append("svg:g");

        entering.append("svg:polygon")
            .style("fill", function(d) { return color(d.name); })

        entering.append("svg:text")
            .attr("y", b.h / 2)
            .attr("dy", "0.35em")
            .attr("text-anchor", "middle")
            .text(function(d) {
               return d.name;
            })
            .style("font-size", function(d) {
              d.width = this.getComputedTextLength() + 30
              return Math.min(2 * d.r, (2 * d.r - 8) / this.getComputedTextLength() * 24) + "px";
            })
            .attr("x", function(d) {
              return (d.width + b.t) / 2
              })

        d3.selectAll("polygon")
          .attr("points", breadcrumbPoints)
          .style("fill", function(d) {
            return color(d.name)
          })

        total_w = 0;

        // Set position for entering and updating nodes.
        g.attr("transform", function(d, i) {
          var trans = "translate(" + total_w + ", 0)";
          total_w = total_w +  d.width + b.s
          var t = total_w;
          var n = d.name;
          var w = d.width;
          return trans
        });

        // Remove exiting nodes.
        g.exit().remove();

        // Make the breadcrumb trail visible, if it's hidden.
        d3.select("#trail")
            .style("visibility", "");
      }

      function drawLegend() {
        // Dimensions of legend item: width, height, spacing, radius of rounded rect.
        var li = {
          w: 75, h: 30, s: 3, r: 3
        };

        var legend = d3.select("#legend").append("svg:svg")
            .attr("width", li.w)
            .attr("height", d3.keys(colors).length * (li.h + li.s));

        var g = legend.selectAll("g")
            .data(d3.entries(colors))
            .enter().append("svg:g")
            .attr("transform", function(d, i) {
                    return "translate(0," + i * (li.h + li.s) + ")";
                 });

        g.append("svg:rect")
            .attr("rx", li.r)
            .attr("ry", li.r)
            .attr("width", li.w)
            .attr("height", li.h)
            .style("fill", function(d) { return d.value; });

        g.append("svg:text")
            .attr("x", li.w / 2)
            .attr("y", li.h / 2)
            .attr("dy", "0.35em")
            .attr("text-anchor", "middle")
            .text(function(d) { return d.key; });
      }

      function toggleLegend() {
        var legend = d3.select("#legend");
        if (legend.style("visibility") == "hidden") {
          legend.style("visibility", "");
        } else {
          legend.style("visibility", "hidden");
        }
      }


      // Take a 2-column CSV and transform it into a hierarchical structure suitable
      // for a partition layout. The first column is a sequence of step names, from
      // root to leaf, separated by hyphens. The second column is a count of how
      // often that sequence occurred.
      function buildHierarchy(csv) {
        var root = {"name": "root", "children": []};
        for (var i = 0; i < csv.length; i++) {
          var sequence = csv[i][0];
          var size = +csv[i][1];
          if (isNaN(size)) { // e.g. if this is a header row
            continue;
          }
          var parts = sequence.split("-");
          var currentNode = root;
          for (var j = 0; j < parts.length; j++) {
            var children = currentNode["children"];
            var nodeName = parts[j];
            var childNode;
            if (j + 1 < parts.length) {
         // Not yet at the end of the sequence; move down the tree.
        var foundChild = false;
        for (var k = 0; k < children.length; k++) {
          if (children[k]["name"] == nodeName) {
            childNode = children[k];
            foundChild = true;
            break;
          }
        }
        // If we don't already have a child node for this branch, create it.
        if (!foundChild) {
          childNode = {"name": nodeName, "children": []};
          children.push(childNode);
        }
        currentNode = childNode;
            } else {
        // Reached the end of the sequence; create a leaf node.
        childNode = {"name": nodeName, "size": size};
        children.push(childNode);
            }
          }
        }
        return root;
      };
    }
  });
  return SunburstView;
});
