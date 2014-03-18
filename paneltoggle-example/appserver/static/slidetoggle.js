//
// Toggle panels
//

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


require.config({
    paths: {
        "app": "../app"
    }
});
require(['splunkjs/mvc/simplexml/ready!'], function(){
  require(['splunkjs/ready!'], function(){
    // The splunkjs/ready loader script will automatically instantiate all elements
    // declared in the dashboard's HTML.

    $(".dashboard-row1 h3 :eq(0)").prepend('<img id="slideButton" src="/static/app/htmlcontent-example/expand.png" style="float: right; padding-right: 15px; cursor: pointer" />');


    $(document).ready(function(){
      expand = "/static/app/htmlcontent-example/expand.png"
      collapse = "/static/app/htmlcontent-example/collapse.png"
      // toggle status panel
      $("#slideButton").show();
      //$(".slide").toggle();
      //$(".chart .panel-body").toggle();
      $(".dashboard-row1").find(".chart .panel-body").toggle();
      $("#slideButton").click(function(){
        var $el = $(this);
        //$(".slide").slideToggle("slow");
        $el.attr("src", $el.attr("src") == expand ? collapse: expand);
        $(".dashboard-row1").find(".chart .panel-body").slideToggle();
        //var mysvg = document.getElementsByTagName("svg")[1]
        //mysvg.forceRedraw();
        //console.log(mysvg.clientHeight+1)
        var t= $(".dashboard-row1 #element2 .splunk-chart");
        t.height(251)
        console.log(t.height())
      });
    });
  });
});
