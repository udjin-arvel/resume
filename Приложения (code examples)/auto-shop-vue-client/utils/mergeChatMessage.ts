import type { ChatMessage } from "@/types/common/chat"

export function mergeMessagesByIdAsc(existing: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  if ((!existing || existing.length === 0) && (!incoming || incoming.length === 0)) {
    return []
  }
  const map = new Map<number, ChatMessage>()
  if (existing && existing.length) {
    for (const m of existing) {
      if (m && typeof m.id === "number") {
        map.set(m.id, m)
      }
    }
  }
  if (incoming && incoming.length) {
    for (const m of incoming) {
      if (m && typeof m.id === "number") {
        map.set(m.id, m)
      }
    }
  }
  const merged = Array.from(map.values())
  merged.sort((a, b) => a.id - b.id)
  return merged
}

export function mergeOneMessageByIdAsc(existing: ChatMessage[], item?: ChatMessage | null): ChatMessage[] {
  if (!item || typeof item.id !== "number") {
    return existing ?? []
  }
  return mergeMessagesByIdAsc(existing ?? [], [item])
}
