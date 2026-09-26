import {
  buildStoryFragmentsPayload,
  fragmentHasExtraContent,
  getFragmentContentIconName,
  getFragmentContentLabel,
  getFragmentFileKind,
  isDbFragmentId,
  uploadFragmentMedia,
  uploadSingleFragmentMedia,
} from '~/utils/fragmentMedia';

export const useFragmentMediaUpload = () => ({
  getFragmentContentLabel,
  fragmentHasExtraContent,
  getFragmentContentIconName,
  uploadFragmentMedia,
  uploadSingleFragmentMedia,
  buildStoryFragmentsPayload,
  getFragmentFileKind,
  isDbFragmentId,
});
