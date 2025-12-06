"use client"

import useSWR from "swr"
import { useEffect, useMemo, useState } from "react"
import { authClient } from "@/lib/auth-client"
import type { Task } from "@/lib/types"
import TaskList from "@/components/tasks/task-list"
import TaskEditor from "@/components/tasks/task-editor"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function TaskCenter() {
  const { data: session, error: sessionError } = authClient.useSession()
  const { data: tasksResponse, mutate } = useSWR(session?.user ? "/api/tasks" : null, fetcher)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [draftTask, setDraftTask] = useState<Task | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const tasks: Task[] = useMemo(() => tasksResponse?.data ?? [], [tasksResponse])

  useEffect(() => {
    const selected = tasks.find((t) => t.id === selectedTaskId) || null
    setDraftTask(selected ? { ...selected } : null)
  }, [selectedTaskId, tasks])

  if (!session?.user || sessionError) {
    return null
  }

  const handleCreateTask = async (title: string) => {
    setIsCreating(true)
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
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

  const handleSaveTask = async () => {
    if (!draftTask) return
    setIsSaving(true)

    try {
      const payload = {
        title: draftTask.title,
        description: draftTask.description ?? null,
        status: draftTask.status,
        priority: draftTask.priority,
        folderId: draftTask.folderId,
        dueDate: draftTask.dueDate ? new Date(draftTask.dueDate).toISOString() : null,
        startAt: draftTask.startAt ? new Date(draftTask.startAt).toISOString() : null,
        endAt: draftTask.endAt ? new Date(draftTask.endAt).toISOString() : null,
      }

      const res = await fetch(`/api/tasks/${draftTask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        console.error("Failed to update task", await res.text())
        return
      }

      const json = await res.json()
      setDraftTask(json?.data ?? draftTask)
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

  return (
    <div className="flex h-full min-h-0 bg-background">
      <div className="w-2/5 min-w-0">
        <TaskList
          tasks={tasks}
          selectedTaskId={selectedTaskId}
          onSelectTask={setSelectedTaskId}
          onCreateTask={handleCreateTask}
          isCreating={isCreating}
        />
      </div>

      <div className="flex-1">
        <TaskEditor
          task={draftTask}
          onChange={handleDraftChange}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
          isSaving={isSaving}
          isDeleting={isDeleting}
        />
      </div>
    </div>
  )
}
