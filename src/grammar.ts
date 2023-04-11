// Generated automatically by nearley, version 2.20.1
// http://github.com/Hardmath123/nearley
// Bypasses TS6133. Allow declared but unused functions.
// @ts-ignore
function id(d: any[]): any {
  return d[0];
}
declare var newline: any;
declare var string: any;
declare var keyword: any;
declare var ws: any;
declare var count: any;
declare var path: any;
declare var url_with_error: any;
declare var misc: any;

import {compile, keywords, error} from 'moo';

const appendItem = function (a: number, b: number) {
  return function (d: any) {
    return d[a].concat(d[b]);
  };
};
const empty = function (d: any) {
  return [];
};

const lexer = compile({
  count: /(?:0|[1-9][0-9]*)\./,
  ws: /[ \t]+/,
  keyword: ['Error:', 'Broken link in', 'to'],
  misc: [':'],
  path: /(?:(?:.\/|\/)[.a-zA-Z0-9_-]+)+/,
  url_with_error: /\w*?:\/\/.*?(?=: )/,
  string: /(?!\s*$).+/,
  lexerError: error,
  newline: {match: '\n', lineBreaks: true}
});

interface NearleyToken {
  value: any;
  [key: string]: any;
}

interface NearleyLexer {
  reset: (chunk: string, info: any) => void;
  next: () => NearleyToken | undefined;
  save: () => any;
  formatError: (token: never) => string;
  has: (tokenType: string) => boolean;
}

interface NearleyRule {
  name: string;
  symbols: NearleySymbol[];
  postprocess?: (d: any[], loc?: number, reject?: {}) => any;
}

type NearleySymbol = string | {literal: any} | {test: (token: any) => boolean};

interface Grammar {
  Lexer: NearleyLexer | undefined;
  ParserRules: NearleyRule[];
  ParserStart: string;
}

const grammar: Grammar = {
  Lexer: lexer,
  ParserRules: [
    {name: 'input', symbols: ['row'], postprocess: id},
    {
      name: 'input',
      symbols: [
        'input',
        lexer.has('newline') ? {type: 'newline'} : newline,
        'row'
      ],
      postprocess: appendItem(0, 2)
    },
    {name: 'row', symbols: ['broke_link_message']},
    {name: 'row', symbols: ['error']},
    {name: 'row', symbols: [], postprocess: empty},
    {
      name: 'error_message',
      symbols: [lexer.has('string') ? {type: 'string'} : string],
      postprocess: function (data) {
        return data[0]['value'];
      }
    },
    {
      name: 'error',
      symbols: [
        lexer.has('keyword') ? {type: 'keyword'} : keyword,
        lexer.has('ws') ? {type: 'ws'} : ws,
        'error_message'
      ],
      postprocess: function (data) {
        return {error_message: data[2]};
      }
    },
    {name: 'prefix', symbols: []},
    {name: 'prefix', symbols: [lexer.has('ws') ? {type: 'ws'} : ws]},
    {
      name: 'broke_link_message',
      symbols: [
        'prefix',
        lexer.has('count') ? {type: 'count'} : count,
        lexer.has('ws') ? {type: 'ws'} : ws,
        lexer.has('keyword') ? {type: 'keyword'} : keyword,
        lexer.has('ws') ? {type: 'ws'} : ws,
        lexer.has('path') ? {type: 'path'} : path,
        lexer.has('ws') ? {type: 'ws'} : ws,
        lexer.has('keyword') ? {type: 'keyword'} : keyword,
        lexer.has('ws') ? {type: 'ws'} : ws,
        lexer.has('url_with_error') ? {type: 'url_with_error'} : url_with_error,
        lexer.has('misc') ? {type: 'misc'} : misc,
        lexer.has('ws') ? {type: 'ws'} : ws,
        lexer.has('string') ? {type: 'string'} : string
      ],
      postprocess: function (data) {
        return {
          file: data[5]['value'],
          url: data[9]['value'],
          error_message: data[12]['value']
        };
      }
    }
  ],
  ParserStart: 'input'
};

export default grammar;
