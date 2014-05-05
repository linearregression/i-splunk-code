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

//
//   d3.js brush example
//

define(function(require, exports, module) {
    var _ = require('underscore');
    var SimpleSplunkView = require('splunkjs/mvc/simplesplunkview');

    require("css!./simple-brush.css");



    var BrushView = SimpleSplunkView.extend({
        className: "splunk-view",
        options: {
            managerid: null,
            data: "preview",
        },

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
            // this.settings.on("change:currentField", this.render, this);

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
          // Here we wet up the initial view layout

          var margin = {top: 20, right: 0, bottom: 20, left: 0},
            width = parseInt(this.$el.width());
            height = parseInt(this.settings.get("height") || this.$el.height());

            width = width - margin.left - margin.right;
            height = height - margin.top - margin.bottom;

          this.$el.html("");

          var svg = d3.select(this.el)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

          // The returned object gets passed to updateView as viz
          return { container: this.$el, svg: svg, margin: margin};
        },

        updateView: function(viz, data) {

          var svg1 = $(viz.svg[0]);
            svg1.empty();

          var margin = $(viz.margin)[0];
          var width = parseInt(this.$el.width());
          width = width - margin.left - margin.right;

          // adjust svg container width in case of browser windows resize
          var svg_container = d3.selectAll("svg")
            .attr("width", width)

          var x = d3.time.scale()
            .domain([new Date(2013, 2, 1), new Date(2013, 2, 15) - 1])
            .range([0, width]);

          var brush = d3.svg.brush()
            .x(x)
            .extent([new Date(2013, 2, 2), new Date(2013, 2, 3)])
            .on("brush", brushed);

          function brushed() {
            var extent0 = brush.extent(),
                extent1;

            // if dragging, preserve the width of the extent
            if (d3.event.mode === "move") {
              var d0 = d3.time.day.round(extent0[0]),
                  d1 = d3.time.day.offset(d0, Math.round((extent0[1] - extent0[0]) / 864e5));
              extent1 = [d0, d1];
            }

            // otherwise, if resizing, round both dates
            else {
              extent1 = extent0.map(d3.time.day.round);

              // if empty when rounded, use floor & ceil instead
              if (extent1[0] >= extent1[1]) {
                extent1[0] = d3.time.day.floor(extent0[0]);
                extent1[1] = d3.time.day.ceil(extent0[1]);
              }
            }
            d3.select(this).call(brush.extent(extent1));
          }


          // adjust svg container width in case of browser windows resize
          //var svg = d3.selectAll("svg")
          var svg = viz.svg
            .attr("width", width)

          svg.append("rect")
            .attr("class", "grid-background")
            .attr("width", width)
            .attr("height", height);

          svg.append("g")
            .attr("class", "x grid")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.svg.axis()
            .scale(x)
            .orient("bottom")
            .ticks(d3.time.hours, 12)
            .tickSize(-height)
            .tickFormat(""))

         .selectAll(".tick")
            .classed("minor", function(d) { return d.getHours(); });

          svg.append("g")
              .attr("class", "x axis")
              .attr("transform", "translate(0," + height + ")")
              .call(d3.svg.axis()
                .scale(x)
                .orient("bottom")
                .ticks(d3.time.days)
                .tickPadding(0))
            .selectAll("text")
              .attr("x", 6)
              .style("text-anchor", null);

          var gBrush = svg.append("g")
              .attr("class", "brush")
              .call(brush);

          gBrush.selectAll("rect")
              .attr("height", height);

        }
    });
    return BrushView;
});