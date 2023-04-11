import {test} from '@jest/globals';
import {readFile, writeFile} from 'fs/promises';

import {Grammar, Parser} from 'nearley';
import grammar from '../src/grammar';

test('test parsing', async () => {
  // FIXME: Use path.join
  const data: string = await readFile(__dirname + '/test_data.txt', 'utf8');
  const parser: Parser = new Parser(Grammar.fromCompiled(grammar));
  parser.feed(data);
  await writeFile(__dirname + '/parsed.json', JSON.stringify(parser.results));
  //expect(delta).toBeGreaterThan(450)
});

test('test stdoutparsing', async () => {
  // FIXME: Use path.join
  const data: string = await readFile(
    __dirname + '/test_data_stdout.txt',
    'utf8'
  );
  const parser: Parser = new Parser(Grammar.fromCompiled(grammar));
  parser.feed(data);
  await writeFile(
    __dirname + '/parsed_stdout.json',
    JSON.stringify(parser.results)
  );
  //expect(delta).toBeGreaterThan(450)
});

test('test parsing with no faulty links', async () => {
  // FIXME: Use path.join
  const data: string = await readFile(
    __dirname + '/test_data_stdout_no_error.txt',
    'utf8'
  );
  const parser: Parser = new Parser(Grammar.fromCompiled(grammar));
  parser.feed(data);
  await writeFile(
    __dirname + '/parsed_stdout_no_error.json',
    JSON.stringify(parser.results)
  );

  // Check if we parse an empty stderr successfully
  const stdErrParser: Parser = new Parser(Grammar.fromCompiled(grammar));
  stdErrParser.feed('');
  //expect(delta).toBeGreaterThan(450)
});
