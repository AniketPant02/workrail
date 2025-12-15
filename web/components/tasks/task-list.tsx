"use client"

import type React from "react"
import { useMemo, useState } from "react"
import useSWR from "swr"

import type { Task } from "@/lib/types"
import { useDraggable } from "@dnd-kit/core"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { ArrowUpDown, Circle, FolderClosed, Trash2, ArrowDown, ArrowRight, ArrowUp, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

interface TaskListProps {
    tasks: Task[]
    selectedTaskId: string | null
    onSelectTask: (taskId: string | null) => void // Updated to accept null
    onCreateTask: (title: string) => Promise<void> | void
    onDeleteTask: (taskId: string) => Promise<void> | void
    isCreating?: boolean
}

const priorityIcons = {
    low: { icon: ArrowDown, color: "text-slate-500" },
    medium: { icon: ArrowRight, color: "text-blue-500" },
    high: { icon: ArrowUp, color: "text-orange-500" },
    urgent: { icon: AlertTriangle, color: "text-red-600" },
}

const priorityRank: Record<Task["priority"], number> = {
    low: 1,
    medium: 2,
    high: 3,
    urgent: 4,
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

type Folder = {
    id: string
    name: string
    color?: string | null
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

const parseDueDate = (date: Task["dueDate"]) => {
    if (!date) return null
    const parsed = new Date(date)
    return isNaN(parsed.getTime()) ? null : parsed
}

interface TaskListItemProps {
    task: Task
    selected: boolean
    onSelect: (taskId: string) => void
    onDelete: (taskId: string) => void
    folder?: Folder
}

function TaskListItem({ task, selected, onSelect, onDelete, folder }: TaskListItemProps) {
    const PriorityIcon = priorityIcons[task.priority]?.icon || Circle
    const priorityColor = priorityIcons[task.priority]?.color || "text-slate-400"
    const parsedDueDate = parseDueDate(task.dueDate)
    const dueDateLabel = parsedDueDate ? formatDueDate(parsedDueDate) : null
    const showFolder = task.folderId !== null
    const folderLabel = folder?.name ?? task.folderId ?? "Folder"
    const folderColor = folder?.color ?? "text-muted-foreground"

    // Check if description exists and is not empty/just whitespace
    const hasDescription = task.description && task.description.trim().length > 0;

    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `task-${task.id}`,
        data: { type: "task", task },
    })

    return (
        <div
            ref={setNodeRef}
            style={isDragging ? { opacity: 0.5 } : undefined}
            {...attributes}
            {...listeners}
            onClick={(e) => {
                e.stopPropagation();
                onSelect(task.id);
            }}
            className={cn(
                "group relative w-full overflow-hidden rounded-lg border bg-card text-left transition-all cursor-default select-none",
                "hover:border-primary/40 hover:shadow-sm",
                selected ? "border-primary shadow-sm ring-1 ring-primary/20 bg-accent/10" : "border-border/40",
                isDragging && "ring-2 ring-primary rotate-2 scale-105 z-50 shadow-xl cursor-grabbing"
            )}
        >
            <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity z-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={(e) => {
                    e.stopPropagation()
                    onDelete(task.id)
                }}
            >
                <Trash2 className="h-3 w-3" />
            </Button>
            <div className="flex flex-col gap-1 p-2.5">
                <div className="flex items-center gap-2 min-w-0 pr-6">
                    <span className={cn("flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full", priorityColor)}>
                        <PriorityIcon className="h-3.5 w-3.5" />
                    </span>
                    <span className={cn("text-sm font-medium leading-tight truncate", selected ? "text-foreground" : "text-foreground/90")}>
                        {task.title}
                    </span>
                    {hasDescription && (
                        <div className="shrink-0 text-muted-foreground flex items-center">
                            <svg width="10" height="10" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-3 w-3"><path d="M1 2C1 1.44772 1.44772 1 2 1H13C13.5523 1 14 1.44772 14 2V13C14 13.5523 13.5523 14 13 14H2C1.44772 14 1 13.5523 1 13V2ZM2 2V13H13V2H2Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path><path d="M4 6.25C4 6.11193 4.11193 6 4.25 6H10.75C10.8881 6 11 6.11193 11 6.25V6.75C11 6.88807 10.8881 7 10.75 7H4.25C4.11193 7 4 6.88807 4 6.75V6.25ZM4 8.25C4 8.11193 4.11193 8 4.25 8H10.75C10.8881 8 11 8.11193 11 8.25V8.75C11 8.88807 10.8881 9 10.75 9H4.25C4.11193 9 4 8.88807 4 8.75V8.25ZM4.25 10C4.11193 10 4 10.1119 4 10.25V10.75C4 10.8881 4.11193 11 4.25 11H8.75C8.88807 11 9 10.8881 9 10.75V10.25C9 10.1119 8.88807 10 8.75 10H4.25Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    {showFolder && (
                        <div className="flex items-center gap-1 min-w-0 max-w-[120px]">
                            <FolderClosed className={cn("h-3 w-3 shrink-0", folderColor)} />
                            <span className="truncate opacity-80">{folderLabel}</span>
                        </div>
                    )}
                    {showFolder && dueDateLabel && <span className="opacity-40">•</span>}
                    {dueDateLabel && (
                        <div className={cn("flex items-center gap-1",
                            // Highlight urgent dates if needed, e.g.
                            // task.dueDate && new Date(task.dueDate) < new Date() ? "text-red-500" : ""
                        )}>
                            <span>{dueDateLabel}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default function TaskList({
    tasks,
    selectedTaskId,
    onSelectTask,
    onCreateTask,
    onDeleteTask,
    isCreating,
}: TaskListProps) {
    const [newTaskTitle, setNewTaskTitle] = useState("")
    const [sortBy, setSortBy] = useState<"priority" | "dueDate">("priority")
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
    const { data: foldersResponse } = useSWR("/api/folders", fetcher)
    const folders: Folder[] = foldersResponse?.data ?? []
    const folderMap = useMemo(() => new Map(folders.map((f) => [f.id, f])), [folders])
    const sortedTasks = useMemo(() => {
        const originalOrder = new Map(tasks.map((task, index) => [task.id, index]))

        return [...tasks].sort((a, b) => {
            let comparison = 0

            if (sortBy === "priority") {
                const diff = (priorityRank[a.priority] ?? 0) - (priorityRank[b.priority] ?? 0)
                comparison = sortDirection === "asc" ? diff : -diff
            } else {
                const aDate = parseDueDate(a.dueDate)
                const bDate = parseDueDate(b.dueDate)

                if (aDate && bDate) {
                    comparison =
                        sortDirection === "asc"
                            ? aDate.getTime() - bDate.getTime()
                            : bDate.getTime() - aDate.getTime()
                } else if (aDate && !bDate) {
                    comparison = -1
                } else if (!aDate && bDate) {
                    comparison = 1
                } else {
                    comparison = 0
                }
            }

            if (comparison !== 0) return comparison
            return (originalOrder.get(a.id) ?? 0) - (originalOrder.get(b.id) ?? 0)
        })
    }, [sortBy, sortDirection, tasks])

    const handleCreateTask = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && newTaskTitle.trim()) {
            onCreateTask(newTaskTitle.trim())
            setNewTaskTitle("")
        }
    }

    const handleSortChange = (value: "priority" | "dueDate") => {
        setSortBy(value)
        setSortDirection(value === "priority" ? "desc" : "asc")
    }

    const toggleDirection = () => {
        setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
    }

    const directionLabel =
        sortBy === "priority"
            ? sortDirection === "desc"
                ? "Urgent first"
                : "Low first"
            : sortDirection === "asc"
                ? "Soonest first"
                : "Latest first"

    return (
        <div className="flex h-full min-h-0 flex-col border-r border-border/70 bg-card/90">
            <div className="border-b border-border/60 px-4 py-3 sm:px-5 sm:py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-sm font-semibold">Tasks</h2>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-start gap-2 text-xs text-muted-foreground sm:justify-end">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.08em]">Sort</span>
                        <Select value={sortBy} onValueChange={(value) => handleSortChange(value as "priority" | "dueDate")}>
                            <SelectTrigger size="sm" className="h-8 shrink-0 bg-background px-2 text-xs sm:min-w-[120px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent align="end">
                                <SelectItem value="priority">
                                    <span className="text-xs">Priority</span>
                                </SelectItem>
                                <SelectItem value="dueDate">
                                    <span className="text-xs">Due date</span>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 shrink-0 px-2 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                            onClick={toggleDirection}
                            aria-label={`Toggle sort direction (${directionLabel})`}
                            title={directionLabel}
                        >
                            <ArrowUpDown className="h-4 w-4" />
                            <span className="ml-1 whitespace-nowrap">{directionLabel}</span>
                        </Button>
                    </div>
                </div>
                <div className="mt-3">
                    <Input
                        type="text"
                        placeholder="Add a task..."
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        onKeyDown={handleCreateTask}
                        disabled={isCreating}
                        className="h-9 border-border/60 bg-background text-sm"
                    />
                </div>
            </div>

            <ScrollArea className="flex-1 min-h-0">
                <div
                    className="flex min-h-full flex-col justify-start gap-2 px-3 py-3 sm:px-4 sm:py-4 cursor-default"
                    onClick={() => onSelectTask(null)}
                >
                    {tasks.length === 0 ? (
                        <div className="flex items-center justify-center py-8">
                            <p className="text-center text-xs text-muted-foreground">No tasks yet</p>
                        </div>
                    ) : (
                        sortedTasks.map((task) => {
                            const folder = task.folderId ? folderMap.get(task.folderId) : undefined
                            return (
                                <TaskListItem
                                    key={task.id}
                                    task={task}
                                    selected={selectedTaskId === task.id}
                                    onSelect={onSelectTask}
                                    onDelete={onDeleteTask}
                                    folder={folder}
                                />
                            )
                        })
                    )}
                </div>
            </ScrollArea>
        </div>
    )
}
