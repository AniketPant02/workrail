"use client"

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { useDndMonitor, useDroppable, type DragEndEvent } from "@dnd-kit/core"
import type { Task } from "@/lib/types"
import { TimelineHeader } from "@/components/timeline/timeline-header"
import { TimelineTaskBlock, type ScheduledBlock } from "@/components/timeline/timeline-task-block"

interface HourlyTimelineProps {
    tasks?: Task[]
    onTaskTimeChange?: (task: Task, startAt: Date, endAt: Date) => void
}

export const TIMELINE_DROP_ID = "timeline-dropzone"

const HOUR_HEIGHT = 72 // px
const VERTICAL_PADDING = 12 // px
const DEFAULT_DURATION_MINUTES = 30
const MIN_DURATION_MINUTES = 15

const clampToDay = (minutes: number) => Math.min(Math.max(minutes, 0), 24 * 60)
const snapToQuarterHour = (minutes: number) => Math.round(minutes / 15) * 15
const toDate = (value: string | Date | null | undefined) => {
    if (!value) return null
    const d = value instanceof Date ? value : new Date(value)
    return isNaN(d.getTime()) ? null : d
}
const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
const minutesSinceMidnight = (date: Date) => date.getHours() * 60 + date.getMinutes()
const buildDateForMinutes = (base: Date, minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return new Date(base.getFullYear(), base.getMonth(), base.getDate(), hours, mins, 0, 0)
}

