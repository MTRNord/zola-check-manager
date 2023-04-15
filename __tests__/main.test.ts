import {test} from '@jest/globals';
import {readFile, writeFile} from 'fs/promises';

import path, {dirname} from 'node:path';
import grammar from '../src/grammar.js';
import nock from 'nock';
import {fileURLToPath} from 'node:url';
// @ts-ignore
import nearly from 'nearley/lib/nearley.js';
import {closeSync, openSync} from 'node:fs';
const {Grammar, Parser} = nearly;

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('parser test suite', () => {
  test('test parsing', async () => {
    const data: string = await readFile(
      path.join(__dirname, '/test_data.txt'),
      'utf8'
    );
    const parser: typeof Parser = new Parser(Grammar.fromCompiled(grammar));
    parser.feed(data);
    await writeFile(__dirname + '/parsed.json', JSON.stringify(parser.results));
    //expect(delta).toBeGreaterThan(450)
  });

  test('test stdoutparsing', async () => {
    const data: string = await readFile(
      path.join(__dirname, '/test_data_stdout.txt'),
      'utf8'
    );
    const parser: typeof Parser = new Parser(Grammar.fromCompiled(grammar));
    parser.feed(data);
    await writeFile(
      __dirname + '/parsed_stdout.json',
      JSON.stringify(parser.results)
    );
    //expect(delta).toBeGreaterThan(450)
  });

  test('test parsing with no faulty links', async () => {
    const data: string = await readFile(
      path.join(__dirname, '/test_data_stdout_no_error.txt'),
      'utf8'
    );
    const parser: typeof Parser = new Parser(Grammar.fromCompiled(grammar));
    parser.feed(data);
    await writeFile(
      __dirname + '/parsed_stdout_no_error.json',
      JSON.stringify(parser.results)
    );

    // Check if we parse an empty stderr successfully
    const stdErrParser: typeof Parser = new Parser(
      Grammar.fromCompiled(grammar)
    );
    stdErrParser.feed('');
    //expect(delta).toBeGreaterThan(450)
  });
});

describe('action test suite', () => {
  it('It generates checks for the broken link in the test_page folder', async () => {
    const workingDirectory = './test_page';
    const repoToken = 'token';
    const conclusion_level = 'neutral';

    process.env['INPUT_WORKING_DIRECTORY'] = workingDirectory;
    process.env['INPUT_CONCLUSION_LEVEL'] = conclusion_level;
    process.env['INPUT_REPO-TOKEN'] = repoToken;

    process.env['GITHUB_REPOSITORY'] = 'foo/bar';
    process.env['GITHUB_STEP_SUMMARY'] = path.join(__dirname, 'summary');
    process.env['GITHUB_SHA'] = '1234';
    closeSync(openSync(process.env['GITHUB_STEP_SUMMARY'], 'w'));
    process.env['GITHUB_EVENT_PATH'] = path.join(__dirname, 'payload.json');
    process.env['RUNNER_TOOL_CACHE'] = path.join(__dirname, 'tool_cache');
    process.env['RUNNER_TEMP'] = path.join(__dirname, 'tool_temp');

    nock('https://api.github.com')
      .persist()
      .post(
        '/repos/foo/bar/check-runs',
        '{"name":"Zola Check","head_sha":"1234","status":"completed","conclusion":"neutral","output":{"title":"Link is not reachable","summary":"Zola check found links which are not reachable. Make sure to either ignore these due to being false positives or fixing them","annotations":[{"path":"/test_page/content/blog/second.md","start_line":7,"end_line":7,"start_column":34,"end_column":63,"annotation_level":"","message":"Zola Error Message: Client error status code (404 Not Found) received"}]}}'
      )
      .reply(201);

    const main = await import('../src/main.js');

    await main.run();
  });
});
