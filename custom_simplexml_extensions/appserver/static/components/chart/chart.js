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

    require("css!./chart.css");

    // create map out of a collection
    function pluck(arr, key) {
      return $.map(arr, function(e) {
        try {
          return e[key];
        } catch (e) {
          return "na";
      }
      });
    }

    var ChartView = SimpleSplunkView.extend({
        className: "splunk-view",
        options: {
            managerid: null,
            data: "preview",
        },

        output_mode: "json",

        initialize: function() {
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

        formatData: function(data) {
          var field = this.settings.get('version');
          var count = this.settings.get('count');
          return data;
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
            .attr("class", "chart")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            //.append("g")
            //.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

          // The returned object gets passed to updateView as viz
          return { container: this.$el, svg: svg, margin: margin};
        },

        updateView: function(viz, data) {

          d = [
            {"time": 1297110663, "value": 80},
            {"time": 1297110664, "value": 53},
            {"time": 1297110665, "value": 120},
            {"time": 1297110666, "value": 100},
            {"time": 1297110667, "value": 120},
            {"time": 1297110668, "value": 90},
            {"time": 1297110669, "value": 40},
            {"time": 1297110670, "value": 80},
            {"time": 1297110671, "value": 53},
            {"time": 1297110672, "value": 120},
            {"time": 1297110673, "value": 100},
            {"time": 1297110674, "value": 200},
            {"time": 1297110675, "value": 90},
            {"time": 1297110676, "value": 40}
          ]

          var svg1 = $(viz.svg[0]);
            svg1.empty();

          var margin = $(viz.margin)[0];
          var width = parseInt(this.$el.width());
          var height = parseInt(this.settings.get("height") || this.$el.height());
          width = width - margin.left - margin.right;
          height = height;

          w = 20;
          h = height;

          // adjust svg container width in case of browser windows resize
          var svg_container = d3.selectAll("svg")
            .attr("width", width)

          var chart = viz.svg;

          var x = d3.scale.linear()
              .domain([0, 1])
              .range([0, w]);

          var y = d3.scale.linear()
              .domain([0, height])
              .rangeRound([0, h]);

          var osList = _.uniq(_.pluck(data, this.settings.get('os')));

          chart.selectAll("rect")
              .data(d)
            .enter().append("rect")
              .attr("x", function(d, i) { return x(i) - .5; })
              .attr("y", function(d) { return height - y(d.value) - .5; })
              .attr("width", w)
              .attr("height", function(d) { return y(d.value); });

          chart.append("line")
              .attr("x1", 0)
              .attr("x2", w * d.length - .5)
              .attr("y1", height - .5)
              .attr("y2", height - .5)
              .style("stroke", "#000");

          // debug the js
          //this.$el.html("hello world");
      }
    });
    return ChartView;
});