export function HourlyTimeline({ tasks = [], onTaskTimeChange }: HourlyTimelineProps) {
    const timelineRef = useRef<HTMLDivElement>(null)
    const firstRowRef = useRef<HTMLDivElement>(null)
    const { isOver, setNodeRef } = useDroppable({
        id: TIMELINE_DROP_ID,
    })
    const [rowHeight, setRowHeight] = useState(HOUR_HEIGHT)
    const [selectedDate, setSelectedDate] = useState(() => {
        const now = new Date()
        return new Date(now.getFullYear(), now.getMonth(), now.getDate())
    })

    const isToday = selectedDate.toDateString() === new Date().toDateString()
    const currentTime = new Date()
    const currentMinutes = minutesSinceMidnight(currentTime)
    const effectiveRowHeight = rowHeight || HOUR_HEIGHT
    const pixelsPerMinute = effectiveRowHeight / 60
    const currentOffset = isToday ? currentMinutes * pixelsPerMinute + VERTICAL_PADDING : null

    const taskMap = useMemo(() => new Map((tasks ?? []).map((task) => [task.id, task])), [tasks])

    const scheduledBlocks: ScheduledBlock[] = useMemo(() => {
        if (!tasks) return []

        return tasks
            .map((task) => {
                const startAt = toDate(task.startAt)
                const endAt = toDate(task.endAt)
                if (!startAt || !isSameDay(startAt, selectedDate)) return null

                const startMinutes = clampToDay(minutesSinceMidnight(startAt))
                const rawEnd = endAt && isSameDay(endAt, selectedDate) ? minutesSinceMidnight(endAt) : startMinutes + DEFAULT_DURATION_MINUTES
                const endMinutes = clampToDay(Math.max(startMinutes + MIN_DURATION_MINUTES, rawEnd))

                return { task, startMinutes, endMinutes }
            })
            .filter(Boolean) as ScheduledBlock[]
    }, [tasks, selectedDate])

    const getMinutesFromDrag = useCallback(
        (event: DragEndEvent, useBottom = false) => {
            const rect = event?.active?.rect?.current?.translated ?? event?.active?.rect?.current?.initial
            if (!rect || !timelineRef.current) return null

            const containerRect = timelineRef.current.getBoundingClientRect()
            const scrollTop = timelineRef.current.scrollTop
            const yPosition = (useBottom ? rect.bottom : rect.top) - containerRect.top + scrollTop
            const minutes = (yPosition - VERTICAL_PADDING) / pixelsPerMinute
            return clampToDay(snapToQuarterHour(minutes))
        },
        [pixelsPerMinute],
    )

    const handleTaskPlacement = useCallback(
        (task: Task, startMinutes: number, endMinutes: number) => {
            if (!onTaskTimeChange) return
            const start = buildDateForMinutes(selectedDate, startMinutes)
            const end = buildDateForMinutes(selectedDate, endMinutes)
            onTaskTimeChange(task, start, end)
        },
        [onTaskTimeChange, selectedDate],
    )

    useDndMonitor({
        onDragEnd(event) {
            if (!timelineRef.current) return

            const data = event.active.data?.current as Record<string, any> | undefined
            const isTimelineItem = data?.type === "timeline-task" || data?.type === "timeline-resize"

            if (!isTimelineItem && event.over?.id !== TIMELINE_DROP_ID) {
                return
            }

            const deltaMinutes = snapToQuarterHour((event.delta?.y ?? 0) / pixelsPerMinute)

            if (data?.type === "task" && data.task) {
                const startMinutes = getMinutesFromDrag(event)
                if (startMinutes === null) return
                const start = Math.min(clampToDay(startMinutes), 24 * 60 - MIN_DURATION_MINUTES)
                const end = clampToDay(start + DEFAULT_DURATION_MINUTES)
                handleTaskPlacement(data.task as Task, start, end)
                return
            }

            if (data?.type === "timeline-task" && data.taskId) {
                const task = taskMap.get(data.taskId)
                if (!task) return

                const startValue = data.startMinutes ?? 0
                const endValue = data.endMinutes ?? startValue + DEFAULT_DURATION_MINUTES

                const pointerStart = getMinutesFromDrag(event)
                const baseStart = pointerStart ?? snapToQuarterHour(startValue + deltaMinutes)
                const duration = Math.max(MIN_DURATION_MINUTES, endValue - startValue)
                const safeStart = clampToDay(Math.min(baseStart, 24 * 60 - duration))
                const end = clampToDay(safeStart + duration)
                handleTaskPlacement(task, safeStart, end)
                return
            }

            if (data?.type === "timeline-resize" && data.taskId) {
                const task = taskMap.get(data.taskId)
                if (!task) return

                const startValue = data.startMinutes ?? 0
                const endValue = data.endMinutes ?? startValue + DEFAULT_DURATION_MINUTES
                const pointerEnd = getMinutesFromDrag(event, true)
                const snappedStart = clampToDay(snapToQuarterHour(startValue))
                const minEnd = snappedStart + MIN_DURATION_MINUTES
                const proposedEnd = pointerEnd !== null ? snapToQuarterHour(pointerEnd) : snapToQuarterHour(endValue + deltaMinutes)
                const clampedEnd = clampToDay(Math.max(minEnd, proposedEnd))
                const safeEnd = Math.max(minEnd, clampedEnd)
                handleTaskPlacement(task, snappedStart, safeEnd)
            }
        },
    })

    useLayoutEffect(() => {
        if (!firstRowRef.current) return
        const height = firstRowRef.current.getBoundingClientRect().height
        if (height && Math.abs(height - rowHeight) > 0.5) {
            setRowHeight(height)
        }
    }, [rowHeight])

    useEffect(() => {
        if (!timelineRef.current || currentOffset === null) return

        const scrollPosition = Math.max(0, currentOffset - timelineRef.current.clientHeight / 2)
        timelineRef.current.scrollTop = Math.max(0, scrollPosition)
    }, [currentOffset])

    const handlePrevDay = () => {
        setSelectedDate((prev) => {
            const newDate = new Date(prev)
            newDate.setDate(prev.getDate() - 1)
            return newDate
        })
    }

    const handleNextDay = () => {
        setSelectedDate((prev) => {
            const newDate = new Date(prev)
            newDate.setDate(prev.getDate() + 1)
            return newDate
        })
    }

    const handleToday = () => {
        const now = new Date()
        setSelectedDate(new Date(now.getFullYear(), now.getMonth(), now.getDate()))
    }

    return (
        <div className="flex h-full min-h-0 max-h-full flex-col overflow-hidden border bg-card select-none">
            <TimelineHeader date={selectedDate} onPrevDay={handlePrevDay} onNextDay={handleNextDay} onToday={handleToday} />

            <div className="relative flex-1 min-h-0 overflow-hidden">
                <div
                    ref={(node) => {
                        timelineRef.current = node
                        setNodeRef(node)
                    }}
                    className={`relative h-full overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${isOver ? "bg-muted/40" : ""}`}
                >
                    <div
                        className="relative w-full px-3 sm:px-4"
                        style={{
                            height: `${VERTICAL_PADDING * 2 + effectiveRowHeight * 24}px`,
                            paddingTop: VERTICAL_PADDING,
                            paddingBottom: VERTICAL_PADDING,
                        }}
                    >
                        {currentOffset !== null && (
                            <div
                                className="pointer-events-none absolute inset-x-0 z-10 transition-all"
                                style={{
                                    top: `${currentOffset}px`,
                                }}
                            >
                                <div className="h-px w-full bg-orange-500" />
                            </div>
                        )}

                        {Array.from({ length: 24 }).map((_, index) => {
                            const hour = index
                            const isPM = hour >= 12
                            const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
                            const ampm = isPM ? "pm" : "am"

                            return (
                                <div
                                    key={hour}
                                    className="relative flex items-center border-b last:border-b-0"
                                    style={{ height: `${effectiveRowHeight}px` }}
                                    ref={hour === 0 ? firstRowRef : undefined}
                                >
                                    <div className="w-16 pr-2 text-sm font-medium text-muted-foreground text-right">
                                        {displayHour} {ampm}
                                    </div>
                                    <div className="flex-1 h-px bg-border" />
                                </div>
                            )
                        })}

                        <div className="absolute inset-y-0 left-16 right-2">
                            {scheduledBlocks.map((block) => (
                                <TimelineTaskBlock key={block.task.id} block={block} rowHeight={effectiveRowHeight} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
