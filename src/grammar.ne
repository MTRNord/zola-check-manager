@preprocessor typescript

@{%
import { compile, keywords, error } from 'moo';

const appendItem = function (a: number, b: number) { return function (d: any) { return d[a].concat(d[b]); } };
const empty = function (d: any) { return []; };

const lexer = compile({
  count:  /(?:0|[1-9][0-9]*)\./,
  ws:     /[ \t]+/,
  keyword: ["Error:", "Broken link in", "to"],
  number: /[0-9]+/,
  internalMetaMessage: ["> Successfully checked"],
  metaMessages: ["pages (", "orphan),", "sections", "-> Site content:", "Checking site...", "Checking all internal links with anchors.", "internal link(s) with anchors.", "Checking", "external link(s).", "Skipping", "> Checked", "external link(s):", "error(s) found.", "Done in"],
  misc: [":", "ms."],
  path:  /(?:(?:.\/|\/)[.a-zA-Z0-9_-]+)+/,
  url_with_error: /\w*?:\/\/.*?(?=: )/,
  string: /(?!\s*$).+/,
  lexerError: error,
  newline: {match: '\n', lineBreaks: true}
});
%}

# Pass your lexer object using the @lexer option:
@lexer lexer

# Meta info is in stdOut
stdOutInput -> stdOutRow {% id %}
             | stdOutInput %newline stdOutRow {% appendItem(0,2) %}
             | input

stdOutRow -> metaMessage {% empty %}
           | successReport {%
                function(data) {
                    return {
                        successReport: data[0],
                    };
                }
            %}
           | internalLinkMessage {%
                function(data) {
                    return {
                        internal_links: data[0],
                    };
                }
            %}
           | externalLinkCheckingWithSkippedLinkMessage {%
                function(data) {
                    return {
                        external_links_planed_checking: data[0],
                    };
                }
            %}
           | externalLinkCheckingMessage {%
                function(data) {
                    return {
                        external_links_planed_checking: data[0],
                    };
                }
            %}
           | externalLinkCheckingLinkMessage {%
                function(data) {
                    return {
                        external_links_checked: data[0],
                    };
                }
            %}
           | null {% empty %}

metaMessage -> %metaMessages
             | %metaMessages %ws %number %misc
successReport -> %metaMessages %ws %number %ws %metaMessages %number %ws %metaMessages %ws %number %ws %metaMessages {%
    function(data) {
        return {
            pages: data[2]["value"],
            orphans: data[5]["value"],
            sections: data[9]["value"],
        };
    }
%}
internalLinkMessage -> %internalMetaMessage %ws %number %ws %metaMessages {%
    function(data) {
        return {
            total: data[2]["value"],
        };
    }
%}
externalLinkCheckingWithSkippedLinkMessage -> %metaMessages %ws %number %ws %metaMessages %ws %metaMessages %ws %number %ws %metaMessages {%
    function(data) {
        return {
            total: data[2]["value"],
            skipped: data[8]["value"]
        };
    }
%}
externalLinkCheckingMessage -> "Checking" %ws %number %ws %metaMessages {%
    function(data) {
        return {
            total: data[2]["value"],
        };
    }
%}

externalLinkCheckingLinkMessage -> %metaMessages %ws %number %ws %metaMessages %ws %number %ws %metaMessages {%
    function(data) {
        return {
            total: data[2]["value"],
            errors: data[6]["value"]
        };
    }
%}

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