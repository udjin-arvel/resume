interface Props {
  limit: number
  total: number
  currentPage: number
}

export default function usePagination(props: Readonly<Props>) {
  const _currentPage = ref(props.currentPage)
  const _limit = ref(props.limit)
  const _offset = ref(0)
  const total = ref(props.total)

  const offset: Ref<number> = computed<number>({
    get() {
      return _offset.value
    },
    set(value: number) {
      _offset.value = Math.max(0, Math.min(value, total.value))
    },
  })

  const __currentPage: Ref<number> = computed<number>({
    get() {
      return _currentPage.value
    },
    set(value: number) {
      _currentPage.value = value
      if (value < 1) {
        _currentPage.value = 1
      }
      else if (value > lastPage.value) {
        _currentPage.value = lastPage.value
      }
      offset.value = (_currentPage.value - 1) * __limit.value
    },
  })

  const __limit: Ref<number> = computed<number>({
    get() {
      return _limit.value
    },
    set(value: number) {
      _limit.value = value
    },
  })

  const lastPage: Ref<number> = computed(() =>
    total.value === 0 ? 1 : Math.ceil(total.value / __limit.value),
  )

  const pagination = computed(() => {
    const range = Array.from({ length: lastPage.value }, (_, k) => k + 1)
    const delta = 2
    return range.reduce((pages: Array<number>, page: number) => {
      if (page === 1 || page === lastPage.value) {
        return [...pages, page]
      }

      if (page - delta <= __currentPage.value && page + delta >= __currentPage.value) {
        return [...pages, page]
      }

      if (pages[pages.length - 1] !== -1) {
        return [...pages, -1]
      }

      return pages
    }, [])
  })

  const prev = () => --__currentPage.value
  const next = () => ++__currentPage.value
  const first = () => (__currentPage.value = 1)
  const last = () => (__currentPage.value = lastPage.value)

  watch(
    [total, __limit],
    () => {
      if (__currentPage.value > lastPage.value) {
        __currentPage.value = lastPage.value
      }
    },
    { immediate: false },
  )

  if (props.currentPage > lastPage.value) {
    __currentPage.value = lastPage.value
  }

  function applyMeta(meta: { total: number, limit: number, currentPage: number }) {
    total.value = meta.total
    __limit.value = meta.limit
    __currentPage.value = meta.currentPage
  }

  return {
    __limit,
    total,
    __currentPage,
    offset,
    lastPage,
    pagination,
    next,
    prev,
    first,
    last,
    applyMeta,
  }
}
