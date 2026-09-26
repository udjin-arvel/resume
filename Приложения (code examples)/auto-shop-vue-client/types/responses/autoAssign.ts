export interface AutoAssignManager {
  id: number
  name: string
  status: string
  autoAssign: boolean
}

export interface AutoAssignSettings {
  enabled: boolean
  managers: AutoAssignManager[]
}
