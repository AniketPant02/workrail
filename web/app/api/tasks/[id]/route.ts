import { NextRequest, NextResponse } from "next/server";
import {
    getTaskById,
    updateTaskById,
    deleteTaskById,
    TaskPriority,
    TaskStatus,
} from "@/actions/actions";
import { auth } from "@/lib/auth";

function toDate(value: unknown): Date | null {
    if (!value) return null;
    const d = new Date(value as string);
    return isNaN(d.getTime()) ? null : d;
}

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

export async function GET(req: NextRequest, { params }: RouteContext) {
    const { id } = await params;
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const task = await getTaskById(id, session.user.id);

    if (!task) {
        return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }

    return NextResponse.json({ data: task }, { status: 200 });
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
    const { id } = await params;
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);

    if (body === null || typeof body !== "object") {
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const updates: {
        title?: string;
        description?: string | null;
        status?: TaskStatus;
        priority?: TaskPriority;
        dueDate?: Date | null;
        startAt?: Date | null;
        endAt?: Date | null;
        folderId?: string | null;
    } = {};

    if ("title" in body) {
        if (typeof body.title !== "string" || !body.title.trim()) {
            return NextResponse.json({ error: "Title must be a non-empty string" }, { status: 400 });
        }
        updates.title = body.title.trim();
    }

    if ("description" in body) {
        if (typeof body.description !== "string" && body.description !== null) {
            return NextResponse.json({ error: "Description must be a string or null" }, { status: 400 });
        }
        updates.description = body.description ?? null;
    }

    if ("status" in body) {
        if (!(["todo", "in_progress", "done"] as TaskStatus[]).includes(body.status)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }
        updates.status = body.status as TaskStatus;
    }

    if ("priority" in body) {
        if (!(["low", "medium", "high", "urgent"] as TaskPriority[]).includes(body.priority)) {
            return NextResponse.json({ error: "Invalid priority" }, { status: 400 });
        }
        updates.priority = body.priority as TaskPriority;
    }

    if ("folderId" in body) {
        if (typeof body.folderId === "string" && body.folderId.length > 0) {
            updates.folderId = body.folderId;
        } else if (body.folderId === null) {
            updates.folderId = null;
        } else {
            return NextResponse.json({ error: "Invalid folderId" }, { status: 400 });
        }
    }

    if ("dueDate" in body) {
        updates.dueDate = toDate(body.dueDate);
    }
    if ("startAt" in body) {
        updates.startAt = toDate(body.startAt);
    }
    if ("endAt" in body) {
        updates.endAt = toDate(body.endAt);
    }

    const task = await updateTaskById(id, session.user.id, updates);

    if (!task) {
        return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }

    return NextResponse.json({ data: task }, { status: 200 });
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
    const { id } = await params;
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const task = await deleteTaskById(id, session.user.id);

    if (!task) {
        return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }

    return NextResponse.json({ data: task }, { status: 200 });
}
