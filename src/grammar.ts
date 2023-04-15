// Generated automatically by nearley, version 2.20.1
// http://github.com/Hardmath123/nearley
// Bypasses TS6133. Allow declared but unused functions.
// @ts-ignore
function id(d: any[]): any { return d[0]; }
declare var newline: any;
declare var metaMessages: any;
declare var ws: any;
declare var number: any;
declare var misc: any;
declare var internalMetaMessage: any;
declare var string: any;
declare var keyword: any;
declare var count: any;
declare var path: any;
declare var url_with_error: any;

import { default as moo } from 'moo';
const  { compile, keywords, error } = moo;
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

interface NearleyToken {
  value: any;
  [key: string]: any;
};

interface NearleyLexer {
  reset: (chunk: string, info: any) => void;
  next: () => NearleyToken | undefined;
  save: () => any;
  formatError: (token: never) => string;
  has: (tokenType: string) => boolean;
};

interface NearleyRule {
  name: string;
  symbols: NearleySymbol[];
  postprocess?: (d: any[], loc?: number, reject?: {}) => any;
};

type NearleySymbol = string | { literal: any } | { test: (token: any) => boolean };

interface Grammar {
  Lexer: NearleyLexer | undefined;
  ParserRules: NearleyRule[];
  ParserStart: string;
};

