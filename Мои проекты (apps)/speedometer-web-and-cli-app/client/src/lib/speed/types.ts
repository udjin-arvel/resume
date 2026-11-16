export interface MeasureOptions {
  url: string;
  timeout: number;
  retries: number;
  cacheBust: boolean;
  index: number;
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
  mbps: number; // megabits
  mBps: number; // megabytes
  finalUrl: string | undefined;
}
