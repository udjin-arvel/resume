import { ref, watch, readonly } from "vue"
import { useRouter, useRoute, type RouteRecordRaw } from "vue-router"
import { useI18n } from "vue-i18n"
import { personalPage } from "@/constants/pages"
import { useBreadcrumbStore } from "@/stores/breadcrumb"
import { useUserStore } from "@/stores/user"

interface Breadcrumb {
  name: string
  path: string
  meta?: any
}

const DYNAMIC_BREADCRUMB_ROUTES = new Set([
  "catalog-id",
])

const FROM_CRUMB_OVERRIDES: Record<string, { path: string, nameKey: string }> = {
  cars: { path: "/cars", nameKey: "cars" },
}

export const useBreadcrumbs = () => {
  const router = useRouter()
  const route = useRoute()
  const routes = router.getRoutes()
  const { t } = useI18n()
  const breadcrumbStore = useBreadcrumbStore()
  const userStore = useUserStore()

  const ROOT_CRUMB: Breadcrumb = {
    name: t("navigation.personal"),
    path: personalPage,
  }

  const breadcrumbs = ref<Breadcrumb[]>([ROOT_CRUMB])

  function rootCrumbs(): Breadcrumb[] {
    return userStore.isAuthenticated ? [ROOT_CRUMB] : []
  }

  function getBreadcrumbs(currRoute: string): Breadcrumb[] {
    if (currRoute === "" || currRoute === personalPage) {
      return rootCrumbs()
    }

    const pathSegments = currRoute.split("/").filter(Boolean)
    let currentPath = ""
    const result: Breadcrumb[] = rootCrumbs()
    const routeName = route.name ? String(route.name) : ""
    const fromKey = typeof route.query.from === "string" ? route.query.from : ""
    const fromOverride = DYNAMIC_BREADCRUMB_ROUTES.has(routeName)
      ? FROM_CRUMB_OVERRIDES[fromKey]
      : undefined

    for (let i = 0; i < pathSegments.length; i++) {
      currentPath += `/${pathSegments[i]}`

      if (currentPath === personalPage) {
        continue
      }

      const matchRoute = routes.find((r: RouteRecordRaw) => {
        const routePathSegments = r.path.split("/").filter(Boolean)
        if (routePathSegments.length !== i + 1) {
          return false
        }
        return routePathSegments.every((part: string, j: number) => {
          return part === pathSegments[j] || part.startsWith(":")
        })
      })

      if (matchRoute) {
        let breadcrumbName = ""
        let breadcrumbPath = currentPath
        const matchRouteName = matchRoute.name ? String(matchRoute.name) : ""

        if (DYNAMIC_BREADCRUMB_ROUTES.has(matchRouteName)) {
          breadcrumbName = breadcrumbStore.breadcrumb || ""
        }
        else if (fromOverride && currentPath === "/catalog") {
          breadcrumbName = t("navigation." + fromOverride.nameKey)
          breadcrumbPath = fromOverride.path
        }
        else if (matchRoute.meta?.breadcrumb) {
          breadcrumbName = t("navigation." + String(matchRoute.meta.breadcrumb))
        }
        else if (matchRouteName) {
          breadcrumbName = t("navigation." + matchRouteName)
        }

        result.push({
          name: breadcrumbName,
          path: breadcrumbPath,
          meta: matchRoute.meta,
        })
      }
    }

    return result.filter((item, index, self) =>
      index === self.findIndex(t => t.path === item.path),
    )
  }

  function refreshBreadcrumbs() {
    breadcrumbs.value = getBreadcrumbs(route.path)
  }

  watch(
    () => [route.path, route.query.from] as const,
    () => {
      refreshBreadcrumbs()
    },
    { immediate: true },
  )

  watch(
    () => userStore.isAuthenticated,
    () => {
      refreshBreadcrumbs()
    },
  )

  watch(
    () => breadcrumbStore.breadcrumb,
    () => {
      const routeName = route.name ? String(route.name) : ""
      if (DYNAMIC_BREADCRUMB_ROUTES.has(routeName)) {
        refreshBreadcrumbs()
      }
    },
    { immediate: true },
  )

  return {
    breadcrumbs: readonly(breadcrumbs),
  }
}
