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


define([
    'underscore',
    'jquery',
    'splunkjs/mvc/basesplunkview',
    'splunkjs/mvc',
    'splunkjs/mvc/simplexml/ready!'
], function(_, $, BaseSplunkView, mvc) {

   // adjust the path according to your app name 
   var expand = "/static/app/custom_simplexml_extensions/expand.png"
   var collapse = "/static/app/custom_simplexml_extensions/collapse.png"


    var SlidePanelView = BaseSplunkView.extend({
        events: {
            'click .slideButton': function(e) {
                var img = $(e.currentTarget);
                var items = img.data('item');
                _(items).each(function(id) {
                  var component = mvc.Components.get(id);
                  if (component) {
                    component.$el.slideToggle(1000);
                    // SVG panels (i.e. bubblechart) need a resize event after toggling
                    component.$el.resize();
                }
                });
                img.attr("src", img.attr("src") == expand ? collapse: expand);
            }
        },
        render: function() {
            this.$('.btn-pill').remove();
            if (this.settings.has('items')) {
                var hide = this.settings.get('hide') || "no"
                var items = this.settings.get('items'), $el = this.$el;
                var first_panel = mvc.Components.get(items[0]);
                var h = $('<h2></h2>');
                var title = this.settings.get("title") || "";
                var img = $('<img class="slideButton" style="float: right; padding-right: 15px; cursor: pointer" />'); 
                img.attr('src', collapse);
                img.attr('alt', '#' + items[0]).data('item', items);
                img.appendTo($el);
                h.text(title);
                h.appendTo($el);
                if (hide == "yes") {
                  // initially toggle elements with option hide=yes 
                  img.attr('src', expand);
                  _(items).each(function(id) {
                    var component = mvc.Components.get(id);
                    if (component) {
                      component.$el.hide();
                    }
                  });
                }  
            }
            return this;
        }
    });
    return SlidePanelView;
});
