"use client"

import type React from "react"
import { useDraggable } from "@dnd-kit/core"
import type { Task } from "@/lib/types"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

const VERTICAL_PADDING = 12 // keep in sync with timeline
const MIN_DURATION_MINUTES = 15
const LABEL_OFFSET_PX = 40
const COLUMN_GAP_PX = 6

const formatTime = (hour: number, minute: number, includeAmPm = true) => {
    const isPM = hour >= 12
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    const ampm = isPM ? "PM" : "AM"
    if (!includeAmPm) return `${displayHour}:${minute.toString().padStart(2, "0")}`
    return `${displayHour}:${minute.toString().padStart(2, "0")} ${ampm}`
}

interface ScheduledBlock {
    task: Task
    startMinutes: number
    endMinutes: number
}

interface PositionedBlock extends ScheduledBlock {
    column: number
    columns: number
}

interface TimelineTaskBlockProps {
    block: PositionedBlock
    rowHeight: number
    onRemove?: (task: Task) => void
}

export function TimelineTaskBlock({ block, rowHeight, onRemove, isOverlay, isGhost }: TimelineTaskBlockProps & { isOverlay?: boolean; isGhost?: boolean }) {
    const pixelsPerMinute = rowHeight / 60
    const top = VERTICAL_PADDING + block.startMinutes * pixelsPerMinute
    const baseHeight = Math.max((block.endMinutes - block.startMinutes) * pixelsPerMinute, MIN_DURATION_MINUTES * pixelsPerMinute)
    const columnWidth = isOverlay ? "100%" : `calc((100% - ${LABEL_OFFSET_PX}px - ${(block.columns - 1) * COLUMN_GAP_PX}px) / ${block.columns})`
    const leftOffset = isOverlay ? "0" : `calc(${LABEL_OFFSET_PX}px + (${columnWidth} + ${COLUMN_GAP_PX}px) * ${block.column})`

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        isDragging,
    } = useDraggable({
        id: `timeline-task-${block.task.id}`,
        data: {
            type: "timeline-task",
            taskId: block.task.id,
            startMinutes: block.startMinutes,
            endMinutes: block.endMinutes,
        },
        disabled: isOverlay || isGhost,
    })

    const {
        attributes: resizeAttributes,
        listeners: resizeListeners,
        setNodeRef: setResizeRef,
        transform: resizeTransform,
        isDragging: isResizing,
    } = useDraggable({
        id: `timeline-resize-${block.task.id}`,
        data: {
            type: "timeline-resize",
            taskId: block.task.id,
            startMinutes: block.startMinutes,
            endMinutes: block.endMinutes,
        },
        disabled: isOverlay || isGhost,
    })

    const handleResizePointerDown: React.PointerEventHandler<HTMLDivElement> | undefined =
        resizeListeners?.onPointerDown
            ? (event) => {
                resizeListeners?.onPointerDown?.(event)
                event.stopPropagation()
            }
            : undefined

    // Core Logic Fix: 
    // If we are dragging/resizing, the parent (HourlyTimeline) updates the 'block' props 
    // to the new snapped position/size in real-time.
    // Therefore, we must IGNORE the dnd-kit 'transform' delta, otherwise we double-count the movement 
    // (once via props, once via transform) causing the item to fly away or move 2x speed.
    const effectiveTransformY = (isDragging || isResizing || isOverlay || isGhost) ? 0 : (transform?.y ?? 0)
    const effectiveResizeDeltaY = (isResizing || isOverlay || isGhost) ? 0 : (resizeTransform?.y ?? 0)

    const height = Math.max(baseHeight + effectiveResizeDeltaY, MIN_DURATION_MINUTES * pixelsPerMinute)

    const startHour = Math.floor(block.startMinutes / 60)
    const startMinute = block.startMinutes % 60
    const endHour = Math.floor(block.endMinutes / 60)
    const endMinute = block.endMinutes % 60

    const isCompact = (block.endMinutes - block.startMinutes) <= 30

    // Style logic
    // Overlay: The floating card. Solid, styled like a task.
    // Ghost (or Dragging Original): The snap indicator. Dashed, faint.
    // Standard: The task itself.

    const isGhostMode = isGhost || (isDragging && !isOverlay)

    const style = {
        top: isOverlay ? undefined : `${top + effectiveTransformY}px`,
        height: `${height}px`,
        left: isOverlay ? undefined : leftOffset,
        width: isOverlay ? '240px' : columnWidth,
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "group rounded-md border",
                // Overlay Style
                isOverlay && "relative cursor-grabbing z-50 shadow-xl border-border bg-card text-card-foreground",

                // Ghost/Dragging Style
                isGhostMode && "absolute z-0 border-2 border-dashed border-primary/50 bg-primary/5 text-muted-foreground",

                // Standard Style
                !isOverlay && !isGhostMode && "absolute z-10 border-primary/30 bg-primary/10 shadow-sm hover:border-primary/60 hover:bg-primary/15 transition-[background-color,border-color,box-shadow,height,top] duration-150",

                // Resizing Style (keep opaque updates)
                isResizing && "border-primary bg-primary/15 opacity-100 transition-none",
            )}
            {...attributes}
            {...listeners}
        >
            {!isOverlay && !isGhostMode && onRemove && (
                <button
                    type="button"
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={(event) => {
                        event.stopPropagation()
                        onRemove(block.task)
                    }}
                    className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full text-foreground/60 transition-colors hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100"
                    aria-label="Remove from timeline"
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            )}
            <div className={cn("flex min-w-0 h-full", isCompact ? "flex-row items-center px-2" : "flex-col gap-1 p-2.5", isOverlay && "items-start")}>
                <div className={cn("flex-1 flex min-w-0", isCompact ? "flex-row items-baseline gap-1.5" : "flex-col gap-0.5")}>
                    <span className={cn("text-xs font-semibold leading-tight truncate", isOverlay ? "text-foreground" : "text-foreground")}>{block.task.title}</span>
                    <span className={cn("text-[11px] font-medium leading-tight truncate shrink-0", isOverlay ? "text-muted-foreground" : "text-muted-foreground/70")}>
                        {isCompact ? (
                            <span className="opacity-75 font-normal ml-auto text-[10px]">{formatTime(startHour, startMinute, false)} - {formatTime(endHour, endMinute, false)}</span>
                        ) : (
                            <>{formatTime(startHour, startMinute)} – {formatTime(endHour, endMinute)}</>
                        )}
                    </span>
                </div>
            </div>

            {!isOverlay && !isGhostMode && (
                <div
                    ref={setResizeRef}
                    {...resizeAttributes}
                    {...resizeListeners}
                    onPointerDown={handleResizePointerDown}
                    className="absolute left-2 right-2 bottom-0 h-1 cursor-ns-resize rounded-b-md bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 hover:opacity-100 transition-opacity"
                />
            )}
        </div>
    )
}

export type { ScheduledBlock, PositionedBlock }
