import type Response from "@/types/responses/response"
import Errors from "@/classes/errors"
import type { ProfileUpdate as ProfileUpdateRequest } from "@/types/requests/profile/profile"
import type { PasswordUpdate as PasswordUpdateRequest } from "@/types/requests/profile/password"

export function useProfile() {
  const { isLoading, start, finish } = useLoadingIndicator()

  const {
    update: _update,
    updatePassword: _updatePassword,
    getTelegramBindToken: _getTelegramBindToken,
    unbindTelegram: _unbindTelegram,
    updateTelegramNotifications: _updateTelegramNotifications,
  } = useApiProfile()

  const errors = ref(new Errors())

  const update = async (profileUpdate: ProfileUpdateRequest): Promise<void> => {
    const { user, setUser } = useUserStore()
    start()
    try {
      await _update(profileUpdate)
      if (user) {
        user.name = profileUpdate.name
        setUser(user)
      }
    }
    catch (error: any) {
      const _error: Response<any> = (error?.data as Response<any>) ?? {}
      if (_error.errors) {
        errors.value.record(_error.errors)
      }
    }
    finish()
  }

  const updatePassword = async (profilePasswordUpdate: PasswordUpdateRequest): Promise<void> => {
    start()
    try {
      await _updatePassword(profilePasswordUpdate)
    }
    catch (error: any) {
      const _error: Response<any> = (error?.data as Response<any>) ?? {}
      if (_error.errors) {
        errors.value.record(_error.errors)
      }
    }
    profilePasswordUpdate.password = ""
    profilePasswordUpdate.password_confirmation = ""
    profilePasswordUpdate.current_password = ""
    finish()
  }

  const getTelegramToken = async (): Promise<string | null> => {
    try {
      const res = await _getTelegramBindToken()
      return res.data?.token || null
    }
    catch (error: any) {
      const _error = (error?.data as Response<any>) ?? {}
      if (_error.errors) {
        errors.value.record(_error.errors)
      }
      return null
    }
  }

  const unbindTelegram = async (): Promise<boolean> => {
    try {
      await _unbindTelegram()
      return true
    }
    catch (error: any) {
      const _error = (error?.data as Response<any>) ?? {}
      if (_error.errors) {
        errors.value.record(_error.errors)
      }
      return false
    }
  }

  const updateTelegramNotifications = async (enabled: boolean): Promise<boolean> => {
    try {
      const res = await _updateTelegramNotifications(enabled)
      const { user, setUser } = useUserStore()
      if (user && res.data) {
        user.notification_settings = res.data.notification_settings
        setUser(user)
      }
      return true
    }
    catch (error: any) {
      const _error = (error?.data as Response<any>) ?? {}
      if (_error.errors) {
        errors.value.record(_error.errors)
      }
      return false
    }
  }

  return {
    update,
    updatePassword,
    errors,
    isLoading: readonly(isLoading),
    getTelegramToken,
    unbindTelegram,
    updateTelegramNotifications,
  }
}
