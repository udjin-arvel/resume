import type { ClientTypeCompany, ClientTypeEntrepreneur } from "@/constants/types"
import type {
  RoleSellerClient, RoleSellerContent, RoleSellerSearch,
  RoleAdmin, RoleCompany, RoleDirector, RoleEmployee, RoleLogistic,
} from "@/constants/roles"
import type { StatusActive, StatusPending, StatusBlocked, StatusRejected } from "@/constants/statuses"

interface BaseEntity {
  id: number
  name: string
  status: typeof StatusActive | typeof StatusPending | typeof StatusBlocked | typeof StatusRejected
}

interface Client extends BaseEntity {
  role: typeof RoleCompany
  type: typeof ClientTypeCompany | typeof ClientTypeEntrepreneur
  balance?: string | number
  deposit?: string | number
  children: User[]
}

interface Admin extends BaseEntity {
  role: typeof RoleAdmin
}

interface Director extends BaseEntity {
  role: typeof RoleDirector
  client_id: number
}

interface Employee extends BaseEntity {
  role: typeof RoleEmployee
  client_id: number
}

interface SellerClient extends BaseEntity {
  role: typeof RoleSellerClient
  client_id: number
}

interface SellerContent extends BaseEntity {
  role: typeof RoleSellerContent
  client_id: number
}

interface SellerSearch extends BaseEntity {
  role: typeof RoleSellerSearch
  client_id: number
}

interface Logistic extends BaseEntity {
  role: typeof RoleLogistic
  client_id: number
}

type User = Admin | Director | Employee | SellerClient | SellerSearch | SellerContent | Logistic

export interface NamedEntity {
  id: number
  name: string
}

export type { Client, User, Admin, Director, Employee, SellerClient, SellerSearch, SellerContent, Logistic }
