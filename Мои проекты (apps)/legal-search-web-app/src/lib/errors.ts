/** Ошибка слоя API при сбое запроса к Supabase. */
export class ApiError extends Error {
  readonly code: string | undefined;
  readonly causeDetail: unknown;

  constructor(message: string, options?: { code?: string; cause?: unknown }) {
    super(message);
    this.name = 'ApiError';
    this.code = options?.code;
    this.causeDetail = options?.cause;
  }
}
