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
import { AlertCircle, ArrowUpDown, CheckCircle2, Circle, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

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
    folder?: Folder
}

function TaskListItem({ task, selected, onSelect, folder }: TaskListItemProps) {
    const PriorityIcon = priorityIcons[task.priority]?.icon || Circle
    const priorityColor = priorityIcons[task.priority]?.color || "text-slate-400"
    const parsedDueDate = parseDueDate(task.dueDate)
    const dueDateLabel = parsedDueDate ? formatDueDate(parsedDueDate) : "No due date"
    const showFolder = task.folderId !== null
    const folderLabel = folder?.name ?? task.folderId ?? "Folder"
    const folderColor = folder?.color ?? "text-muted-foreground"
    const shouldShowTitleTooltip = task.title.trim().length > 32

    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `task-${task.id}`,
        data: { type: "task", task },
    })

    return (
        <button
            type="button"
            ref={setNodeRef}
            style={isDragging ? { opacity: 0.85 } : undefined}
            onClick={() => onSelect(task.id)}
            aria-pressed={selected}
            className={cn(
                "group relative w-full overflow-hidden rounded-xl border bg-card/80 text-left shadow-xs transition-all",
                "hover:border-primary/40 hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1",
                selected ? "border-primary shadow-sm ring-1 ring-primary/20" : "border-border/70",
            )}
        >
            <div className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 sm:gap-4">
                <div className="min-w-0 space-y-1.5">
                    <p className="line-clamp-2 text-sm font-medium leading-tight text-foreground wrap-break-word">{task.title}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {showFolder && (
                            <Badge variant="outline" className={cn("max-w-[180px] truncate bg-muted/60 text-[11px] font-medium transition-colors", folderColor)}>
                                {folderLabel}
                            </Badge>
                        )}
                        <Badge variant="secondary" className="text-[11px] font-medium">
                            {dueDateLabel}
                        </Badge>
                    </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-muted/60 text-muted-foreground">
                        <PriorityIcon className={cn("h-4 w-4 shrink-0", priorityColor)} />
                    </span>
                    <div
                        className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background/70 text-muted-foreground shadow-xs transition hover:bg-muted/70 cursor-grab active:cursor-grabbing"
                        {...attributes}
                        {...listeners}
                        onClick={(e) => e.stopPropagation()}
                        title="Drag to timeline"
                        aria-label="Drag to timeline"
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="8" cy="6" r="1" />
                            <circle cx="8" cy="12" r="1" />
                            <circle cx="8" cy="18" r="1" />
                            <circle cx="16" cy="6" r="1" />
                            <circle cx="16" cy="12" r="1" />
                            <circle cx="16" cy="18" r="1" />
                        </svg>
                    </div>
                </div>
            </div>
        </button>
    )
}

export default function TaskList({
    tasks,
    selectedTaskId,
    onSelectTask,
    onCreateTask,
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
                <div className="flex min-h-full flex-col justify-center gap-3 px-3 py-3 sm:px-4 sm:py-4">
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
