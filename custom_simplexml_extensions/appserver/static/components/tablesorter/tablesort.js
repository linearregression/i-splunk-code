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

define(function(require, exports, module) {
    var _ = require('underscore');
    var mvc = require('splunkjs/mvc');
    var SimpleSplunkView = require('splunkjs/mvc/simplesplunkview');

    require("css!./css/theme.blue.css");
    require("./js/jquery.tablesorter");
    require("./js/jquery.tablesorter.widgets");
    require("css!./pager/jquery.tablesorter.pager.css");
    require("./pager/jquery.tablesorter.pager");
    require("./json-to-table");

    var TableView = SimpleSplunkView.extend({
        className: "splunk-view",
        options: {
            managerid: null,
            data: "preview",
            tableId: "tableId"
        },

        output_mode: "json",

        createView: function() {
            this.$el.html('');
            return true;
        },

        updateView: function(viz, data) {
            // console.log("The data object: ", data);
            var tableId = this.settings.get("tableId") || "";
            var htmlTableId = "#"+tableId;
            var jsonHtmlTable = ConvertJsonToTable(data, tableId, "table" , null);
            this.$el.html(jsonHtmlTable);

            var pager = ' \
            <tr> \
              <th colspan="7" class="ts-pager form-horizontal"> \
                <!-- <button type="button" class="btn first"><i class="icon-step-backward glyphicon glyphicon-step-backward"></i></button> -->\
                <button type="button" class="btn prev"><i class="icon-arrow-left glyphicon glyphicon-backward"></i></button> \
                <span class="pagedisplay"></span> <!-- this can be any element, including an input --> \
                <button type="button" class="btn next"><i class="icon-arrow-right glyphicon glyphicon-forward"></i></button> \
                <!-- <button type="button" class="btn last"><i class="icon-step-forward glyphicon glyphicon-step-foward"></i></button> --> \
                <select class="pagesize input-mini" title="Select page size"> \
                <option selected="selected" value="10">10</option> \
                <option value="20">20</option> \
                <option value="30">30</option> \
                <option value="40">40</option> \
                <option value="100">100</option> \
                </select> \
                  <select class="pagenum input-mini" title="Select page number"></select> \
              </th> \
            </tr> \
            ';

            $(htmlTableId).after(pager);

            $(function(){
              // Initialize tablesorter
              // ***********************
              $(htmlTableId)
                .tablesorter({
                  theme: 'blue',
                  headerTemplate : '{content} {icon}', // new in v2.7. Needed to add the bootstrap icon!
                  widthFixed: true,
                  widgets: [ 'zebra', 'filter'],
                  widgetOptions : {
                    // using the default zebra striping class name, so it actually isn't included in the theme variable above
                    // this is ONLY needed for bootstrap theming if you are using the filter widget, because rows are hidden
                    // zebra : ["even", "odd"],

                    // reset filters button
                    // filter_reset : ".reset"

                    // set the uitheme widget to use the bootstrap theme class names
                    // this is no longer required, if theme is set
                    // ,uitheme : "bootstrap"
                  }
                })

                // initialize the pager plugin
                // ****************************
                .tablesorterPager({
                  container: $(".ts-pager"),
                  cssGoto  : ".pagenum",
                  removeRows: false,
                  output: '{startRow} - {endRow} / {filteredRows} ({totalRows})'
                });
            });
        }
    });
    return TableView;
});
