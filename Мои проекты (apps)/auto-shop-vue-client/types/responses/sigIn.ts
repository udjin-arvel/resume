import type { User } from "@/types/responses/user"

export interface SigIn {
  access_token: string
  expires_in: string
  token_type: string
  user: User
}
