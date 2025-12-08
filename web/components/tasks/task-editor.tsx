"use client"

import type { Task } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Zap, Circle, CheckCircle2 } from "lucide-react"
import { RichTextEditor } from "@/components/ui/rich-text-editor"

interface TaskEditorProps {
    task: Task | null
    onChange: (updates: Partial<Task>) => void
    onSave: () => void
    onDelete: () => void
    isSaving?: boolean
    isDeleting?: boolean
}

const priorityConfig = {
    low: { color: "text-slate-400", bgColor: "bg-slate-50 dark:bg-slate-950", icon: Circle, label: "Low" },
    medium: { color: "text-yellow-600", bgColor: "bg-amber-50 dark:bg-amber-950", icon: CheckCircle2, label: "Medium" },
    high: { color: "text-orange-600", bgColor: "bg-orange-50 dark:bg-orange-950", icon: AlertCircle, label: "High" },
    urgent: { color: "text-red-600", bgColor: "bg-red-50 dark:bg-red-950", icon: Zap, label: "Urgent" },
}

export default function TaskEditor({ task, onChange, onSave, onDelete, isSaving, isDeleting }: TaskEditorProps) {
    if (!task) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-sm text-muted-foreground">Select a task to edit</p>
            </div>
        )
    }

    const handleChange = (field: keyof Task, value: string | null) => {
        onChange({
            [field]: value,
        })
    }

    return (
        <div className="flex flex-col h-full min-h-0">
            <div className="border-b px-4 py-2.5">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Task Details</h2>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-3">
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Title</label>
                    <Input
                        value={task.title}
                        onChange={(e) => handleChange("title", e.target.value)}
                        placeholder="Task title"
                        className="text-sm h-8"
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Description</label>
                    <RichTextEditor
                        value={task.description}
                        onChange={(value) => handleChange("description", value)}
                        placeholder="Add description..."
                    />
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Status</label>
                        <Select
                            value={task.status}
                            onValueChange={(value) => handleChange("status", value as "todo" | "in_progress" | "done")}
                        >
                            <SelectTrigger className="text-sm h-8">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="todo">To Do</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="done">Done</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Priority</label>
                        <Select
                            value={task.priority}
                            onValueChange={(value) => handleChange("priority", value as "low" | "medium" | "high" | "urgent")}
                        >
                            <SelectTrigger className="text-sm h-8">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {(["low", "medium", "high", "urgent"] as const).map((priority) => {
                                    const config = priorityConfig[priority]
                                    const Icon = config.icon
                                    return (
                                        <SelectItem key={priority} value={priority}>
                                            <div className="flex items-center gap-2">
                                                <Icon className={`h-3.5 w-3.5 ${config.color}`} />
                                                <span>{config.label}</span>
                                            </div>
                                        </SelectItem>
                                    )
                                })}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Due Date</label>
                    <Input
                        type="date"
                        value={task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : ""}
                        onChange={(e) => handleChange("dueDate", e.target.value || null)}
                        className="text-sm h-8"
                    />
                </div>
            </div>

            <div className="border-t px-4 py-2.5 flex gap-2 bg-card">
                <Button
                    variant="outline"
                    className="flex-1 text-xs h-8 bg-transparent"
                    onClick={onDelete}
                    disabled={isDeleting}
                >
                    {isDeleting ? "Deleting..." : "Delete"}
                </Button>
                <Button className="flex-1 text-xs h-8" onClick={onSave} disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save"}
                </Button>
            </div>
        </div>
    )
}
