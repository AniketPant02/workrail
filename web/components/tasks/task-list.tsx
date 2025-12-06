"use client"

import type React from "react"

import type { Task } from "@/lib/types"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertCircle, CheckCircle2, Circle, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface TaskListProps {
    tasks: Task[]
    selectedTaskId: string | null
    onSelectTask: (taskId: string) => void
    onCreateTask: (title: string) => Promise<void> | void
    isCreating?: boolean
}

const priorityIcons = {
    low: { icon: Circle, color: "text-slate-400" },
    medium: { icon: CheckCircle2, color: "text-yellow-600" },
    high: { icon: AlertCircle, color: "text-orange-600" },
    urgent: { icon: Zap, color: "text-red-600" },
}

const formatDueDate = (date: Date) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const taskDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const diffTime = taskDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Tomorrow"
    if (diffDays === -1) return "Yesterday"
    if (diffDays < 0) return `${Math.abs(diffDays)}d ago`
    if (diffDays <= 7) return `${diffDays}d`

    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export default function TaskList({
    tasks,
    selectedTaskId,
    onSelectTask,
    onCreateTask,
    isCreating,
}: TaskListProps) {
    const [newTaskTitle, setNewTaskTitle] = useState("")

    const handleCreateTask = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && newTaskTitle.trim()) {
            onCreateTask(newTaskTitle.trim())
            setNewTaskTitle("")
        }
    }

    return (
        <div className="flex flex-col h-full border-r bg-card">
            <div className="border-b p-4">
                <h2 className="text-sm font-semibold">Tasks</h2>
                <p className="text-xs text-muted-foreground mt-1">
                    {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
                </p>
                <input
                    type="text"
                    placeholder="Add a task..."
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyDown={handleCreateTask}
                    disabled={isCreating}
                    className="mt-3 w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all disabled:opacity-50"
                />
            </div>

            <ScrollArea className="flex-1">
                <div className="p-3 space-y-2">
                    {tasks.length === 0 ? (
                        <p className="text-xs text-muted-foreground p-2 text-center">No tasks yet</p>
                    ) : (
                        tasks.map((task) => {
                            const PriorityIcon = priorityIcons[task.priority]?.icon || Circle
                            const priorityColor = priorityIcons[task.priority]?.color || "text-slate-400"
                            const parsedDueDate = task.dueDate ? new Date(task.dueDate) : null
                            const hasValidDueDate = parsedDueDate && !isNaN(parsedDueDate.getTime())
                            const dueDateLabel = hasValidDueDate ? formatDueDate(parsedDueDate) : "No due date"

                            return (
                                <button
                                    key={task.id}
                                    onClick={() => onSelectTask(task.id)}
                                    className={cn(
                                        "w-full rounded-lg border p-3 text-left transition-colors",
                                        "hover:bg-accent hover:border-accent",
                                        selectedTaskId === task.id ? "border-primary bg-primary/5" : "border-border bg-card",
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium leading-tight truncate">{task.title}</p>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <span className="text-xs text-muted-foreground">{dueDateLabel}</span>
                                            </div>
                                        </div>
                                        <PriorityIcon className={cn("h-4 w-4 shrink-0 mt-0.5", priorityColor)} />
                                    </div>
                                </button>
                            )
                        })
                    )}
                </div>
            </ScrollArea>
        </div>
    )
}
