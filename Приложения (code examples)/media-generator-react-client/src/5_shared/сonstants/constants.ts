export const DEFAULT_IMAGE_PROCESSING_MODEL_ID: string = import.meta.env.VITE_DEFAULT_IMAGE_PROCESSING_MODEL_ID || 'google/nano-banana-2/edit';
export const DEFAULT_TEXT_PROCESSING_MODEL_ID: string = import.meta.env.VITE_DEFAULT_TEXT_PROCESSING_MODEL_ID || '';
export const DEFAULT_VIDEO_PROCESSING_MODEL_ID: string = import.meta.env.VITE_DEFAULT_VIDEO_PROCESSING_MODEL_ID || '';
export const USE_PROTOCOL_CHECKER: boolean = import.meta.env.VITE_USE_PROTOCOL_CHECKER === 'true'
export const API_URL: string = urlProtocolChecker(import.meta.env.VITE_API_URL || 'https://app.radar-analytica.ru/api', USE_PROTOCOL_CHECKER);
export const WS_API_URL: string = urlProtocolChecker(import.meta.env.VITE_WS_API_URL || 'wss://app.radar-analytica.ru/api/graphql', USE_PROTOCOL_CHECKER);
export const PASSWORD_RESET_CHANGE_SECRET: string = import.meta.env.VITE_PASSWORD_RESET_CHANGE_SECRET || '';
/** Backend path. */
export function apiAssetUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (path.startsWith('blob:')) return path;
  if (path.startsWith('http')) return path;
  const base = API_URL.replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export const MAX_IMAGES_LIMIT = 5; // for image/video generation widget
export const MAX_PROMPT_LENGTH = 2000; // symbols
// --- image validation constants
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const MIN_WIDTH = 700;
export const MIN_HEIGHT = 900;
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 Мб


export const IMAGE_GEN_MOD_TYPE_LOCAL_STORAGE_KEY = 'IMAGE_GEN_MOD_TYPE';
export const VIDEO_GEN_MOD_TYPE_LOCAL_STORAGE_KEY = 'VIDEO_GEN_MOD_TYPE';
export const IMAGE_UPSC_MOD_TYPE_LOCAL_STORAGE_KEY = 'IMAGE_UPSC_MOD_TYPE';


function urlProtocolChecker (uri: string, useProtocolChecker: boolean = true): string {
  if (!useProtocolChecker) return uri;
  try {
    const parsed = new URL(uri);
    const isSecure = window.location.protocol === 'https:';
    const protocolMap: Record<string, string> = {
      'http:': isSecure ? 'https:' : 'http:',
      'https:': isSecure ? 'https:' : 'http:',
      'ws:': isSecure ? 'wss:' : 'ws:',
      'wss:': isSecure ? 'wss:' : 'ws:',
    };
    const newProtocol = protocolMap[parsed.protocol];
    if (!newProtocol) return uri;
    parsed.protocol = newProtocol;
    return parsed.toString();
  } catch {
    return uri;
  }
}