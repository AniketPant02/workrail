"use client"

import useSWR from "swr"

import type { Task } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FolderClosed, CircleIcon, Clock, CheckCircle, Trash2, Cloud, CloudOff, ArrowDown, ArrowRight, ArrowUp, AlertTriangle } from "lucide-react"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { cn } from "@/lib/utils"

type Folder = {
    id: string
    name: string
    color?: string | null
}

interface TaskEditorProps {
    task: Task | null
    onChange: (updates: Partial<Task>) => void
    onDelete: () => void
    isSaving?: boolean
    isDeleting?: boolean
}

const statusConfig = {
    todo: { color: "text-slate-400", bgColor: "bg-slate-50 dark:bg-slate-950", icon: CircleIcon, label: "To Do" },
    in_progress: { color: "text-blue-600", bgColor: "bg-blue-50 dark:bg-blue-950", icon: Clock, label: "In Progress" },
    done: { color: "text-green-600", bgColor: "bg-green-50 dark:bg-green-950", icon: CheckCircle, label: "Done" },
}

const priorityConfig = {
    low: { color: "text-slate-500", bgColor: "bg-slate-50 dark:bg-slate-950", icon: ArrowDown, label: "Low" },
    medium: { color: "text-blue-500", bgColor: "bg-blue-50 dark:bg-blue-950", icon: ArrowRight, label: "Medium" },
    high: { color: "text-orange-500", bgColor: "bg-orange-50 dark:bg-orange-950", icon: ArrowUp, label: "High" },
    urgent: { color: "text-red-600", bgColor: "bg-red-50 dark:bg-red-950", icon: AlertTriangle, label: "Urgent" },
}

const NO_FOLDER_VALUE = "none"

export default function TaskEditor({ task, onChange, onDelete, isSaving, isDeleting }: TaskEditorProps) {
    const { data: foldersResponse, isLoading: foldersLoading } = useSWR(task ? "/api/folders" : null, (url) =>
        fetch(url).then((res) => res.json()),
    )
    const folders: Folder[] = foldersResponse?.data ?? []

    if (!task) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-xs text-muted-foreground">Select a task to edit</p>
            </div>
        )
    }

    const handleChange = (field: keyof Task, value: string | null) => {
        onChange({
            [field]: value,
        })
    }

    const folderOptions = [...folders]
    if (task?.folderId && !folderOptions.some((f) => f.id === task.folderId)) {
        folderOptions.push({ id: task.folderId, name: "Current project" })
    }

    const selectedFolder = task.folderId ? folderOptions.find((f) => f.id === task.folderId) : null
    const folderValue = task.folderId ?? NO_FOLDER_VALUE

    return (
        <div className="flex flex-col h-full min-h-0 bg-background">
            <div className="border-b border-border/50 px-4 py-2 flex items-center justify-between h-10">
                <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Details</h2>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-2">
                        {isSaving ? (
                            <>
                                <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Saving...</span>
                            </>
                        ) : (
                            <span className="text-[10px] text-muted-foreground/50 font-medium uppercase tracking-wider animate-in fade-in duration-500">Saved</span>
                        )}
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={onDelete}
                        disabled={isDeleting}
                    >
                        {isDeleting ? <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </Button>
                </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-3">
                <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-tight">Title</label>
                    <Input
                        value={task.title}
                        onChange={(e) => handleChange("title", e.target.value)}
                        placeholder="Enter task title"
                        className="text-sm h-7 border-border/50 focus-visible:ring-offset-0"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-tight">Description</label>
                    <RichTextEditor
                        value={task.description}
                        onChange={(value) => handleChange("description", value)}
                        placeholder="Add description..."
                    />
                </div>

                <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-tight">Status</label>
                            <Select
                                value={task.status}
                                onValueChange={(value) => handleChange("status", value as "todo" | "in_progress" | "done")}
                            >
                                <SelectTrigger className="text-sm h-7 border-border/50 focus-visible:ring-offset-0">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="min-w-[140px]">
                                    {(["todo", "in_progress", "done"] as const).map((status) => {
                                        const config = statusConfig[status]
                                        const Icon = config.icon
                                        return (
                                            <SelectItem key={status} value={status}>
                                                <div className="flex items-center gap-1.5">
                                                    <Icon className={`h-3 w-3 ${config.color}`} />
                                                    <span className="text-xs">{config.label}</span>
                                                </div>
                                            </SelectItem>
                                        )
                                    })}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-tight">Priority</label>
                            <Select
                                value={task.priority}
                                onValueChange={(value) => handleChange("priority", value as "low" | "medium" | "high" | "urgent")}
                            >
                                <SelectTrigger className="text-sm h-7 border-border/50 focus-visible:ring-offset-0">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="min-w-[120px]">
                                    {(["low", "medium", "high", "urgent"] as const).map((priority) => {
                                        const config = priorityConfig[priority]
                                        const Icon = config.icon
                                        return (
                                            <SelectItem key={priority} value={priority}>
                                                <div className="flex items-center gap-1.5">
                                                    <Icon className={`h-3 w-3 ${config.color}`} />
                                                    <span className="text-xs">{config.label}</span>
                                                </div>
                                            </SelectItem>
                                        )
                                    })}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-tight">Folder</label>
                            <Select
                                value={folderValue}
                                onValueChange={(value) => handleChange("folderId", value === NO_FOLDER_VALUE ? null : value)}
                                disabled={foldersLoading}
                            >
                                <SelectTrigger className="text-sm h-7 border-border/50 focus-visible:ring-offset-0">
                                    <SelectValue placeholder={foldersLoading ? "Loading..." : "No project"}>
                                        {selectedFolder ? (
                                            <div className="flex items-center gap-1.5">
                                                <FolderClosed className={cn("h-3 w-3", selectedFolder.color || "text-muted-foreground")} />
                                                <span className="text-xs">{selectedFolder.name}</span>
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground">No project</span>
                                        )}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={NO_FOLDER_VALUE}>
                                        <div className="flex items-center gap-1.5">
                                            <CloudOff className="h-3 w-3 text-muted-foreground" />
                                            <span className="text-xs">No project</span>
                                        </div>
                                    </SelectItem>
                                    {folderOptions.map((folder) => (
                                        <SelectItem key={folder.id} value={folder.id}>
                                            <div className="flex items-center gap-1.5">
                                                <FolderClosed className={cn("h-3 w-3", folder.color || "text-muted-foreground")} />
                                                <span className="text-xs">{folder.name}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-tight">Due Date</label>
                    <Input
                        type="date"
                        value={task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : ""}
                        onChange={(e) => handleChange("dueDate", e.target.value || null)}
                        className="text-sm h-7 border-border/50 focus-visible:ring-offset-0"
                    />
                </div>
            </div>

        </div>
    )
}