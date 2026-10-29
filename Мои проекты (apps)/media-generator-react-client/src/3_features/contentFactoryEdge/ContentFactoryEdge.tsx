import { useState } from 'react'
import { BaseEdge, EdgeLabelRenderer, getBezierPath, useReactFlow } from '@xyflow/react'
import type { EdgeProps } from '@xyflow/react'
import styles from './ContentFactoryEdge.module.css'

export const ContentFactoryEdge = ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style,
    selected,
    data
}: EdgeProps) => {
    const { deleteElements } = useReactFlow()
    const [hovered, setHovered] = useState(false)
    const [edgePath, labelX, labelY] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition })
    const showButton = hovered || selected
    const { isDeletable, isViewerMode } = data ?? {};
    const canDelete = isDeletable ?? true
    return (
        <>
            <BaseEdge
                id={id}
                path={edgePath}
                style={style}
                interactionWidth={20}
            />
            {/* invisible wider hit area for hover detection */}
            <path
                d={edgePath}
                fill="none"
                stroke="transparent"
                strokeWidth={20}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
            />
            <EdgeLabelRenderer>
                {canDelete && !isViewerMode ? (
                    <button
                        className={`${styles.deleteButton} nodrag nopan text_tertiary`}
                        style={{
                            transform: `translate(-10%, -50%) translate(${labelX}px, ${labelY}px)`,
                            opacity: showButton ? 1 : 0,
                            pointerEvents: showButton ? 'all' : 'none',
                        }}
                        onMouseEnter={() => setHovered(true)}
                        onMouseLeave={() => setHovered(false)}
                        onClick={() => deleteElements({ edges: [{ id }] })}
                        title="Удалить соединение"
                    >
                        <svg width="9" height="9" viewBox="0 0 9 9" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 1L4.25 4.25M7.5 7.5L4.25 4.25M4.25 4.25L1 7.5M4.25 4.25L7.5 1" stroke="#F08400" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        Удалить связь
                    </button>) : <></>
                }
            </EdgeLabelRenderer>
        </>
    )
}
