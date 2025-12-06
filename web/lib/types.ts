export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface Task {
    id: string;
    title: string;
    description: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate: string | Date | null;
    startAt: string | Date | null;
    endAt: string | Date | null;
    folderId: string | null;
    userId: string;
    createdAt: string | Date;
    updatedAt: string | Date;
}
