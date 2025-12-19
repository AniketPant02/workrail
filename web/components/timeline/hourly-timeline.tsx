"use client"

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { useDndMonitor, useDroppable, DragOverlay, type DragEndEvent } from "@dnd-kit/core"
import type { Task } from "@/lib/types"
import { TimelineHeader } from "@/components/timeline/timeline-header"
import { TimelineTaskBlock, type ScheduledBlock, type PositionedBlock } from "@/components/timeline/timeline-task-block"

interface HourlyTimelineProps {
    tasks?: Task[]
    onTaskTimeChange?: (task: Task, startAt: Date, endAt: Date) => void
    onTaskUnschedule?: (task: Task) => void
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

export function HourlyTimeline({ tasks = [], onTaskTimeChange, onTaskUnschedule }: HourlyTimelineProps) {
    const timelineRef = useRef<HTMLDivElement>(null)
    const firstRowRef = useRef<HTMLDivElement>(null)
    const { isOver, setNodeRef, active } = useDroppable({
        id: TIMELINE_DROP_ID,
    })
    const [rowHeight, setRowHeight] = useState(HOUR_HEIGHT)
    const [selectedDate, setSelectedDate] = useState(() => {
        const now = new Date()
        return new Date(now.getFullYear(), now.getMonth(), now.getDate())
    })

    const [now, setNow] = useState<Date | null>(null)

    useEffect(() => {
        setNow(new Date())
        const interval = setInterval(() => setNow(new Date()), 60000)
        return () => clearInterval(interval)
    }, [])

    // Local Optimistic State
    const [optimisticTasks, setOptimisticTasks] = useState<Task[]>(tasks)

    // Track active drag for ghost/overlay
    const [activeDragState, setActiveDragState] = useState<{
        taskId?: string
        task?: Task // For external tasks
        startMinutes: number
        endMinutes: number
        isNew?: boolean
        isResizing?: boolean
    } | null>(null)

    // Track any active generic drag task (e.g. from sidebar) to show overlay even when not over timeline
    const [activeSidebarTask, setActiveSidebarTask] = useState<Task | null>(null)

    // Track pending updates to prevent "stale prop" flash
    const pendingUpdates = useRef<Map<string, Task>>(new Map())

    // Sync: Update local state from props, but respect pending updates
    useEffect(() => {
        setOptimisticTasks((currentLocal) => {
            return tasks.map((incomingTask) => {
                const pending = pendingUpdates.current.get(incomingTask.id)
                if (pending) {
                    const incomingStart = toDate(incomingTask.startAt)?.getTime()
                    const pendingStart = toDate(pending.startAt)?.getTime()
                    const incomingEnd = toDate(incomingTask.endAt)?.getTime()
                    const pendingEnd = toDate(pending.endAt)?.getTime()

                    if (incomingStart === pendingStart && incomingEnd === pendingEnd) {
                        pendingUpdates.current.delete(incomingTask.id)
                        return incomingTask
                    } else {
                        return pending
                    }
                }
                return incomingTask
            })
        })
    }, [tasks])

    const isToday = now ? selectedDate.toDateString() === now.toDateString() : false
    const currentMinutes = now ? minutesSinceMidnight(now) : 0
    const effectiveRowHeight = rowHeight || HOUR_HEIGHT
    const pixelsPerMinute = effectiveRowHeight / 60
    const currentOffset = isToday && now ? currentMinutes * pixelsPerMinute + VERTICAL_PADDING : null

    const taskMap = useMemo(() => new Map((optimisticTasks ?? []).map((task) => [task.id, task])), [optimisticTasks])

    const getMinutesFromDrag = useCallback(
        (event: DragEndEvent | any, useBottom = false) => {
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

    // Calculation helper for drag events
    const calculateDragTimes = useCallback((event: DragEndEvent | any, isOverTimeline: boolean) => {
        if (!timelineRef.current || !isOverTimeline) return null

        const data = event.active.data?.current as Record<string, any> | undefined
        const deltaMinutes = snapToQuarterHour((event.delta?.y ?? 0) / pixelsPerMinute)

        if (data?.type === "task" && data.task) {
            // External task
            const startMinutes = getMinutesFromDrag(event)
            if (startMinutes === null) return null
            const start = Math.min(clampToDay(startMinutes), 24 * 60 - MIN_DURATION_MINUTES)
            const end = clampToDay(start + DEFAULT_DURATION_MINUTES)
            return { startMinutes: start, endMinutes: end, isNew: true, task: data.task as Task }
        }

        if (data?.type === "timeline-task" && data.taskId) {
            // Existing task move
            const startValue = data.startMinutes ?? 0
            const endValue = data.endMinutes ?? startValue + DEFAULT_DURATION_MINUTES

            const pointerStart = getMinutesFromDrag(event)
            // If pointerStart is available (mouse over timeline), use it for absolute positioning style
            // Otherwise fall back to delta (if dragging blindly? usually pointer works)

            const baseStart = pointerStart ?? snapToQuarterHour(startValue + deltaMinutes)
            const duration = Math.max(MIN_DURATION_MINUTES, endValue - startValue)
            const safeStart = clampToDay(Math.min(baseStart, 24 * 60 - duration))
            const end = clampToDay(safeStart + duration)

            return { startMinutes: safeStart, endMinutes: end, isNew: false, taskId: data.taskId, isResizing: false }
        }

        if (data?.type === "timeline-resize" && data.taskId) {
            // Resizing
            const startValue = data.startMinutes ?? 0
            const endValue = data.endMinutes ?? startValue + DEFAULT_DURATION_MINUTES
            const pointerEnd = getMinutesFromDrag(event, true)
            const snappedStart = clampToDay(snapToQuarterHour(startValue))
            const minEnd = snappedStart + MIN_DURATION_MINUTES
            const proposedEnd = pointerEnd !== null ? snapToQuarterHour(pointerEnd) : snapToQuarterHour(endValue + deltaMinutes)
            const clampedEnd = clampToDay(Math.max(minEnd, proposedEnd))
            const safeEnd = Math.max(minEnd, clampedEnd)
            return { startMinutes: snappedStart, endMinutes: safeEnd, isNew: false, taskId: data.taskId, isResizing: true }
        }

        return null
    }, [pixelsPerMinute, getMinutesFromDrag])


    const scheduledBlocks: ScheduledBlock[] = useMemo(() => {
        // Base blocks from optimistic state
        let blocks = (optimisticTasks ?? [])
            .map((task) => {
                // If this task is being dragged/resized, rely on the drag state instead
                if (activeDragState && !activeDragState.isNew && activeDragState.taskId === task.id) {
                    return null // Will be re-added below
                }

                const startAt = toDate(task.startAt)
                const endAt = toDate(task.endAt)
                if (!startAt || !isSameDay(startAt, selectedDate)) return null

                const startMinutes = clampToDay(minutesSinceMidnight(startAt))
                const rawEnd = endAt && isSameDay(endAt, selectedDate) ? minutesSinceMidnight(endAt) : startMinutes + DEFAULT_DURATION_MINUTES
                const endMinutes = clampToDay(Math.max(startMinutes + MIN_DURATION_MINUTES, rawEnd))

                return { task, startMinutes, endMinutes }
            })
            .filter(Boolean) as ScheduledBlock[]

        // Inject active drag ghost
        if (activeDragState) {
            // For new tasks (isNew), we construct a temp task object
            // For existing tasks, we grab from taskMap
            const task = activeDragState.isNew
                ? activeDragState.task!
                : taskMap.get(activeDragState.taskId!)

            if (task) {
                // Create a ghost block
                blocks.push({
                    task: task,
                    startMinutes: activeDragState.startMinutes,
                    endMinutes: activeDragState.endMinutes,
                })
            }
        }

        return blocks
    }, [optimisticTasks, selectedDate, activeDragState, taskMap])

    const positionedBlocks: PositionedBlock[] = useMemo(() => {
        if (!scheduledBlocks.length) return []

        // Break into clusters of overlapping events (by start time sweep)
        const sorted = [...scheduledBlocks].sort((a, b) => {
            if (a.startMinutes === b.startMinutes) {
                return a.endMinutes - b.endMinutes
            }
            return a.startMinutes - b.startMinutes
        })

        const clusters: ScheduledBlock[][] = []
        let currentCluster: ScheduledBlock[] = []
        let clusterEnd = -Infinity

        for (const block of sorted) {
            if (!currentCluster.length || block.startMinutes < clusterEnd) {
                currentCluster.push(block)
                clusterEnd = Math.max(clusterEnd, block.endMinutes)
            } else {
                clusters.push(currentCluster)
                currentCluster = [block]
                clusterEnd = block.endMinutes
            }
        }
        if (currentCluster.length) clusters.push(currentCluster)

        const layoutCluster = (cluster: ScheduledBlock[]): PositionedBlock[] => {
            const active: { endMinutes: number; column: number }[] = []
            let maxColumn = 0
            const placed: PositionedBlock[] = []

            const ordered = [...cluster].sort((a, b) => {
                if (a.startMinutes === b.startMinutes) {
                    return a.endMinutes - b.endMinutes
                }
                return a.startMinutes - b.startMinutes
            })

            for (const block of ordered) {
                // clear out tasks that ended before this block starts
                for (let i = active.length - 1; i >= 0; i -= 1) {
                    if (active[i].endMinutes <= block.startMinutes) {
                        active.splice(i, 1)
                    }
                }

                const usedColumns = new Set(active.map((item) => item.column))
                let column = 0
                while (usedColumns.has(column)) {
                    column += 1
                }

                active.push({ endMinutes: block.endMinutes, column })
                maxColumn = Math.max(maxColumn, column)
                placed.push({ ...block, column, columns: 0 })
            }

            const totalColumns = maxColumn + 1
            return placed.map((p) => ({ ...p, columns: totalColumns }))
        }

        return clusters.flatMap((cluster) => layoutCluster(cluster))
    }, [scheduledBlocks])

    const handleTaskPlacement = useCallback(
        (task: Task, startMinutes: number, endMinutes: number) => {
            const start = buildDateForMinutes(selectedDate, startMinutes)
            const end = buildDateForMinutes(selectedDate, endMinutes)

            const updatedTask = {
                ...task,
                startAt: start.toISOString(),
                endAt: end.toISOString(),
            }

            pendingUpdates.current.set(task.id, updatedTask)
            setOptimisticTasks((prev) => {
                const exists = prev.some(t => t.id === task.id)
                if (!exists) return [...prev, updatedTask]
                return prev.map((t) => (t.id === task.id ? updatedTask : t))
            })

            if (onTaskTimeChange) {
                onTaskTimeChange(task, start, end)
            }
        },
        [onTaskTimeChange, selectedDate],
    )

    const handleUnschedule = useCallback(
        (task: Task) => {
            const updatedTask = { ...task, startAt: null, endAt: null }
            pendingUpdates.current.set(task.id, updatedTask)
            setOptimisticTasks((prev) => {
                const hasTask = prev.some((t) => t.id === task.id)
                if (!hasTask) return [...prev, updatedTask]
                return prev.map((t) => (t.id === task.id ? updatedTask : t))
            })
            onTaskUnschedule?.(task)
        },
        [onTaskUnschedule],
    )

    useDndMonitor({
        onDragStart(event) {
            const data = event.active.data?.current as any

            if (data?.type === "task" && data.task) {
                setActiveSidebarTask(data.task)
                // Don't calculate drag times yet for new task, wait for move over timeline
            }

            if (data?.type === "timeline-task" || data?.type === "timeline-resize") {
                // Existing tasks are already on the timeline
                const calc = calculateDragTimes(event, true)
                if (calc) setActiveDragState({ ...calc, taskId: calc.taskId ?? calc.task?.id })
            }
        },
        onDragMove(event) {
            const isOverTimeline = event.over?.id === TIMELINE_DROP_ID
            const calc = calculateDragTimes(event, isOverTimeline)
            if (calc) {
                setActiveDragState(prev => {
                    if (prev && prev.startMinutes === calc.startMinutes && prev.endMinutes === calc.endMinutes) return prev
                    return { ...calc, taskId: calc.taskId ?? calc.task?.id }
                })
            } else {
                setActiveDragState(null)
            }
        },
        onDragCancel() {
            setActiveDragState(null)
            setActiveSidebarTask(null)
        },
        onDragEnd(event) {
            setActiveDragState(null)
            setActiveSidebarTask(null)
            if (!timelineRef.current) return

            const data = event.active.data?.current as Record<string, any> | undefined
            const isTimelineItem = data?.type === "timeline-task" || data?.type === "timeline-resize"

            if (!isTimelineItem && event.over?.id !== TIMELINE_DROP_ID) {
                return
            }

            // Reuse the calculation logic
            // Note: onDragEnd, isOver should be true if we are here and passed the check above?
            // Actually, event.over?.id check above is sufficient.
            const calc = calculateDragTimes(event, true) // assume true because we checked over id
            if (!calc) return

            if (calc.isNew && event.over?.id !== TIMELINE_DROP_ID) return

            if (calc.task || calc.taskId) {
                const task = calc.task ?? taskMap.get(calc.taskId!)
                if (task) handleTaskPlacement(task, calc.startMinutes, calc.endMinutes)
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

    const handlePrevDay = () => setSelectedDate((prev) => { const d = new Date(prev); d.setDate(prev.getDate() - 1); return d })
    const handleNextDay = () => setSelectedDate((prev) => { const d = new Date(prev); d.setDate(prev.getDate() + 1); return d })
    const handleToday = () => { const now = new Date(); setSelectedDate(new Date(now.getFullYear(), now.getMonth(), now.getDate())) }

    const shouldHighlight = isOver && active?.data?.current?.type === "task"

    // Determine overlay content
    const overlayContent = useMemo(() => {
        if (activeDragState && !activeDragState.isResizing) {
            const task = activeDragState.task ?? taskMap.get(activeDragState.taskId!)
            return task ? (
                <div style={{ width: '240px' }}>
                    <TimelineTaskBlock
                        block={{
                            task: task,
                            startMinutes: activeDragState.startMinutes,
                            endMinutes: activeDragState.endMinutes,
                            column: 0,
                            columns: 1
                        }}
                        rowHeight={effectiveRowHeight}
                        isOverlay
                    />
                </div>
            ) : null
        }

        if (activeSidebarTask) {
            // Render generic card for sidebar drag (not yet snapped)
            return (
                <div style={{ width: '240px' }}>
                    <div className="relative rounded-md border border-border bg-card text-card-foreground shadow-xl p-2.5 flex flex-col gap-1 cursor-grabbing">
                        <span className="text-xs font-semibold leading-tight truncate">{activeSidebarTask.title}</span>
                    </div>
                </div>
            )
        }

        return null
    }, [activeDragState, activeSidebarTask, taskMap, effectiveRowHeight])

    return (
        <div className="flex h-full min-h-0 max-h-full flex-col overflow-hidden border bg-card select-none">
            <TimelineHeader date={selectedDate} onPrevDay={handlePrevDay} onNextDay={handleNextDay} onToday={handleToday} />

            <div className="relative flex-1 min-h-0 overflow-hidden">
                <div
                    ref={(node) => {
                        timelineRef.current = node
                        setNodeRef(node)
                    }}
                    className={`relative h-full overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${shouldHighlight ? "bg-muted/40" : ""}`}
                >
                    <div
                        className="relative w-full"
                        style={{
                            height: `${VERTICAL_PADDING * 2 + effectiveRowHeight * 24}px`,
                            paddingTop: VERTICAL_PADDING,
                            paddingBottom: VERTICAL_PADDING,
                        }}
                    >
                        {currentOffset !== null && isToday && (
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
                                    className="relative"
                                    style={{ height: `${effectiveRowHeight}px` }}
                                    ref={hour === 0 ? firstRowRef : undefined}
                                >
                                    <div className="absolute inset-x-0 top-0 h-px bg-border" />
                                    <div className="absolute left-3 top-1 text-[11px] font-medium text-muted-foreground">
                                        {displayHour} {ampm}
                                    </div>
                                </div>
                            )
                        })}

                        <div className="absolute inset-x-0 bottom-0 h-px bg-border" />

                        <div className="absolute inset-y-0 left-2 right-2">
                            {positionedBlocks.map((block) => {
                                // If this is the ghost from dragging...
                                const isDraggingThis = activeDragState?.taskId === block.task.id

                                return (
                                    <TimelineTaskBlock
                                        key={block.task.id}
                                        block={block}
                                        rowHeight={effectiveRowHeight}
                                        onRemove={handleUnschedule}
                                        isGhost={isDraggingThis && !activeDragState?.isResizing}
                                    // If resizing, we might want to show it as real but changing size, or ghost. 
                                    // With current logic, we replace the original with the resized version. 
                                    // So it looks "real" but moves.
                                    // "Ghost" style (dashed) is usually for "where it will drop". 
                                    // For resize, we usually just resize the block.
                                    // Let's keep isGhost only for moving.
                                    />
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* DragOverlay for smooth dragging visual */}
            {overlayContent && createPortal(
                <DragOverlay>
                    {overlayContent}
                </DragOverlay>,
                document.body
            )}
        </div>
    )
}
