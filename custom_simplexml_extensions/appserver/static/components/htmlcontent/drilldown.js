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
    var BaseSplunkView = require("splunkjs/mvc/basesplunkview");

    var LinkSearch = BaseSplunkView.extend({

        options: {
            managerid: null,
            searchstring: null,
            linkstring: null
        },

        initialize: function(options) {
          this.configure();
          this.settings.on("change:searchstring", this.render, this);
          this.settings.on("change:linkstring", this.render, this);
          this.$div = $('<div></div>');
        },

        render: function() {
          this.$div.empty()
          this.$div.appendTo(this.$el);
          var uri = this.getURI();
          var searchstring = this.settings.get('searchstring') || "";
          var linkstring = this.settings.get('linkstring') || "Link to Details";
          var query = "search?q=search%20"+encodeURIComponent(searchstring);
          var link = uri+query;
          var a = $('<a>').attr("href", link).text(linkstring);
          a.appendTo(this.$div);
          return this;
        },

        getURI: function () {
          var loc = window.location;
          var pathName = loc.pathname.substring(0, loc.pathname.lastIndexOf('/') + 1);
          return loc.href.substring(0, loc.href.length - ((loc.pathname + loc.search + loc.hash).length - pathName.length));
        },
    });
    return LinkSearch;
});
