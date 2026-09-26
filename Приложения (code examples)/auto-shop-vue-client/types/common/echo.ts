import type Echo from "laravel-echo"

export type PrivateChannel = ReturnType<InstanceType<typeof Echo>["private"]>

export interface ChannelEntry {
  channel: PrivateChannel
  refCount: number
}

export interface SearchRequestUpdatedPayload {
  request_id: number
  [key: string]: unknown
}
