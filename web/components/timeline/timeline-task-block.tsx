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

const formatTime = (hour: number, minute: number) => {
    const isPM = hour >= 12
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    const ampm = isPM ? "PM" : "AM"
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

export function TimelineTaskBlock({ block, rowHeight, onRemove }: TimelineTaskBlockProps) {
    const pixelsPerMinute = rowHeight / 60
    const top = VERTICAL_PADDING + block.startMinutes * pixelsPerMinute
    const baseHeight = Math.max((block.endMinutes - block.startMinutes) * pixelsPerMinute, MIN_DURATION_MINUTES * pixelsPerMinute)
    const columnWidth = `calc((100% - ${LABEL_OFFSET_PX}px - ${(block.columns - 1) * COLUMN_GAP_PX}px) / ${block.columns})`
    const leftOffset = `calc(${LABEL_OFFSET_PX}px + (${columnWidth} + ${COLUMN_GAP_PX}px) * ${block.column})`

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
    })

    const handleResizePointerDown: React.PointerEventHandler<HTMLDivElement> | undefined =
        resizeListeners?.onPointerDown
            ? (event) => {
                resizeListeners?.onPointerDown?.(event)
                event.stopPropagation()
            }
            : undefined

    const translateY = transform?.y ?? 0
    const resizeDeltaY = resizeTransform?.y ?? 0
    const height = Math.max(baseHeight + resizeDeltaY, MIN_DURATION_MINUTES * pixelsPerMinute)

    const startHour = Math.floor(block.startMinutes / 60)
    const startMinute = block.startMinutes % 60
    const endHour = Math.floor(block.endMinutes / 60)
    const endMinute = block.endMinutes % 60

    return (
        <div
            ref={setNodeRef}
            style={{
                top: `${top + translateY}px`,
                height: `${height}px`,
                left: leftOffset,
                width: columnWidth,
            }}
            className={cn(
                "group absolute rounded-md border",
                isDragging || isResizing
                    ? "transition-none"
                    : "transition-[background-color,border-color,box-shadow] duration-150",
                isDragging
                    ? "z-20 border-primary bg-primary shadow-lg shadow-primary/20"
                    : "z-10 border-primary/30 bg-primary/8 shadow-sm",
                isResizing && "border-primary bg-primary/15",
            )}
            {...attributes}
            {...listeners}
        >
            {onRemove && (
                <button
                    type="button"
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={(event) => {
                        event.stopPropagation()
                        onRemove(block.task)
                    }}
                    className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground/80 transition-colors hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100"
                    aria-label="Remove from timeline"
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            )}
            <div className="flex flex-col gap-1 p-2.5 h-full">
                <div className="flex-1 flex flex-col gap-0.5 min-w-0">
                    <span className="text-xs font-semibold text-foreground leading-tight truncate">{block.task.title}</span>
                    <span className="text-[11px] font-medium text-muted-foreground/70 leading-tight truncate">
                        {formatTime(startHour, startMinute)} – {formatTime(endHour, endMinute)}
                    </span>
                </div>
            </div>

            <div
                ref={setResizeRef}
                {...resizeAttributes}
                {...resizeListeners}
                onPointerDown={handleResizePointerDown}
                className="absolute left-2 right-2 bottom-0 h-1 cursor-ns-resize rounded-b-md bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 hover:opacity-100 transition-opacity"
            />
        </div>
    )
}

export type { ScheduledBlock, PositionedBlock }
