"use client"

import type React from "react"
import { useDraggable } from "@dnd-kit/core"
import type { Task } from "@/lib/types"

const VERTICAL_PADDING = 12 // keep in sync with timeline
const MIN_DURATION_MINUTES = 15

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

interface TimelineTaskBlockProps {
    block: ScheduledBlock
    rowHeight: number
}

export function TimelineTaskBlock({ block, rowHeight }: TimelineTaskBlockProps) {
    const pixelsPerMinute = rowHeight / 60
    const top = VERTICAL_PADDING + block.startMinutes * pixelsPerMinute
    const baseHeight = Math.max((block.endMinutes - block.startMinutes) * pixelsPerMinute, 12)

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

    const handleResizePointerDown: React.PointerEventHandler<HTMLDivElement> | undefined = resizeListeners.onPointerDown
        ? (event) => {
            resizeListeners.onPointerDown?.(event)
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
            }}
            className={`absolute left-0 right-0 rounded-lg border bg-primary/15 px-3 py-2 shadow-sm ring-1 ring-primary/20 transition-all ${isDragging ? "z-20 border-primary bg-primary/25 ring-primary/40" : "z-10"
                } ${isResizing ? "border-primary bg-primary/20" : ""}`}
            {...attributes}
            {...listeners}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col">
                    <span className="truncate text-sm font-semibold text-foreground">{block.task.title}</span>
                    <span className="text-[11px] font-medium text-muted-foreground">
                        {formatTime(startHour, startMinute)} – {formatTime(endHour, endMinute)}
                    </span>
                </div>
                <div className="flex flex-col items-end gap-1 text-[10px] text-muted-foreground">
                    <div className="h-1 w-10 rounded-full bg-primary/50" />
                    <div className="h-1 w-7 rounded-full bg-primary/30" />
                </div>
            </div>

            <div
                ref={setResizeRef}
                {...resizeAttributes}
                {...resizeListeners}
                onPointerDown={handleResizePointerDown}
                className="absolute left-2 right-2 bottom-0 h-3 cursor-ns-resize rounded-b-md bg-gradient-to-b from-primary/40 to-primary/70"
            />
        </div>
    )
}

export type { ScheduledBlock }
