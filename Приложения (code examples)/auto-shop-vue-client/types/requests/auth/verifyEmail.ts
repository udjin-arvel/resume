import { ListRequest } from "../request"

export class VerifyEmail extends ListRequest {
  expires?: string
  signature?: string
}
