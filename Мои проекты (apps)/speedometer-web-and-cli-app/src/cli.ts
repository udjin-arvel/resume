import type { CliOptions } from "./types.js";

export class ValidationError extends Error {}

export const HELP = `Usage: node dist/index.js <url> [options]

Sequential HTTP downloads. Prints per-request timing and a summary in MB/s and Mbps.

Arguments:
  url                     http(s) URL to fetch (required)

Options:
  --count <n>             sequential requests              (default: 10)
  --timeout <ms>          whole-request timeout            (default: 30000)
  --retries <n>           extra attempts after a failure   (default: 1)
  --cache-bust            add ?cb=<timestamp>-<i> to the URL
  --no-cache-bust         do not add cache-busting         (default)
  --help                  this text
`;

function isIntString(v: string): boolean {
  return /^-?\d+$/.test(v);
}

function parsePositiveInt(flag: string, raw: string | undefined, min: number): number {
  if (raw === undefined || !isIntString(raw)) {
    throw new ValidationError(`${flag} expects a positive integer`);
  }
  const n = Number(raw);
  if (!Number.isInteger(n) || n < min) {
    throw new ValidationError(`${flag} expects an integer >= ${min}`);
  }
  return n;
}

export function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = {
    url: "",
    count: 10,
    timeout: 30_000,
    retries: 1,
    cacheBust: false,
    help: false,
  };

  const positionals: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === "--help" || arg === "-h") {
      opts.help = true;
      continue;
    }
    if (arg === "--cache-bust") {
      opts.cacheBust = true;
      continue;
    }
    if (arg === "--no-cache-bust") {
      opts.cacheBust = false;
      continue;
    }
    if (arg === "--count" || arg === "--timeout" || arg === "--retries") {
      const value = argv[++i];
      if (arg === "--count") opts.count = parsePositiveInt(arg, value, 1);
      else if (arg === "--timeout") opts.timeout = parsePositiveInt(arg, value, 1);
      else opts.retries = parsePositiveInt(arg, value, 0);
      continue;
    }
    if (arg.startsWith("--")) {
      throw new ValidationError(`unknown flag: ${arg}`);
    }
    positionals.push(arg);
  }

  if (opts.help) return opts;

  if (positionals.length === 0) {
    throw new ValidationError("url is required");
  }
  if (positionals.length > 1) {
    throw new ValidationError("expected a single url argument");
  }

  let parsed: URL;
  try {
    parsed = new URL(positionals[0]!);
  } catch {
    throw new ValidationError("url must be a valid URL");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new ValidationError("url must use http or https");
  }
  opts.url = parsed.toString();
  return opts;
}
