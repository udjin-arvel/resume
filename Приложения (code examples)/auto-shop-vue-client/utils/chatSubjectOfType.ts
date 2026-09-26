import { chatSubjects, chatTypes } from "@/constants/chat"
import type { ChatSubject, ChatType } from "@/types/common/chat"

export const chatSubjectOfType = (chatType: ChatType | undefined): ChatSubject => {
  if (chatType === chatTypes.searchRequest) {
    return chatSubjects.searchRequest
  }

  return chatSubjects.listing
}
