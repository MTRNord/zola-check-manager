@preprocessor typescript

@{%
import { compile, keywords, error } from 'moo';

const appendItem = function (a: number, b: number) { return function (d: any) { return d[a].concat(d[b]); } };
const empty = function (d: any) { return []; };

const lexer = compile({
  count:  /(?:0|[1-9][0-9]*)\./,
  ws:     /[ \t]+/,
  keyword: ["Error:", "Broken link in", "to"],
  misc: [":"],
  path:  /(?:(?:.\/|\/)[.a-zA-Z0-9_-]+)+/,
  url_with_error: /\w*?:\/\/.*?(?=: )/,
  string: /(?!\s*$).+/,
  lexerError: error,
  newline: {match: '\n', lineBreaks: true},
});
%}

# Pass your lexer object using the @lexer option:
@lexer lexer

# This is the whole input. We have newline delimited messages but we dont know the EOL
input -> row {% id %}
       | input %newline row {% appendItem(0,2) %}


row -> broke_link_message
     | error
     | null {% empty %}

# An Error message is just a string but this gives us slightly nicer types
error_message -> %string {% function(data) { return data[0]["value"]; } %}
# A message prefixed with "Error:"
error -> %keyword %ws error_message {% function(data) { return {error_message: data[2]}; } %}

# A Helper to allow easy checking if there is indentation or not
prefix -> null | %ws
# The main information about failed links
broke_link_message -> prefix %count %ws %keyword %ws %path %ws %keyword %ws %url_with_error %misc %ws %string {%
    function(data) {
        return {
            file: data[5]["value"],
            url: data[9]["value"],
            error_message: data[12]["value"]
        };
    }
%}