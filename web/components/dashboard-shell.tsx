"use client"

import { ReactNode, useCallback, useMemo, useState } from "react"
import useSWR, { useSWRConfig } from "swr"
import { DndContext, DragOverlay, type DragEndEvent, type DragStartEvent, useSensor, useSensors, PointerSensor, KeyboardSensor, MouseSensor, TouchSensor } from "@dnd-kit/core"
import type { Task } from "@/lib/types"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { WorkrailSidebar } from "@/components/app-sidebar"
import { DashboardBreadcrumb } from "@/components/dashboard-breadcrumb"
import { HourlyTimeline } from "@/components/timeline/hourly-timeline"
import { authClient } from "@/lib/auth-client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Focus } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface DashboardShellProps {
  children: ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  const { data: session } = authClient.useSession()
  const { mutate } = useSWRConfig()
  const tasksKey = session?.user ? "/api/tasks" : null
  const { data: tasksResponse } = useSWR(tasksKey, fetcher)
  const tasks: Task[] = useMemo(() => tasksResponse?.data ?? [], [tasksResponse])
  const [overlayTask, setOverlayTask] = useState<Task | null>(null)

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data?.current as Record<string, unknown> | undefined
    const type = data?.type as string | undefined
    if (type === "task" && data?.task) {
      setOverlayTask(data.task as Task)
      return
    }
    setOverlayTask(null)
  }, [])

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    setOverlayTask(null)

    // Check if dropped on a folder
    const overId = event.over?.id?.toString()
    if (overId?.startsWith("folder-")) {
      const activeData = event.active.data?.current as Record<string, unknown> | undefined
      if (activeData?.type === "task" && activeData?.task) {
        const task = activeData.task as Task
        const folderId = event.over?.data?.current?.folderId as string | undefined

        if (folderId && task.id) {
          // Optimistically update the cache and call API
          const payload = { folderId }

          // Mutate all task-related caches
          await mutate(
            tasksKey,
            async (current: any) => {
              const res = await fetch(`/api/tasks/${task.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
              })

              if (!res.ok) {
                throw new Error("Failed to update task folder")
              }

              const json = await res.json().catch(() => null)
              const updatedTask = json?.data ?? { ...task, folderId }

              if (current?.data) {
                return {
                  ...current,
                  data: current.data.map((t: Task) => (t.id === task.id ? updatedTask : t)),
                }
              }

              return { data: [updatedTask] }
            },
            {
              optimisticData: (current: any) => {
                const baseList: Task[] = current?.data ?? tasks
                const updatedList = baseList.map((t) =>
                  t.id === task.id ? { ...t, folderId } : t
                )
                return current ? { ...current, data: updatedList } : { data: updatedList }
              },
              rollbackOnError: true,
              revalidate: false,
            }
          )

          // Also revalidate the specific folder's task list
          mutate(`/api/tasks?folderId=${folderId}`)
          // And the previous folder if task was in one
          if (task.folderId) {
            mutate(`/api/tasks?folderId=${task.folderId}`)
          }
        }
      }
    }
  }, [mutate, tasks, tasksKey])

  const handleDragCancel = useCallback(() => {
    setOverlayTask(null)
  }, [])

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  )

  const handleTaskTimeChange = useCallback(
    async (task: Task, startAt: Date, endAt: Date) => {
      if (!tasksKey) return

      const payload = { startAt: startAt.toISOString(), endAt: endAt.toISOString() }

      await mutate(
        tasksKey,
        async (current: any) => {
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
              data: current.data.map((t: Task) => (t.id === task.id ? updatedTask : t)),
            }
          }

          return { data: [updatedTask] }
        },
        {
          optimisticData: (current: any) => {
            const baseList: Task[] = current?.data ?? tasks
            const hasExisting = baseList.some((t) => t.id === task.id)
            const updatedList = hasExisting
              ? baseList.map((t) => (t.id === task.id ? { ...t, ...payload } : t))
              : [...baseList, { ...task, ...payload }]

            return current ? { ...current, data: updatedList } : { data: updatedList }
          },
          rollbackOnError: true,
          // Avoid a refetch-induced flash; rely on optimistic data and background fetch later if needed.
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

      await mutate(
        tasksKey,
        async (current: any) => {
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
              data: current.data.map((t: Task) => (t.id === task.id ? updatedTask : t)),
            }
          }

          return { data: [updatedTask] }
        },
        {
          optimisticData: (current: any) => {
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

  return (
    <SidebarProvider>
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel} sensors={sensors}>
        <WorkrailSidebar />
        <SidebarInset>
          <div className="flex h-screen w-full flex-col overflow-hidden">
            <header className="flex h-16 shrink-0 items-center gap-3 border-b px-4">
              <SidebarTrigger className="text-muted-foreground" />
              <Separator
                orientation="vertical"
                className="h-6 bg-border"
              />
              <DashboardBreadcrumb />
              <div className="ml-auto">
                <Link href="/focus-mode">
                  <Button variant="outline" size="sm" className="flex gap-2 items-center">
                    <Focus /> Focus Mode
                  </Button>
                </Link>
              </div>
            </header>
            <div className="flex flex-1 min-h-0 flex-row gap-4 lg:gap-0">
              <section className="flex-1 min-h-0 flex flex-col overflow-hidden">{children}</section>
              <aside className="border-t lg:w-80 lg:border-l lg:border-t-0 flex flex-col min-h-0 h-full overflow-hidden">
                <HourlyTimeline
                  tasks={tasks}
                  onTaskTimeChange={handleTaskTimeChange}
                  onTaskUnschedule={handleTaskUnschedule}
                />
              </aside>
            </div>
          </div>
        </SidebarInset>
      </DndContext>
    </SidebarProvider>
  )
}
