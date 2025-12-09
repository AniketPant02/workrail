"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import useSWR, { useSWRConfig } from "swr"
import { DndContext } from "@dnd-kit/core"
import { ArrowLeft, CalendarDays, Clock3 } from "lucide-react"

import type { Task } from "@/lib/types"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { HourlyTimeline } from "@/components/timeline/hourly-timeline"

const fetcher = (url: string) => fetch(url).then((res) => res.json())
const DEFAULT_DURATION_MINUTES = 30

type ScheduledEntry = {
    task: Task
    start: Date
    end: Date
}

type TasksResponse = {
    data: Task[]
} | undefined

const toDate = (value: string | Date | null | undefined) => {
    if (!value) return null
    const d = value instanceof Date ? value : new Date(value)
    return isNaN(d.getTime()) ? null : d
}

const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()

const formatTime = (date: Date) =>
    date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })

const formatRange = (start: Date | null, end: Date | null) => {
    if (!start) return "No start time"
    const safeEnd =
        end && end > start
            ? end
            : new Date(start.getTime() + DEFAULT_DURATION_MINUTES * 60 * 1000)
    return `${formatTime(start)} – ${formatTime(safeEnd)}`
}

const formatDateCompact = (date: Date) =>
    date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })

const formatNextLabel = (minutes: number | null) => {
    if (minutes === null) return null
    if (minutes <= 0) return "starting now"
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"}`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes ? `${hours}h ${remainingMinutes}m` : `${hours}h`
}

