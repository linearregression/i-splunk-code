This App provides a few SimpleMXL extensions for Splunk

=== Configure ===
no custom configs for this release

=== Troubleshoot ===
Some of the javascript files and XML views use static paths that include the app
directory name. If you use these examples in your own custom Splunk apps, you
have to adjust the paths in the appropriate files.

search the static paths i.e. with following command on Linux
#> grep -R custom_simplexml_extensions *

I know, using static paths is ugly coding. But time was short and if you
have a better solution, please let me know

== Professional Services and Support ==
their is no professional service and no committed support for this app

== Licence and Terms of Use ==
   Copyright 2014 by mathias herzog, <mathu at gmx dot ch>

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.

=== Feedback ===
please provide feedback to <mathu at gmx dot ch>

