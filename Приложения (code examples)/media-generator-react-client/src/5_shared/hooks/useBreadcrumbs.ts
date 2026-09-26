import { useMemo } from 'react'
import { useLocation } from 'react-router'
import { NAVIGATION_CONFIG } from '@entities'
import { useBreadcrumbsContext } from '../context/breadcrumbs/BreadcrumbsContext'

interface BreadcrumbItem {
    name: string
    slug?: string
}

const HOME: BreadcrumbItem = { name: 'Главная', slug: '/' }

export const useBreadcrumbs = (breadcrumbsTailsOnly: boolean = false): BreadcrumbItem[] => {
    const { pathname } = useLocation()
    const { labels } = useBreadcrumbsContext()

    return useMemo(() => {
        if (pathname === '/') {
            return [{ name: 'Главная' }]
        }

        const segments = pathname.split('/').filter(Boolean)

        const crumbs: BreadcrumbItem[] = [HOME]

        let accumulatedPath = ''

        for (const segment of segments) {
            accumulatedPath += `/${segment}`

            const navItem = NAVIGATION_CONFIG.find(item => item.path === accumulatedPath)
            const name = labels[accumulatedPath] ?? navItem?.label ?? segment

            const isLast = accumulatedPath === pathname
            crumbs.push(isLast ? { name } : { name, slug: accumulatedPath })
        }

        if (breadcrumbsTailsOnly) {
            return [crumbs[crumbs.length - 1]]
        }
        return crumbs
    }, [pathname, labels, breadcrumbsTailsOnly])
}
