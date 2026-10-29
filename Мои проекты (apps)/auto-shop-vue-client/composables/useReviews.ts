import { ref, readonly, computed } from "vue"
import type {
  ReviewResponse,
  ReviewCreateFormResponse,
} from "@/types/responses/reviews"
import type {
  StoreReviewRequest,
  ReviewIndexRequest,
} from "@/types/requests/reviews"
import Errors from "@/classes/errors"
import type Response from "@/types/responses/response"
import { useApiReviews } from "@/composables/api/useApiReviews"
import usePagination from "@/composables/usePagination"
import type { OptionBase } from "@/types/form/optionType"

interface PaginationMeta {
  currentPage: number
  lastPage: number
  perPage: number
  total: number
}

export function useReviews() {
  const {
    index: _index,
    show: _show,
    store: _store,
    updateStatus: _updateStatus,
    destroy: _destroy,
    getCreateFormData: _getCreateFormData,
    getFilters: _getFilters,
  } = useApiReviews()

  const { isLoading, start, finish } = useLoadingIndicator()

  const reviews = ref<ReviewResponse[]>([])
  const review = ref<ReviewResponse | null>(null)
  const errors = ref(new Errors())

  const { __currentPage, __limit, total, lastPage, next, prev, first, last, applyMeta } = usePagination({
    currentPage: 1, limit: 10, total: 0,
  })

  const pagination = computed(() => ({
    current_page: __currentPage.value,
    last_page: lastPage.value,
    total: total.value,
    limit: __limit.value,
  }))

  const handleApiError = (error: any) => {
    const errorData = error?.data as Response<any> | undefined
    if (errorData?.errors) {
      errors.value.record(errorData.errors)
    }
  }

  const filterOptions = ref<{
    vins: OptionBase[]
    brands: OptionBase[]
    clients: OptionBase[]
  }>({ vins: [], brands: [], clients: [] })

  const fetchFilters = async () => {
    start()
    errors.value.clear()

    try {
      const response = await _getFilters()
      const data = response.data

      filterOptions.value = {
        vins: data?.vins || [],
        brands: data?.brands || [],
        clients: data?.clients || [],
      }
    }
    catch (e: any) {
      handleApiError(e)
    }
    finally {
      finish()
    }
  }

  const fetchReviews = async (opts: Partial<ReviewIndexRequest> & { filters?: any } = {}) => {
    start()
    errors.value.clear()

    if (opts.page) {
      __currentPage.value = opts.page
    }

    if (opts.limit) {
      __limit.value = opts.limit
    }

    try {
      const params: ReviewIndexRequest = {
        page: __currentPage.value,
        limit: __limit.value,
      }

      if (opts.filters && Object.keys(opts.filters).length > 0) {
        params.filter = opts.filters
      }

      const response = await _index(params)

      reviews.value = response.data || []

      const meta = response.meta as unknown as PaginationMeta | undefined

      if (meta) {
        applyMeta({
          currentPage: meta.currentPage,
          total: meta.total,
          limit: meta.perPage,
        })
      }
    }
    catch (e: any) {
      handleApiError(e)
      reviews.value = []
    }
    finally {
      finish()
    }
  }

  const fetchReview = async (id: number) => {
    start()
    errors.value.clear()
    review.value = null

    try {
      const response = await _show(id)
      review.value = response.data ?? null
    }
    catch (e: any) {
      handleApiError(e)
    }
    finally {
      finish()
    }
  }

  const storeReview = async (payload: StoreReviewRequest): Promise<number | null> => {
    start()
    errors.value.clear()
    try {
      const response = await _store(payload)
      const createdReview = response.data
      return createdReview?.id ?? null
    }
    catch (e: any) {
      handleApiError(e)
      throw e
    }
    finally {
      finish()
    }
  }

  const updateReviewStatus = async (id: number, status: "accepted" | "rejected"): Promise<boolean> => {
    start()
    errors.value.clear()
    try {
      await _updateStatus(id, status)

      if (review.value && review.value.id === id) {
        review.value.status = status
      }

      const indexInList = reviews.value.findIndex(r => r.id === id)
      if (indexInList !== -1) {
        reviews.value[indexInList].status = status
      }

      return true
    }
    catch (e: any) {
      handleApiError(e)
      return false
    }
    finally {
      finish()
    }
  }

  const deleteReview = async (id: number): Promise<boolean> => {
    start()
    errors.value.clear()
    try {
      await _destroy(id)

      reviews.value = reviews.value.filter(r => r.id !== id)
      if (review.value && review.value.id === id) {
        review.value = null
      }

      total.value = Math.max(0, total.value - 1)

      return true
    }
    catch (e: any) {
      handleApiError(e)
      return false
    }
    finally {
      finish()
    }
  }

  const reviewFormData = ref<ReviewCreateFormResponse | null>(null)

  const fetchCreateFormData = async (orderId: number) => {
    start()
    errors.value.clear()
    reviewFormData.value = null
    try {
      const response = await _getCreateFormData(orderId)
      reviewFormData.value = response.data || null
    }
    catch (e: any) {
      handleApiError(e)
    }
    finally {
      finish()
    }
  }

  return {
    reviews, review, pagination,
    page: __currentPage, limit: __limit, total, lastPage, next, prev, first, last,
    isLoading: readonly(isLoading), errors,
    fetchReviews, fetchReview, storeReview,
    updateReviewStatus, deleteReview, reviewFormData,
    fetchCreateFormData,
    fetchFilters,
    filterOptions,
  }
}
