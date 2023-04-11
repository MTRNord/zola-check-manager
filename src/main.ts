import {getInput, setFailed, summary} from '@actions/core';
import {ExecOptions, exec} from '@actions/exec';
import {getOctokit, context} from '@actions/github';
import {cacheFile, downloadTool, extractTar} from '@actions/tool-cache';
import {Grammar, Parser} from 'nearley';
import path from 'path';
import grammar from './grammar';

async function run(): Promise<void> {
  let dataString = '';
  const parser: Parser = new Parser(Grammar.fromCompiled(grammar));
  const options: ExecOptions = {
    cwd: './lib',
    listeners: {
      stderr: (data: Buffer) => {
        dataString += data.toString();
      }
    }
  };

  // Download zola
  const zolaDownload = await downloadTool(
    'https://github.com/getzola/zola/releases/download/v0.17.2/zola-v0.17.2-x86_64-unknown-linux-gnu.tar.gz'
  );
  const zolaExtractedFolder = await extractTar(zolaDownload, '/usr/local/bin');
  const cachedPath = await cacheFile(
    path.join(zolaExtractedFolder, 'zola'),
    'zola',
    'zola',
    '0.17.2'
  );
  const startTime = new Date();

  await exec(`${cachedPath}`, ['check'], options);

  try {
    parser.feed(dataString);
  } catch (parseError: unknown) {
    setFailed(`Error at character ${(parseError as {offset: string}).offset}`);
  }

  // TODO: Use results: parser.results

  // TODO: Hook to github roughly like this:

  const token = getInput('repo-token');
  const octokit = getOctokit(token);

  // call octokit to create a check with annotation and details
  await octokit.rest.checks.create({
    owner: context.repo.owner,
    repo: context.repo.repo,
    name: 'Zola Check',
    head_sha: context.sha,
    started_at: startTime.toISOString(),
    completed_at: new Date().toISOString(),
    status: 'completed',
    // TODO: Allow changing how bad this is
    conclusion: 'action_required',
    output: {
      title: 'Link is not reachable',
      summary:
        'Zola check found links which are not reachable. Make sure to either ignore these due to being false positives or fixing them',
      annotations: [
        {
          // TODO: Use file from json
          path: 'README.md',
          // TODO: Parse files to find the correct links within a file
          start_line: 1,
          end_line: 1,
          start_column: 1,
          end_column: 1,
          // TODO: Allow changing how bad this is
          annotation_level: 'warning',
          // TODO: Use error message
          message: 'README.md must start with a header'
        }
      ]
    }
  });

  // Write summary
  const totalInternal = '1000';
  const totalExternal = '1000';
  const errorCount = '100';
  summary
    .addHeading('Zola check results')
    // TODO: Get stats from zola stdOut
    .addTable([
      [
        {data: 'Link Type', header: true},
        {data: 'Total', header: true},
        {data: 'Result', header: true}
      ],
      ['Internal', totalInternal, 'Pass ✅'],
      ['External', totalExternal, `Fail (${errorCount} error(s) found) ❌`]
    ])
    .write();
}

run();
