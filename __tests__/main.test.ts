import {expect, test} from '@jest/globals';
import {readFile, writeFile} from 'fs/promises';

import {Grammar, Parser} from 'nearley';
import grammar from '../src/grammar';

test('test parsing', async () => {
  // FIXME: Use path.join
  const data: string = await readFile(__dirname + '/test_data.txt', 'utf8');
  let parser: Parser = new Parser(Grammar.fromCompiled(grammar));
  parser.feed(data);
  await writeFile(__dirname + '/parsed.json', JSON.stringify(parser.results));
  //expect(delta).toBeGreaterThan(450)
});
