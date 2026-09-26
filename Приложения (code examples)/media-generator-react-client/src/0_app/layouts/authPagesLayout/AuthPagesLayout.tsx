import { Outlet } from 'react-router'
import styles from './AuthPagesLayout.module.css'
import { useRef, useEffect } from 'react'


// gallery autoscroll speed params
const COLUMN_SPEEDS_PX_PER_SEC = [25, 25, 25, 25] as const

const colorSchema = [
    '#5329FF',
    '#F0AD00',
    'var(--color-bg-dk-solid-alt)'
]

function getRandomColor(): string {
    return colorSchema[Math.floor(Math.random() * colorSchema.length)]
}

function generateUniqueRandomArray(): { id: number; height: number; isColored?: boolean }[] {
    const pool = Array.from({ length: 30 }, (_, i) => i + 1)
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]]
    }
    const items = pool.slice(0, 12).map((id) => ({
        id,
        height: Math.floor(Math.random() * (900 - 130 + 1)) + 130,
        isColored: false,
    }))
    // выбираем 2 уникальных случайных индекса
    const firstIdx = Math.floor(Math.random() * 12)
    let secondIdx
    do {
        secondIdx = Math.floor(Math.random() * 12)
    } while (secondIdx === firstIdx)
    let thirdIdx
    do {
        thirdIdx = Math.floor(Math.random() * 12)
    } while (thirdIdx === firstIdx && thirdIdx === secondIdx)
    items[firstIdx].isColored = true
    items[secondIdx].isColored = true
    items[thirdIdx].isColored = true
    return items
}
export const AuthPagesLayout = () => {
    const firstColumnRef = useRef<HTMLDivElement>(null)
    const secondColumnRef = useRef<HTMLDivElement>(null)
    const thirdColumnRef = useRef<HTMLDivElement>(null)
    const fourthColumnRef = useRef<HTMLDivElement>(null)


    // uncomment this to enable autoscroll for the gallery
    useEffect(function galleryAnimation() {
        const columnRefs = [
            firstColumnRef,
            secondColumnRef,
            thirdColumnRef,
            fourthColumnRef,
        ] as const
        /** −1 = к уменьшению scrollTop (контент движется вверх), +1 = вниз */
        const dirs = [-1, 1, -1, 1]
        const positions = [0, 0, 0, 0]

        const scrollOddColumnsToBottom = () => {
            columnRefs.forEach((ref, i) => {
                const el = ref.current
                if (!el) return
                positions[i] = el.scrollTop
            })

            for (const i of [0, 2] as const) {
                const el = columnRefs[i].current
                if (!el) continue
                const max = el.scrollHeight - el.clientHeight
                if (max > 0) {
                    positions[i] = max
                    el.scrollTop = max
                }
            }
        }

        let rafId = 0
        let lastTime = performance.now()

        const tick = (now: number) => {
            const dt = Math.min((now - lastTime) / 1000, 0.05)
            lastTime = now

            columnRefs.forEach((ref, i) => {
                const el = ref.current
                if (!el) return
                const maxScroll = el.scrollHeight - el.clientHeight
                if (maxScroll <= 0) {
                    positions[i] = 0
                    return
                }

                const speed = COLUMN_SPEEDS_PX_PER_SEC[i]
                const dir = dirs[i]
                const nextPosition = positions[i] + speed * dir * dt
                positions[i] = nextPosition

                if (dir < 0 && positions[i] <= 0) {
                    positions[i] = 0
                    dirs[i] = 1
                } else if (dir > 0 && positions[i] >= maxScroll - 0.5) {
                    positions[i] = maxScroll
                    dirs[i] = -1
                }

                el.scrollTop = positions[i]
            })

            rafId = requestAnimationFrame(tick)
        }

        const start = () => {
            scrollOddColumnsToBottom()
            lastTime = performance.now()
            rafId = requestAnimationFrame(tick)
        }

        requestAnimationFrame(start)

        return () => cancelAnimationFrame(rafId)
    }, [])
    return (
        <div className={styles.authLayout}>
            {/* gallery */}
            <section className={styles.gallery}>
                <div className={styles.gallery__masonryWrapper_alt}>
                    <div className={styles.gallery__masonryColumn} ref={firstColumnRef}>
                        {generateUniqueRandomArray().map((item, index) => {
                            const { isColored } = item
                            return (
                                <div className={styles.gallery__masonryItem} style={{ height: item.height, backgroundColor: isColored ? getRandomColor() : '' }} id={`item-${index + 1}`} key={index}>
                                    {!isColored && <img src={`/authpages/${item.id}.jpg`} alt={`image-${item.id}`} />}
                                </div>
                            )
                        })}
                    </div>
                    <div className={styles.gallery__masonryColumn} ref={secondColumnRef}>
                        {generateUniqueRandomArray().map((item, index) => {
                            const { isColored } = item
                            return (
                                <div className={styles.gallery__masonryItem} style={{ height: item.height, backgroundColor: isColored ? getRandomColor() : '' }} id={`item-${index + 1}`} key={index}>
                                    {!isColored && <img src={`/authpages/${item.id}.jpg`} alt={`image-${item.id}`} />}
                                </div>
                            )
                        })}
                    </div>
                    <div className={styles.gallery__masonryColumn} ref={thirdColumnRef}>
                        {generateUniqueRandomArray().map((item, index) => {
                            const { isColored } = item
                            return (
                                <div className={styles.gallery__masonryItem} style={{ height: item.height, backgroundColor: isColored ? getRandomColor() : '' }} id={`item-${index + 1}`} key={index}>
                                    {!isColored && <img src={`/authpages/${item.id}.jpg`} alt={`image-${item.id}`} />}
                                </div>
                            )
                        })}
                    </div>
                    <div className={styles.gallery__masonryColumn} ref={fourthColumnRef}>
                        {generateUniqueRandomArray().map((item, index) => {
                            const { isColored } = item
                            return (
                                <div className={styles.gallery__masonryItem} style={{ height: item.height, backgroundColor: isColored ? getRandomColor() : '' }} id={`item-${index + 1}`} key={index}>
                                    {!isColored && <img src={`/authpages/${item.id}.jpg`} alt={`image-${item.id}`} />}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </section>
            {/* auth widget */}
            <section className={styles.authLayout__authWidgetWrapper}>
                <Outlet />
            </section>
        </div>
    )
}