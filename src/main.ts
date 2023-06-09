import {addPath, debug, getInput, setFailed, summary} from '@actions/core';
import {ExecOptions, exec} from '@actions/exec';
import {getOctokit, context} from '@actions/github';
import {which} from '@actions/io';
import {cacheDir, downloadTool, extractTar, find} from '@actions/tool-cache';
import {readFile} from 'fs/promises';
import path from 'path';
import grammar from './grammar.js';
import got from 'got';
// @ts-ignore
import nearly from 'nearley/lib/nearley.js';
const {Grammar, Parser} = nearly;

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

// Purely used for tests
function areWeTestingWithJest() {
  return process.env.JEST_WORKER_ID !== undefined;
}

async function downloadRelease(version: string): Promise<string> {
  // Download
  const downloadUrl = `https://github.com/getzola/zola/releases/download/v${version}/zola-v${version}-x86_64-unknown-linux-gnu.tar.gz`;
  let downloadPath: string | null = null;
  try {
    downloadPath = await downloadTool(downloadUrl);
  } catch (error) {
    debug(error as string);
    throw new Error(
      `Failed to download version v${version}: ${error as string}`
    );
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

export async function run(): Promise<void> {
  // __dirname does not exist in esm world so we fake it the esm way. Nodejs approves.
  const __dirname = process.env['GITHUB_WORKSPACE'] || '.';

  const working_directory = getInput('working_directory');

  let dataString = '';
  let infoString = '';
  const parser: typeof Parser = new Parser(Grammar.fromCompiled(grammar));
  const options: ExecOptions = {
    cwd: path.join(__dirname, working_directory),
    ignoreReturnCode: true,
    listeners: {
      stderr: (data: Buffer) => {
        dataString += data.toString();
      },
      stdout: (data: Buffer) => {
        infoString += data.toString();
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

  // Only create result if there is anything to report
  if (annotations.length > 0) {
    const token = getInput('repo-token');
    const octokit = getOctokit(token);

    // call octokit to create a check with annotation and details
    await octokit.rest.checks.create({
      owner: context.repo.owner,
      repo: context.repo.repo,
      name: 'Zola Check',
      head_sha: context.sha,
      started_at: areWeTestingWithJest() ? undefined : startTime.toISOString(),
      completed_at: areWeTestingWithJest()
        ? undefined
        : new Date().toISOString(),
      status: 'completed',
      conclusion: getInput('conclusion_level'),
      output: {
        title: 'Link is not reachable',
        summary:
          'Zola check found links which are not reachable. Make sure to either ignore these due to being false positives or fixing them',
        annotations
      }
    });
  }

  // Write summary
  const stdoutParser: typeof Parser = new Parser(Grammar.fromCompiled(grammar));
  stdoutParser.feed(infoString);

  if (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stdoutParser.results[0].filter((result: any) =>
      result.hasOwnProperty('successReport')
    ).length > 0
  ) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalExternal = stdoutParser.results[0].filter((result: any) =>
      result.hasOwnProperty('external_links_planed_checking')
    )[0]['external_links_planed_checking']['total'];
    summary
      .addHeading('Zola check results')
      .addTable([
        [
          {data: 'Link Type', header: true},
          {data: 'Total', header: true},
          {data: 'Result', header: true}
        ],
        ['Internal', '', 'Pass ✅'],
        ['External', totalExternal, `Pass ✅`]
      ])
      .write();
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalInternal = stdoutParser.results[0].filter((result: any) =>
      result.hasOwnProperty('internal_links')
    )[0]['internal_links']['total'];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalExternal = stdoutParser.results[0].filter((result: any) =>
      result.hasOwnProperty('external_links_planed_checking')
    )[0]['external_links_planed_checking']['total'];
    const skippedExternal =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stdoutParser.results[0].filter((result: any) =>
        result.hasOwnProperty('external_links_planed_checking')
      )[0]['external_links_planed_checking']['skipped'] || '0';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const errorCount = stdoutParser.results[0].filter((result: any) =>
      result.hasOwnProperty('external_links_checked')
    )[0]['external_links_checked']['errors'];
    summary
      .addHeading('Zola check results')
      .addTable([
        [
          {data: 'Link Type', header: true},
          {data: 'Total', header: true},
          {data: 'Result', header: true}
        ],
        ['Internal', totalInternal, 'Pass ✅'],
        [
          'External',
          `${totalExternal} (Skipped ${skippedExternal})`,
          `Fail (${errorCount} error(s) found) ❌`
        ]
      ])
      .write();
  }
}

run();