const grammar: Grammar = {
  Lexer: lexer,
  ParserRules: [
    {"name": "stdOutInput", "symbols": ["stdOutRow"], "postprocess": id},
    {"name": "stdOutInput", "symbols": ["stdOutInput", (lexer.has("newline") ? {type: "newline"} : newline), "stdOutRow"], "postprocess": appendItem(0,2)},
    {"name": "stdOutInput", "symbols": ["input"], "postprocess": id},
    {"name": "stdOutRow", "symbols": ["metaMessage"], "postprocess": empty},
    {"name": "stdOutRow", "symbols": ["successReport"], "postprocess": 
        function(data) {
            return {
                successReport: data[0],
            };
        }
                    },
    {"name": "stdOutRow", "symbols": ["internalLinkMessage"], "postprocess": 
        function(data) {
            return {
                internal_links: data[0],
            };
        }
                    },
    {"name": "stdOutRow", "symbols": ["externalLinkCheckingWithSkippedLinkMessage"], "postprocess": 
        function(data) {
            return {
                external_links_planed_checking: data[0],
            };
        }
                    },
    {"name": "stdOutRow", "symbols": ["externalLinkCheckingMessage"], "postprocess": 
        function(data) {
            return {
                external_links_planed_checking: data[0],
            };
        }
                    },
    {"name": "stdOutRow", "symbols": ["externalLinkCheckingLinkMessage"], "postprocess": 
        function(data) {
            return {
                external_links_checked: data[0],
            };
        }
                    },
    {"name": "stdOutRow", "symbols": [], "postprocess": empty},
    {"name": "metaMessage", "symbols": [(lexer.has("metaMessages") ? {type: "metaMessages"} : metaMessages)]},
    {"name": "metaMessage", "symbols": [(lexer.has("metaMessages") ? {type: "metaMessages"} : metaMessages), (lexer.has("ws") ? {type: "ws"} : ws), (lexer.has("number") ? {type: "number"} : number), (lexer.has("misc") ? {type: "misc"} : misc)]},
    {"name": "successReport", "symbols": [(lexer.has("metaMessages") ? {type: "metaMessages"} : metaMessages), (lexer.has("ws") ? {type: "ws"} : ws), (lexer.has("number") ? {type: "number"} : number), (lexer.has("ws") ? {type: "ws"} : ws), (lexer.has("metaMessages") ? {type: "metaMessages"} : metaMessages), (lexer.has("number") ? {type: "number"} : number), (lexer.has("ws") ? {type: "ws"} : ws), (lexer.has("metaMessages") ? {type: "metaMessages"} : metaMessages), (lexer.has("ws") ? {type: "ws"} : ws), (lexer.has("number") ? {type: "number"} : number), (lexer.has("ws") ? {type: "ws"} : ws), (lexer.has("metaMessages") ? {type: "metaMessages"} : metaMessages)], "postprocess": 
        function(data) {
            return {
                pages: data[2]["value"],
                orphans: data[5]["value"],
                sections: data[9]["value"],
            };
        }
        },
    {"name": "internalLinkMessage", "symbols": [(lexer.has("internalMetaMessage") ? {type: "internalMetaMessage"} : internalMetaMessage), (lexer.has("ws") ? {type: "ws"} : ws), (lexer.has("number") ? {type: "number"} : number), (lexer.has("ws") ? {type: "ws"} : ws), (lexer.has("metaMessages") ? {type: "metaMessages"} : metaMessages)], "postprocess": 
        function(data) {
            return {
                total: data[2]["value"],
            };
        }
        },
    {"name": "externalLinkCheckingWithSkippedLinkMessage", "symbols": [(lexer.has("metaMessages") ? {type: "metaMessages"} : metaMessages), (lexer.has("ws") ? {type: "ws"} : ws), (lexer.has("number") ? {type: "number"} : number), (lexer.has("ws") ? {type: "ws"} : ws), (lexer.has("metaMessages") ? {type: "metaMessages"} : metaMessages), (lexer.has("ws") ? {type: "ws"} : ws), (lexer.has("metaMessages") ? {type: "metaMessages"} : metaMessages), (lexer.has("ws") ? {type: "ws"} : ws), (lexer.has("number") ? {type: "number"} : number), (lexer.has("ws") ? {type: "ws"} : ws), (lexer.has("metaMessages") ? {type: "metaMessages"} : metaMessages)], "postprocess": 
        function(data) {
            return {
                total: data[2]["value"],
                skipped: data[8]["value"]
            };
        }
        },
    {"name": "externalLinkCheckingMessage", "symbols": [{"literal":"Checking"}, (lexer.has("ws") ? {type: "ws"} : ws), (lexer.has("number") ? {type: "number"} : number), (lexer.has("ws") ? {type: "ws"} : ws), (lexer.has("metaMessages") ? {type: "metaMessages"} : metaMessages)], "postprocess": 
        function(data) {
            return {
                total: data[2]["value"],
            };
        }
        },
    {"name": "externalLinkCheckingLinkMessage", "symbols": [(lexer.has("metaMessages") ? {type: "metaMessages"} : metaMessages), (lexer.has("ws") ? {type: "ws"} : ws), (lexer.has("number") ? {type: "number"} : number), (lexer.has("ws") ? {type: "ws"} : ws), (lexer.has("metaMessages") ? {type: "metaMessages"} : metaMessages), (lexer.has("ws") ? {type: "ws"} : ws), (lexer.has("number") ? {type: "number"} : number), (lexer.has("ws") ? {type: "ws"} : ws), (lexer.has("metaMessages") ? {type: "metaMessages"} : metaMessages)], "postprocess": 
        function(data) {
            return {
                total: data[2]["value"],
                errors: data[6]["value"]
            };
        }
        },
    {"name": "input", "symbols": ["row"], "postprocess": id},
    {"name": "input", "symbols": ["input", (lexer.has("newline") ? {type: "newline"} : newline), "row"], "postprocess": appendItem(0,2)},
    {"name": "row", "symbols": ["broke_link_message"]},
    {"name": "row", "symbols": ["error"]},
    {"name": "row", "symbols": [], "postprocess": empty},
    {"name": "error_message", "symbols": [(lexer.has("string") ? {type: "string"} : string)], "postprocess": function(data) { return data[0]["value"]; }},
    {"name": "error", "symbols": [(lexer.has("keyword") ? {type: "keyword"} : keyword), (lexer.has("ws") ? {type: "ws"} : ws), "error_message"], "postprocess": function(data) { return {error_message: data[2]}; }},
    {"name": "prefix", "symbols": []},
    {"name": "prefix", "symbols": [(lexer.has("ws") ? {type: "ws"} : ws)]},
    {"name": "broke_link_message", "symbols": ["prefix", (lexer.has("count") ? {type: "count"} : count), (lexer.has("ws") ? {type: "ws"} : ws), (lexer.has("keyword") ? {type: "keyword"} : keyword), (lexer.has("ws") ? {type: "ws"} : ws), (lexer.has("path") ? {type: "path"} : path), (lexer.has("ws") ? {type: "ws"} : ws), (lexer.has("keyword") ? {type: "keyword"} : keyword), (lexer.has("ws") ? {type: "ws"} : ws), (lexer.has("url_with_error") ? {type: "url_with_error"} : url_with_error), (lexer.has("misc") ? {type: "misc"} : misc), (lexer.has("ws") ? {type: "ws"} : ws), (lexer.has("string") ? {type: "string"} : string)], "postprocess": 
        function(data) {
            return {
                file: data[5]["value"],
                url: data[9]["value"],
                error_message: data[12]["value"]
            };
        }
        }
  ],
  ParserStart: "stdOutInput",
};

export default grammar;
