"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/db/db";
import {
    folder,
    task,
    taskStatusEnum,
    taskPriorityEnum,
} from "@/db/schema";
import { nanoid } from "nanoid"; // for generating UUIDs

// types based on enums
export type TaskStatus = (typeof taskStatusEnum.enumValues)[number];
export type TaskPriority = (typeof taskPriorityEnum.enumValues)[number];

export async function getAllFoldersForUser(userId: string) {
    return db
        .select()
        .from(folder)
        .where(eq(folder.userId, userId))
        .orderBy(folder.createdAt);
}

export async function getFolderById(folderId: string, userId: string) {
    const [row] = await db
        .select()
        .from(folder)
        .where(and(eq(folder.id, folderId), eq(folder.userId, userId)));

    return row ?? null;
}

export async function createFolderForUser(
    userId: string,
    input: {
        name: string;
    },
) {
    const [row] = await db
        .insert(folder)
        .values({
            id: nanoid(),
            name: input.name,
            userId,
        })
        .returning();

    return row;
}

export async function updateFolderById(
    folderId: string,
    userId: string,
    input: {
        name?: string;
    },
) {
    const updateValues: Partial<typeof folder.$inferInsert> = {};

    if (input.name !== undefined) {
        updateValues.name = input.name;
    }

    const [row] = await db
        .update(folder)
        .set(updateValues)
        .where(and(eq(folder.id, folderId), eq(folder.userId, userId)))
        .returning();

    return row ?? null;
}

export async function deleteFolderById(folderId: string, userId: string) {
    const [row] = await db
        .delete(folder)
        .where(and(eq(folder.id, folderId), eq(folder.userId, userId)))
        .returning();

    return row ?? null;
}

export async function getAllTasksForUser(userId: string) {
    return db
        .select()
        .from(task)
        .where(eq(task.userId, userId))
        .orderBy(task.createdAt);
}

export async function getTaskById(taskId: string, userId: string) {
    const [row] = await db
        .select()
        .from(task)
        .where(and(eq(task.id, taskId), eq(task.userId, userId)));

    return row ?? null;
}

export async function getTasksByFolder(folderId: string, userId: string) {
    return db
        .select()
        .from(task)
        .where(and(eq(task.folderId, folderId), eq(task.userId, userId)))
        .orderBy(task.createdAt);
}

export async function createTaskForUser(
    userId: string,
    input: {
        title: string;
        description?: string | null;
        status?: TaskStatus;
        priority?: TaskPriority;
        dueDate?: Date | null;
        folderId?: string | null;
        startAt?: Date | null;
        endAt?: Date | null;
    },
) {
    const [row] = await db
        .insert(task)
        .values({
            id: nanoid(),
            title: input.title,
            description: input.description ?? null,
            status: input.status ?? "todo",
            priority: input.priority ?? "medium",
            dueDate: input.dueDate ?? null,
            folderId: input.folderId ?? null,
            startAt: input.startAt ?? null,
            endAt: input.endAt ?? null,
            userId,
        })
        .returning();

    return row;
}

export async function updateTaskById(
    taskId: string,
    userId: string,
    input: {
        title?: string;
        description?: string | null;
        status?: TaskStatus;
        priority?: TaskPriority;
        dueDate?: Date | null;
        folderId?: string | null;
        startAt?: Date | null;
        endAt?: Date | null;
    },
) {
    const updateValues: Partial<typeof task.$inferInsert> = {};

    if (input.title !== undefined) {
        updateValues.title = input.title;
    }
    if (input.description !== undefined) {
        updateValues.description = input.description;
    }
    if (input.status !== undefined) {
        updateValues.status = input.status;
    }
    if (input.priority !== undefined) {
        updateValues.priority = input.priority;
    }
    if (input.dueDate !== undefined) {
        updateValues.dueDate = input.dueDate;
    }
    if (input.folderId !== undefined) {
        updateValues.folderId = input.folderId;
    }
    if (input.startAt !== undefined) {
        updateValues.startAt = input.startAt;
    }
    if (input.endAt !== undefined) {
        updateValues.endAt = input.endAt;
    }

    const [row] = await db
        .update(task)
        .set(updateValues)
        .where(and(eq(task.id, taskId), eq(task.userId, userId)))
        .returning();

    return row ?? null;
}

export async function deleteTaskById(taskId: string, userId: string) {
    const [row] = await db
        .delete(task)
        .where(and(eq(task.id, taskId), eq(task.userId, userId)))
        .returning();

    return row ?? null;
}