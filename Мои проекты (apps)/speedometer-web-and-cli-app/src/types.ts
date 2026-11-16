import type { Dispatcher } from "undici";

export interface CliOptions {
  url: string;
  count: number;
  timeout: number;
  retries: number;
  cacheBust: boolean;
  help: boolean;
}

export interface MeasureOptions {
  url: string;
  timeout: number;
  retries: number;
  cacheBust: boolean;
  index: number;
  dispatcher: Dispatcher;
}

export interface AttemptLog {
  attempt: number;
  ok: boolean;
  reason?: string;
}

export interface RequestResult {
  index: number;
  ok: boolean;
  status?: number;
  timeMs?: number;
  bodyBytes?: number;
  headerBytes?: number;
  finalUrl?: string;
  attempts: AttemptLog[];
  error?: string;
}

export interface Summary {
  success: number;
  failed: number;
  retries: number;
  avgMs: number;
  medianMs: number;
  firstMs: number | null;
  restAvgMs: number | null;
  bodyBytes: number;
  headerBytes: number;
  totalBytes: number;
  mbps: number;
  mBps: number;
  finalUrl: string | undefined;
}
