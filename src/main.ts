import {
  addPath,
  debug,
  endGroup,
  getInput,
  setFailed,
  startGroup,
  summary
} from '@actions/core';
import {ExecOptions, exec} from '@actions/exec';
import {getOctokit, context} from '@actions/github';
import {which} from '@actions/io';
import {cacheDir, downloadTool, extractTar, find} from '@actions/tool-cache';
import {readFile} from 'fs/promises';
import {Grammar, Parser} from 'nearley';
import path from 'path';
import grammar from './grammar.js';
// eslint-disable-next-line import/no-named-as-default -- False positive
import got from 'got';

interface WaybackResponse {
  archived_snapshots: {
    closest?: {
      available: boolean;
      url: string;
      timestamp: string;
      status: string;
    };
  };
}

async function downloadRelease(version: string): Promise<string> {
  // Download
  const downloadUrl = `https://github.com/getzola/zola/releases/download/v${version}/zola-v${version}-x86_64-unknown-linux-gnu.tar.gz`;
  let downloadPath: string | null = null;
  try {
    downloadPath = await downloadTool(downloadUrl);
  } catch (error) {
    debug(error as string);
    throw new Error(`Failed to download version v${version}: ${error}`);
  }

  // Extract
  const extPath = await extractTar(downloadPath);

  // Install into the local tool cache - node extracts with a root folder that matches the fileName downloaded
  return await cacheDir(extPath, 'zola', version);
}

async function getZolaCli(version: string): Promise<void> {
  // look if the binary is cached
  let toolPath: string;
  toolPath = find('zola', version);

  // if not: download, extract and cache
  if (!toolPath) {
    toolPath = await downloadRelease(version);
    debug(`Zola cached under ${toolPath}`);
  }

  addPath(toolPath);
}

async function run(): Promise<void> {
  // __dirname does not exist in esm world so we fake it the esm way. Nodejs approves.
  const __dirname = process.env['GITHUB_WORKSPACE'] || '.';

  const working_directory = getInput('working_directory');

  let dataString = '';
  const parser: Parser = new Parser(Grammar.fromCompiled(grammar));
  const options: ExecOptions = {
    cwd: path.join(__dirname, working_directory),
    ignoreReturnCode: true,
    listeners: {
      stderr: (data: Buffer) => {
        dataString += data.toString();
      }
    }
  };

  // Download zola
  await getZolaCli('0.17.2');

  const zolaPath: string = await which('zola', true);
  const startTime = new Date();

  await exec(`${zolaPath}`, ['check'], options);

  try {
    parser.feed(dataString);
  } catch (parseError: unknown) {
    setFailed(`Error at character ${(parseError as {offset: string}).offset}`);
  }

  const annotations: {
    path: string;
    start_line: number;
    end_line: number;
    start_column: number;
    end_column: number;
    annotation_level: string;
    message: string;
  }[] = [];

  startGroup('Zola Check results');
  for (const rawResult of parser.results[0]) {
    const result = rawResult as {
      error_message: string;
      file?: string;
      url?: string;
    };
    if (!result.hasOwnProperty('file')) {
      continue;
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- We ensured this exists previously
    const data: string = await readFile(result.file!, 'utf8');
    const lines: string[] = data.split(/\r?\n/);

    for (const [index, line] of lines.entries()) {
      if (line.trim() === '') {
        continue;
      }

      const startingPositionOfUrl = line.indexOf(result.url ?? '');

      if (startingPositionOfUrl === -1) {
        continue;
      }

      let message = `Zola Error Message: ${result.error_message}`;

      // Check if we have a webarchive link
      const waybackResponse = await got
        .get(`http://archive.org/wayback/available?url=${result.url ?? ''}`)
        .json<WaybackResponse>();
      if (waybackResponse.archived_snapshots !== null) {
        if (
          waybackResponse.archived_snapshots.closest?.available &&
          waybackResponse.archived_snapshots.closest.status === '200'
        ) {
          message = `${message}\nWayback Machine Link is available: ${waybackResponse.archived_snapshots.closest.url}`;
        }
      }

      annotations.push({
        // This is a little awkward but does the job
        path: `/${path.relative(__dirname, result.file ?? '')}`,
        start_line: index,
        end_line: index,
        start_column: startingPositionOfUrl,
        end_column: startingPositionOfUrl + (result.url ?? '').length,
        annotation_level: getInput('annotation_level'),
        message
      });
    }
  }
  endGroup();

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
    conclusion: getInput('conclusion_level'),
    output: {
      title: 'Link is not reachable',
      summary:
        'Zola check found links which are not reachable. Make sure to either ignore these due to being false positives or fixing them',
      annotations
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
