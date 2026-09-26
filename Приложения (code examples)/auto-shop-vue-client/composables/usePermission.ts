import { RoleAdmin } from "@/constants/roles"

export default function usePermission() {
  const hasRequiredRoles = (_roles: string[] | string): boolean => {
    const { user } = useUserStore()
    if (!user) {
      return false
    }

    const userRole: string = user.role
    const roles = typeof _roles === "string" ? [_roles] : _roles

    /** ADMIN ROLE **/
    if (userRole == RoleAdmin) {
      return true
    }

    /** OTHER ROLES **/
    return roles.some(x => userRole === x)
  }

  return {
    hasRequiredRoles,
  }
}
