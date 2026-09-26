import { ChatRoleMap, ChatRoles } from "@/constants/chat"

type ExternalRole = keyof typeof ChatRoleMap
type InternalRole = typeof ChatRoles[keyof typeof ChatRoles]

export function mapExternalRoleToChatRole(r?: string | null): InternalRole {
  if (r && (r as ExternalRole) in ChatRoleMap) {
    return ChatRoleMap[r as ExternalRole]
  }
  return ChatRoles.Self
}
