const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/ogg'];

export function getFragmentFileKind(file: File | null | undefined): 'image' | 'audio' | null {
  if (!file) return null;
  if (IMAGE_TYPES.includes(file.type)) return 'image';
  if (AUDIO_TYPES.includes(file.type)) return 'audio';
  return null;
}

export function isDbFragmentId(id: unknown): id is number {
  return typeof id === 'number' && Number.isInteger(id) && id > 0;
}

export function fragmentHasExtraContent(fragment: {
  authorNote?: string | null;
  images?: unknown[] | null;
  audios?: unknown[] | null;
}): boolean {
  return Boolean(
    fragment.authorNote?.trim()
    || fragment.images?.length
    || fragment.audios?.length
  );
}

export function getFragmentContentIconName(fragment: {
  authorNote?: string | null;
  images?: unknown[] | null;
  audios?: unknown[] | null;
}): string {
  const hasNote = Boolean(fragment.authorNote?.trim());
  const hasImages = Boolean(fragment.images?.length);
  const hasAudio = Boolean(fragment.audios?.length);
  const typesCount = [hasNote, hasImages, hasAudio].filter(Boolean).length;

  if (typesCount > 1) return 'fa6-solid:layer-group';
  if (hasAudio) return 'fa6-solid:volume-high';
  if (hasImages) return 'fa6-solid:file-image';
  if (hasNote) return 'fa6-solid:note-sticky';
  return 'fa6-solid:paperclip';
}

export function getFragmentContentLabel(fragment: {
  authorNote?: string | null;
  pendingFile?: File | null;
  images?: unknown[] | null;
  audios?: unknown[] | null;
}): string | null {
  const parts: string[] = [];

  if (fragment.authorNote?.trim()) {
    parts.push('примечание');
  }
  if (fragment.pendingFile) {
    parts.push(getFragmentFileKind(fragment.pendingFile) === 'audio' ? 'аудио' : 'изображение');
  } else {
    if (fragment.images?.length) parts.push('изображение');
    if (fragment.audios?.length) parts.push('аудио');
  }

  if (parts.length === 0) return null;
  return `Прикреплено: ${parts.join(', ')}`;
}

export async function uploadSingleFragmentMedia(
  apiFormData: (url: string, options: { method?: string; body: FormData }) => Promise<unknown>,
  fragmentId: number,
  file: File
): Promise<unknown> {
  const fileKind = getFragmentFileKind(file);
  if (!fileKind) {
    throw new Error('Unsupported file type');
  }

  const formData = new FormData();
  if (fileKind === 'image') {
    formData.append('image', file);
    return apiFormData(`/images/fragment/${fragmentId}`, { method: 'POST', body: formData });
  }

  formData.append('audio', file);
  return apiFormData(`/audio/fragment/${fragmentId}`, { method: 'POST', body: formData });
}

export async function uploadFragmentMedia(
  apiFormData: (url: string, options: { method?: string; body: FormData }) => Promise<unknown>,
  localFragments: Array<{ pendingFile?: File | null }>,
  savedFragments: Array<{ id: number; order: number }>
): Promise<void> {
  for (let index = 0; index < localFragments.length; index++) {
    const localFragment = localFragments[index];
    const pendingFile = localFragment.pendingFile;
    if (!pendingFile) continue;

    const savedFragment = savedFragments.find((fragment) => fragment.order === index + 1);
    if (!savedFragment?.id) continue;

    const fileKind = getFragmentFileKind(pendingFile);
    if (!fileKind) continue;

    const formData = new FormData();
    if (fileKind === 'image') {
      formData.append('image', pendingFile);
      await apiFormData(`/images/fragment/${savedFragment.id}`, { method: 'POST', body: formData });
    } else {
      formData.append('audio', pendingFile);
      await apiFormData(`/audio/fragment/${savedFragment.id}`, { method: 'POST', body: formData });
    }

    localFragment.pendingFile = null;
  }
}

export function buildStoryFragmentsPayload(
  fragments: Array<{ id?: number; text: string; authorNote?: string | null }>
) {
  return fragments.map((fragment, index) => {
    const payload: {
      id?: number;
      text: string;
      order: number;
      authorNote?: string;
    } = {
      text: fragment.text,
      order: index + 1,
    };

    if (isDbFragmentId(fragment.id)) {
      payload.id = fragment.id;
    }

    if (fragment.authorNote?.trim()) {
      payload.authorNote = fragment.authorNote.trim();
    }

    return payload;
  });
}
