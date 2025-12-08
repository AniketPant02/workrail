"use client"

import type { Task } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface TaskEditorProps {
    task: Task | null
    onChange: (updates: Partial<Task>) => void
    onSave: () => void
    onDelete: () => void
    isSaving?: boolean
    isDeleting?: boolean
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
            <div className="border-b p-4">
                <h2 className="text-sm font-semibold">Task Details</h2>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
                <div className="space-y-2">
                    <label className="text-xs font-medium">Title</label>
                    <Input
                        value={task.title}
                        onChange={(e) => handleChange("title", e.target.value)}
                        placeholder="Task title"
                        className="text-sm"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-medium">Description</label>
                    <Textarea
                        value={task.description || ""}
                        onChange={(e) => handleChange("description", e.target.value || null)}
                        placeholder="Add description..."
                        className="text-sm resize-none min-h-24"
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                        <label className="text-xs font-medium">Status</label>
                        <Select
                            value={task.status}
                            onValueChange={(value) => handleChange("status", value as "todo" | "in_progress" | "done")}
                        >
                            <SelectTrigger className="text-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="todo">To Do</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="done">Done</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium">Priority</label>
                        <Select
                            value={task.priority}
                            onValueChange={(value) => handleChange("priority", value as "low" | "medium" | "high" | "urgent")}
                        >
                            <SelectTrigger className="text-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="urgent">Urgent</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-medium">Due Date</label>
                    <Input
                        type="date"
                        value={task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : ""}
                        onChange={(e) => handleChange("dueDate", e.target.value || null)}
                        className="text-sm"
                    />
                </div>
            </div>

            <div className="border-t p-4 flex gap-2 bg-card">
                <Button className="flex-1 text-xs" size="sm" onClick={onSave} disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                    variant="outline"
                    className="flex-1 text-xs bg-transparent"
                    size="sm"
                    onClick={onDelete}
                    disabled={isDeleting}
                >
                    {isDeleting ? "Deleting..." : "Delete"}
                </Button>
            </div>
        </div>
    )
}
