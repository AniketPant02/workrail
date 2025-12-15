"use client"

import useSWR from "swr"
import { useEffect, useMemo, useState } from "react"
import { authClient } from "@/lib/auth-client"
import type { Task } from "@/lib/types"
import TaskList from "@/components/tasks/task-list"
import TaskEditor from "@/components/tasks/task-editor"
import { useParams, usePathname } from "next/navigation"
import { useDebounce } from "@/hooks/use-debounce"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function TaskCenter() {
  const { data: session, error: sessionError } = authClient.useSession()
  const params = useParams<{ folderID?: string }>()
  const pathname = usePathname()
  const folderParam = params?.folderID
  const folderId = typeof folderParam === "string" ? folderParam : Array.isArray(folderParam) ? folderParam[0] : undefined
  const isDueSoon = pathname?.startsWith("/dashboard/due-soon")

  const tasksKey = useMemo(() => {
    if (!session?.user) return null
    const search = new URLSearchParams()
    if (folderId) search.set("folderId", folderId)
    if (isDueSoon) search.set("dueSoon", "true")
    const qs = search.toString()
    return qs ? `/api/tasks?${qs}` : "/api/tasks"
  }, [folderId, isDueSoon, session?.user])

  const { data: tasksResponse, mutate } = useSWR(tasksKey, fetcher)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [draftTask, setDraftTask] = useState<Task | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const tasks: Task[] = useMemo(() => tasksResponse?.data ?? [], [tasksResponse])


  const debouncedTask = useDebounce(draftTask, 1000)

  useEffect(() => {
    const selected = tasks.find((t) => t.id === selectedTaskId) || null
    // Only update draft if we selected a different task or if the task was updated remotely (and we aren't editing)
    // For simplicity in this logic: if selectedTaskId changes, we switch. 
    // If tasks update, we might want to sync, but that's complex with local edits.
    // For now, let's just sync on selection change.
    setDraftTask(selected ? { ...selected } : null)
  }, [selectedTaskId]) // Removed 'tasks' dependency to avoid overwriting local edits on revalidation

  // Autosave effect
  useEffect(() => {
    if (!debouncedTask) return

    // Verify we have a critical difference to save
    const currentUpstream = tasks.find(t => t.id === debouncedTask.id)
    if (!currentUpstream) return

    const hasChanges = JSON.stringify(debouncedTask) !== JSON.stringify(currentUpstream)

    if (hasChanges) {
      handleSaveTask(debouncedTask)
    }
  }, [debouncedTask])


  if (!session?.user || sessionError) {
    return null
  }

  const handleCreateTask = async (title: string) => {
    setIsCreating(true)
    try {
      const payload: Record<string, unknown> = { title }
      if (folderId) {
        payload.folderId = folderId
      }

      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        console.error("Failed to create task", await res.text())
        return
      }

      const json = await res.json()
      await mutate()
      setSelectedTaskId(json?.data?.id ?? null)
    } finally {
      setIsCreating(false)
    }
  }

  const handleDraftChange = (updates: Partial<Task>) => {
    setDraftTask((prev) => (prev ? { ...prev, ...updates } : prev))
  }

  const handleSaveTask = async (taskToSave: Task) => {
    setIsSaving(true)

    try {
      const payload = {
        title: taskToSave.title,
        description: taskToSave.description ?? null,
        status: taskToSave.status,
        priority: taskToSave.priority,
        folderId: taskToSave.folderId,
        dueDate: taskToSave.dueDate ? new Date(taskToSave.dueDate).toISOString() : null,
        startAt: taskToSave.startAt ? new Date(taskToSave.startAt).toISOString() : null,
        endAt: taskToSave.endAt ? new Date(taskToSave.endAt).toISOString() : null,
      }

      // Ensure "Saving..." shows for at least 1 second for better UX
      const [res] = await Promise.all([
        fetch(`/api/tasks/${taskToSave.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }),
        new Promise((resolve) => setTimeout(resolve, 1000)),
      ])

      if (!res.ok) {
        console.error("Failed to update task", await res.text())
        return
      }

      const json = await res.json()
      // We don't want to overwrite the draft with the server response immediately 
      // because the user might have kept typing. 
      // But we should update the SWR cache.
      await mutate()
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteTask = async () => {
    if (!draftTask) return
    setIsDeleting(true)

    try {
      const res = await fetch(`/api/tasks/${draftTask.id}`, { method: "DELETE" })

      if (!res.ok) {
        console.error("Failed to delete task", await res.text())
        return
      }

      setDraftTask(null)
      setSelectedTaskId(null)
      await mutate()
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteTaskById = async (taskId: string) => {
    try {
      // Optimistic update could go here, but for now we'll just wait for the API
      // To prevent jitter, we could mutate immediately
      await mutate((current: any) => {
        if (!current?.data) return current
        return {
          ...current,
          data: current.data.filter((t: Task) => t.id !== taskId),
        }
      }, { revalidate: false })


      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" })

      if (!res.ok) {
        // dynamic revalidation will happen on next focus/interval if we don't manually trigger it, 
        // but let's revalidate to be safe if it failed
        await mutate()
        console.error("Failed to delete task", await res.text())
        return
      }

      if (selectedTaskId === taskId) {
        setSelectedTaskId(null)
        setDraftTask(null)
      }

      // Final revalidation to ensure sync
      await mutate()
    } catch (error) {
      console.error("Failed to delete task", error)
      await mutate()
    }
  }

  return (
    <div className="flex h-full min-h-0 bg-background">
      <div className="w-[380px] min-w-0 min-h-0 shrink-0">
        <TaskList
          tasks={tasks}
          selectedTaskId={selectedTaskId}
          onSelectTask={setSelectedTaskId}
          onCreateTask={handleCreateTask}
          onDeleteTask={handleDeleteTaskById}
          isCreating={isCreating}
        />
      </div>

      <div className="flex-1 min-h-0">
        <TaskEditor
          task={draftTask}
          onChange={handleDraftChange}
          onDelete={handleDeleteTask}
          isSaving={isSaving}
          isDeleting={isDeleting}
        />
      </div>
    </div>
  )
}
