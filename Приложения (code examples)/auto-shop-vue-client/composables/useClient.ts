import { ref, readonly } from "vue"
import type { Client } from "@/types/responses/client"
import type Response from "@/types/responses/response"
import Errors from "@/classes/errors"
import type { ClientUpdate } from "@/types/requests/user/client"
import { ClientStore } from "@/types/requests/user/client"
import { useApiClient } from "@/composables/api/useApiClient"
import { PasswordUpdate as PasswordUpdateRequest } from "@/types/requests/user/password"
import usePagination from "@/composables/usePagination"

interface FetchOpts {
  filters?: Record<string, any>
}

export default function useClient(_client?: Client) {
  const {
    index: _index,
    show: _show,
    block: _block,
    unblock: _unblock,
    accept: _accept,
    reject: _reject,
    pending: _pending,
    destroy: _destroy,
    update: _update,
    store: _store,
    changePassword: _changePassword,
  } = useApiClient()
  const { isLoading, start, finish } = useLoadingIndicator()

  const clientData = ref<ClientStore | ClientUpdate>(new ClientStore())
  const balance = ref<number>(0)
  const data = ref<Client[]>([])
  const client = ref<Client | null>(null)

  if (_client) {
    clientData.value.name = _client.name ?? ""
    clientData.value.fio = _client.fio ?? ""
    clientData.value.phone = _client.phone ?? ""
    clientData.value.email = _client.email ?? ""
    clientData.value.inn = _client.inn ?? ""
    clientData.value.address = _client.address ?? ""
    clientData.value.contact = _client.contact ?? ""
    balance.value = Number(_client.balance ?? 0)
  }

  const passwordData = ref<PasswordUpdateRequest>(new PasswordUpdateRequest())

  const errors = ref(new Errors())
  const passwordErrors = ref(new Errors())

  const { __currentPage, __limit, offset, total, lastPage, next, prev, first, last } = usePagination({
    currentPage: 1,
    limit: 20,
    total: 0,
  })

  async function fetchClients(opts?: FetchOpts) {
    start()
    try {
      const res = await _index({
        offset: offset.value,
        limit: __limit.value,
        ...(opts?.filters || {}),
      }) as Response<Client[]>

      data.value = res.data || []

      if (res.meta) {
        total.value = res.meta.total || 0
        __limit.value = res.meta.limit || 20
        __currentPage.value = res.meta.currentPage || 1
      }

      return res
    }
    finally {
      finish()
    }
  }

  async function show(id: number): Promise<Client | undefined> {
    start()
    try {
      const res = await _show(id) as Response<Client>
      client.value = res.data || null

      if (client.value) {
        clientData.value.name = client.value.name ?? ""
        clientData.value.fio = client.value.fio ?? ""
        clientData.value.phone = client.value.phone ?? ""
        clientData.value.email = client.value.email ?? ""
        clientData.value.inn = client.value.inn ?? ""
        clientData.value.address = client.value.address ?? ""
        clientData.value.contact = client.value.contact ?? ""
        balance.value = Number(client.value.balance ?? 0)
      }

      return client.value || undefined
    }
    finally {
      finish()
    }
  }

  const update = async (id: number, data: any): Promise<boolean> => {
    start()
    errors.value.clear()
    try {
      await _update(id, data)
      return true
    }
    catch (error: any) {
      const _error: Response<any> = error.data as Response<any> || {}
      if (_error.errors) {
        errors.value.record(_error.errors)
      }
      return false
    }
    finally {
      finish()
    }
  }

  const store = async (data: any): Promise<number | undefined> => {
    start()
    errors.value.clear()
    try {
      const response = await _store(data)
      return response.data?.id
    }
    catch (error: any) {
      const _error: Response<any> = error.data as Response<any> || {}
      if (_error.errors) {
        errors.value.record(_error.errors)
      }
    }
    finally {
      finish()
    }
  }

  const changePassword = async (): Promise<void> => {
    start()
    passwordErrors.value.clear()
    try {
      if (typeof _client?.id === "number") {
        await _changePassword(_client.id, passwordData.value)
        passwordData.value.password = ""
        passwordData.value.password_confirmation = ""
      }
    }
    catch (error: any) {
      const _error: Response<any> = error.data as Response<any> || {}
      if (_error.errors) {
        passwordErrors.value.record(_error.errors)
      }
    }
    finally {
      finish()
    }
  }

  const block = async (id: number): Promise<void> => {
    start()
    try {
      await _block(id)
    }
    finally {
      finish()
    }
  }

  const unblock = async (id: number): Promise<void> => {
    start()
    try {
      await _unblock(id)
    }
    finally {
      finish()
    }
  }

  const accept = async (id: number): Promise<void> => {
    start()
    try {
      await _accept(id)
    }
    finally {
      finish()
    }
  }

  const reject = async (id: number): Promise<void> => {
    start()
    try {
      await _reject(id)
    }
    finally {
      finish()
    }
  }

  const pending = async (id: number): Promise<void> => {
    start()
    try {
      await _pending(id)
    }
    finally {
      finish()
    }
  }

  const destroy = async (id: number): Promise<void> => {
    start()
    try {
      await _destroy(id)
    }
    finally {
      finish()
    }
  }

  return {
    data,
    client,
    page: __currentPage,
    limit: __limit,
    total,
    lastPage,
    next,
    prev,
    first,
    last,
    fetchClients,
    show,
    block,
    unblock,
    accept,
    reject,
    pending,
    destroy,
    isLoading: readonly(isLoading),
    errors,
    passwordErrors,
    clientData,
    passwordData,
    balance,
    update,
    store,
    changePassword,
  }
}
