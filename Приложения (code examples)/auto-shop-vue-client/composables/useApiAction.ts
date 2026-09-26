import { ref, type Ref } from "vue"
import { useLoadingIndicator } from "#imports"
import Errors from "@/classes/errors"
import type Response from "@/types/responses/response"

export function useApiAction() {
  const { isLoading, start, finish } = useLoadingIndicator()
  const errors = ref(new Errors())

  async function execute<T>(
    before: () => void,
    after: () => void,
    fn: () => Promise<T>,
  ): Promise<T | undefined> {
    before()
    errors.value.clear()
    try {
      return await fn()
    }
    catch (error: any) {
      const _error: Response<any> = error?.data as Response<any> || {}
      if (_error.errors) {
        errors.value.record(_error.errors)
      }
    }
    finally {
      after()
    }
  }

  async function run<T>(fn: () => Promise<T>): Promise<T | undefined> {
    return execute(start, finish, fn)
  }

  async function runWithLoading<T>(
    loading: Ref<boolean>,
    fn: () => Promise<T>,
  ): Promise<T | undefined> {
    return execute(
      () => { loading.value = true },
      () => { loading.value = false },
      fn,
    )
  }

  return {
    isLoading,
    errors,
    run,
    runWithLoading,
  }
}
