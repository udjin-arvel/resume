import type Response from "@/types/responses/response"
import Errors from "@/classes/errors"
import { PasswordUpdate as PasswordUpdateRequest } from "@/types/requests/user/password"
import { UserStore as UserStoreRequest, UserUpdate as UserUpdateRequest } from "@/types/requests/user/user"
import type { User } from "@/types/responses/user"
import { useApiUser } from "@/composables/api/useApiUser"

export default function useUser(user?: User) {
  const { isLoading, start, finish } = useLoadingIndicator()
  const {
    store: _store,
    updatePassword: _updatePassword,
    update: _update,
    block: _block,
    unblock: _unblock,
    destroy: _destroy,
    index: _index,
    setLanguage: _setLanguage,
    updateNotificationSettings: _updateNotificationSettings,
  } = useApiUser()

  const userStore: Ref<UserStoreRequest> = ref<UserStoreRequest>(new UserStoreRequest())
  const userPasswordUpdate: Ref<PasswordUpdateRequest> = ref<PasswordUpdateRequest>(new PasswordUpdateRequest())
  const userUpdate: Ref<UserUpdateRequest> = ref<UserUpdateRequest>(new UserUpdateRequest())

  const errors = ref(new Errors())

  const store = async (data: UserStoreRequest): Promise<number | undefined> => {
    start()
    try {
      const res = await _store(data)
      return res.data?.id
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

  const update = async (id: number, data: UserUpdateRequest): Promise<boolean> => {
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

  const updatePassword = async (id: number, data: PasswordUpdateRequest): Promise<void> => {
    start()
    await _updatePassword(id, data)
      .catch((error: any): void => {
        const _error: Response<any> = error.data as Response<any> || {}
        if (_error.errors) {
          errors.value.record(_error.errors)
        }
      }).finally((): void => {
        userPasswordUpdate.value.password = ""
        userPasswordUpdate.value.password_confirmation = ""
        finish()
      })
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

  const destroy = async (id: number): Promise<void> => {
    start()
    try {
      await _destroy(id)
    }
    finally {
      finish()
    }
  }

  const index = async (params: Record<string, any> = {}) => {
    return await _index(params)
  }

  const setUser = (): void => {
    if (!user) {
      return
    }

    userUpdate.value.name = user.name
    userUpdate.value.email = user.email
  }

  const setLanguage = async (language: string): Promise<boolean> => {
    start()
    errors.value.clear()
    try {
      await _setLanguage(language)
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

  const updateNotificationSettings = async (id: number, settings: string[]): Promise<boolean> => {
    start()
    errors.value.clear()
    try {
      await _updateNotificationSettings(id, settings)
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

  onMounted(() => {
    setUser()
  })

  return {
    store,
    update,
    updatePassword,
    block,
    unblock,
    destroy,
    index,
    isLoading: readonly(isLoading),
    errors,
    userPasswordUpdate,
    userUpdate,
    userStore,
    setLanguage,
    updateNotificationSettings,
  }
}