const formatRemaining = (end: Date | null, now: Date) => {
    if (!end) return null
    const minutes = Math.round((end.getTime() - now.getTime()) / 60000)
    if (minutes <= 0) return "time's up"
    if (minutes < 60) return `${minutes}m remaining`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m remaining`
}

const sanitizeDescription = (value: string) => {
    if (!value) return ""
    if (typeof window === "undefined") return value

    const parser = new DOMParser()
    const doc = parser.parseFromString(value, "text/html")

    doc.querySelectorAll("script,style").forEach((el) => el.remove())
    doc.querySelectorAll("*").forEach((el) => {
        const attrs = Array.from(el.attributes)
        attrs.forEach((attr) => {
            const name = attr.name.toLowerCase()
            const val = attr.value
            const isEvent = name.startsWith("on")
            const isJsLink = (name === "href" || name === "src") && /^javascript:/i.test(val)
            if (isEvent || isJsLink) {
                el.removeAttribute(attr.name)
            }
        })
    })

    return doc.body.innerHTML || ""
}

export default function FocusMode() {
    const router = useRouter()
    const { data: session, isPending, error } = authClient.useSession()
    const { mutate } = useSWRConfig()
    const [now, setNow] = useState(() => new Date())

    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 30_000)
        return () => clearInterval(id)
    }, [])

    useEffect(() => {
        if (!isPending && (!session?.user || error)) {
            router.replace("/sign-in")
        }
    }, [error, isPending, router, session?.user])

    const tasksKey = session?.user ? "/api/tasks" : null
    const { data: tasksResponse } = useSWR(tasksKey, fetcher)
    const tasks: Task[] = useMemo(() => tasksResponse?.data ?? [], [tasksResponse])

    const today = useMemo(() => {
        const current = new Date(now)
        return new Date(current.getFullYear(), current.getMonth(), current.getDate())
    }, [now])

    const todaysSchedule: ScheduledEntry[] = useMemo(() => {
        const entries: ScheduledEntry[] = []

        tasks.forEach((task) => {
            const start = toDate(task.startAt)
            if (!start || !isSameDay(start, today)) return

            const endRaw = toDate(task.endAt)
            const end =
                endRaw && endRaw > start
                    ? endRaw
                    : new Date(start.getTime() + DEFAULT_DURATION_MINUTES * 60 * 1000)

            entries.push({ task, start, end })
        })

        return entries.sort((a, b) => a.start.getTime() - b.start.getTime())
    }, [tasks, today])

    const activeEntry = useMemo(
        () => todaysSchedule.find((entry) => now >= entry.start && now < entry.end),
        [now, todaysSchedule],
    )
    const nextEntry = useMemo(
        () => todaysSchedule.find((entry) => entry.start > now),
        [now, todaysSchedule],
    )
    const focusEntry = activeEntry ?? nextEntry ?? todaysSchedule[0]
    const minutesToNext = useMemo(() => {
        if (!nextEntry) return null
        return Math.max(0, Math.round((nextEntry.start.getTime() - now.getTime()) / 60000))
    }, [nextEntry, now])

    const currentTimeLabel = useMemo(
        () => now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
        [now],
    )
    const currentDateLabel = useMemo(() => formatDateCompact(now), [now])
    const timeRemaining = useMemo(() => formatRemaining(focusEntry?.end ?? null, now), [focusEntry?.end, now])
    const sanitizedDescription = useMemo(() => sanitizeDescription(focusEntry?.task.description?.trim() ?? ""), [focusEntry?.task.description])
    const hasDescription = Boolean(sanitizedDescription)

    const isLoadingTasks = Boolean(tasksKey && !tasksResponse)
    const hasFocusTask = Boolean(focusEntry)

    const handleTaskTimeChange = useCallback(
        async (task: Task, startAt: Date, endAt: Date) => {
            if (!tasksKey) return

            const payload = { startAt: startAt.toISOString(), endAt: endAt.toISOString() }

            await mutate<TasksResponse>(
                tasksKey,
                async (current) => {
                    const res = await fetch(`/api/tasks/${task.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload),
                    })

                    if (!res.ok) {
                        throw new Error("Failed to update task time")
                    }

                    const json = await res.json().catch(() => null)
                    const updatedTask = json?.data ?? { ...task, ...payload }

                    if (current?.data) {
                        return {
                            ...current,
                            data: current.data.map((t) => (t.id === task.id ? updatedTask : t)),
                        }
                    }

                    return { data: [updatedTask] }
                },
                {
                    optimisticData: (current) => {
                        const baseList: Task[] = current?.data ?? tasks
                        const hasExisting = baseList.some((t) => t.id === task.id)
                        const updatedList = hasExisting
                            ? baseList.map((t) => (t.id === task.id ? { ...t, ...payload } : t))
                            : [...baseList, { ...task, ...payload }]

                        return current ? { ...current, data: updatedList } : { data: updatedList }
                    },
                    rollbackOnError: true,
                    revalidate: false,
                },
            )
        },
        [mutate, tasks, tasksKey],
    )

    const handleTaskUnschedule = useCallback(
        async (task: Task) => {
            if (!tasksKey) return

            const payload = { startAt: null, endAt: null }

            await mutate<TasksResponse>(
                tasksKey,
                async (current) => {
                    const res = await fetch(`/api/tasks/${task.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload),
                    })

                    if (!res.ok) {
                        throw new Error("Failed to unschedule task")
                    }

                    const json = await res.json().catch(() => null)
                    const updatedTask = json?.data ?? { ...task, ...payload }

                    if (current?.data) {
                        return {
                            ...current,
                            data: current.data.map((t) => (t.id === task.id ? updatedTask : t)),
                        }
                    }

                    return { data: [updatedTask] }
                },
                {
                    optimisticData: (current) => {
                        const baseList: Task[] = current?.data ?? tasks
                        const hasExisting = baseList.some((t) => t.id === task.id)
                        const updatedList = hasExisting
                            ? baseList.map((t) => (t.id === task.id ? { ...t, ...payload } : t))
                            : [...baseList, { ...task, ...payload }]

                        return current ? { ...current, data: updatedList } : { data: updatedList }
                    },
                    rollbackOnError: true,
                    revalidate: false,
                },
            )
        },
        [mutate, tasks, tasksKey],
    )

    if (isPending) {
        return (
            <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
                <header className="flex items-center justify-between border-b border-border px-6 py-3">
                    <Skeleton className="h-9 w-32 rounded-md bg-card" />
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-5 w-28 rounded-full bg-card" />
                        <Skeleton className="h-5 w-16 rounded-full bg-card" />
                    </div>
                </header>
                <main className="flex flex-1 gap-4 overflow-hidden px-36 py-4">
                    <Skeleton className="h-full flex-1 rounded-xl bg-card" />
                    <Skeleton className="h-full w-80 rounded-xl bg-card" />
                </main>
            </div>
        )
    }

    if (!session?.user) {
        return null
    }

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
            <header className="flex items-center justify-between border-b border-border px-6 py-3">
                <Link href="/dashboard">
                    <Button variant="ghost" size="sm" className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Exit
                    </Button>
                </Link>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5" />
                        <span>{currentDateLabel}</span>
                    </div>
                    <div className="h-3 w-px bg-border" />
                    <span>{todaysSchedule.length} event{todaysSchedule.length === 1 ? "" : "s"}</span>
                    <div className="h-3 w-px bg-border" />
                    <span className="font-medium text-foreground">{currentTimeLabel}</span>
                </div>
            </header>

            <DndContext>
                <main className="flex flex-1 gap-4 overflow-hidden px-36 py-4">
                    <div className="flex min-w-0 flex-1">
                        <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                            <div className="shrink-0 border-b border-border px-6 py-4">
                                <div className="mb-2 flex items-center gap-2">
                                    <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                                    <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                                        {hasFocusTask ? (activeEntry ? "In Focus" : "Up Next") : "No Event"}
                                    </span>
                                </div>
                                <h1 className="mb-2 text-3xl font-bold leading-tight text-pretty sm:text-4xl">
                                    {focusEntry ? focusEntry.task.title : "Nothing scheduled for today"}
                                </h1>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Clock3 className="h-4 w-4" />
                                    <span>{formatRange(focusEntry?.start ?? null, focusEntry?.end ?? null)}</span>
                                    {timeRemaining ? (
                                        <span className="ml-auto font-medium text-primary">{timeRemaining}</span>
                                    ) : null}
                                </div>
                            </div>

                            <div className="flex-1 overflow-hidden px-6 py-4">
                                <div className="mb-2">
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Context
                                    </p>
                                    {hasDescription ? (
                                        <div
                                            className="space-y-2 text-sm leading-relaxed text-foreground/90 [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_li]:leading-relaxed [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:m-0 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5"
                                            dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
                                        />
                                    ) : (
                                        <p className="text-sm leading-relaxed text-muted-foreground">
                                            Add a description to this task to keep important context visible while you focus.
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="shrink-0 border-t border-border bg-muted/20 px-6 py-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                            Up Next
                                        </p>
                                        <p className="text-sm font-medium text-foreground">
                                            {nextEntry ? nextEntry.task.title : "Nothing else today"}
                                        </p>
                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                            {nextEntry ? formatRange(nextEntry.start, nextEntry.end) : "Enjoy the break."}
                                        </p>
                                    </div>
                                    <div className="text-right text-xs text-muted-foreground">
                                        {minutesToNext !== null ? `in ${formatNextLabel(minutesToNext)}` : ""}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex h-full min-h-0 w-80 shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                        <div className="h-full min-h-0">
                            {isLoadingTasks ? (
                                <Skeleton className="h-full w-full rounded-none bg-card" />
                            ) : (
                                <HourlyTimeline
                                    tasks={tasks}
                                    onTaskTimeChange={handleTaskTimeChange}
                                    onTaskUnschedule={handleTaskUnschedule}
                                />
                            )}
                        </div>
                    </div>
                </main>
            </DndContext>
        </div>
    )
}
