import { HELP, parseArgs, ValidationError } from "./cli.js";
import { createAgent, measureRequest } from "./requester.js";
import { formatRequestLine, formatSummary, summarize } from "./stats.js";

async function main(argv: string[]): Promise<number> {
  let opts;
  try {
    opts = parseArgs(argv);
  } catch (e) {
    if (e instanceof ValidationError) {
      console.error(e.message);
      return 2;
    }
    throw e;
  }

  if (opts.help) {
    console.log(HELP);
    return 0;
  }

  const agent = createAgent();
  const results = [];
  const maxAttempts = opts.retries + 1;

  try {
    for (let i = 1; i <= opts.count; i++) {
      const result = await measureRequest({
        url: opts.url,
        timeout: opts.timeout,
        retries: opts.retries,
        cacheBust: opts.cacheBust,
        index: i,
        dispatcher: agent,
      });
      console.log(formatRequestLine(result, maxAttempts));
      results.push(result);
    }
  } finally {
    await agent.close();
  }

  const summary = summarize(results);
  console.log(formatSummary(opts.url, summary));

  if (summary.success === 0) {
    console.error("all requests failed");
    return 1;
  }
  return 0;
}

const code = await main(process.argv.slice(2));
process.exit(code);
