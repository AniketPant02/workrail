import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
    getAllTasksForUser,
    createTaskForUser,
    TaskStatus,
    TaskPriority,
    getTasksByFolder,
    getTasksDueSoonForUser,
} from "@/actions/actions";

function toDate(value: unknown): Date | null {
    if (!value) return null;
    const d = new Date(value as string);
    return isNaN(d.getTime()) ? null : d;
}

// GET all of a user's tasks
export async function GET(req: NextRequest) {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const folderId =
        req.nextUrl.searchParams.get("folderId")?.trim() || null;
    const dueSoonParam = req.nextUrl.searchParams.get("dueSoon");
    const isDueSoon =
        dueSoonParam === "true" ||
        dueSoonParam === "1" ||
        dueSoonParam === "yes";

    const statusParam = req.nextUrl.searchParams.get("status") as TaskStatus | null;
    const excludeStatusParam = req.nextUrl.searchParams.getAll("excludeStatus") as TaskStatus[];

    const tasks = isDueSoon
        ? await getTasksDueSoonForUser(session.user.id, {
            folderId: folderId ?? undefined,
        })
        : folderId
            ? await getTasksByFolder(folderId, session.user.id)
            : await getAllTasksForUser(session.user.id, {
                status: statusParam ?? undefined,
                excludeStatus: excludeStatusParam.length > 0 ? excludeStatusParam : undefined,
            });

    return NextResponse.json({ data: tasks }, { status: 200 });
}

// CREATE new task for a user
export async function POST(req: NextRequest) {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);

    // title (required)
    if (typeof body?.title !== "string" || !body.title.trim()) {
        return NextResponse.json(
            { error: "Title is required" },
            { status: 400 },
        );
    }

    const title = body.title.trim();

    // optional fields
    const description =
        typeof body.description === "string" ? body.description : null;

    const status =
        body.status && (["todo", "in_progress", "done"] as TaskStatus[]).includes(body.status)
            ? (body.status as TaskStatus)
            : undefined;

    const priority =
        body.priority &&
            (["low", "medium", "high", "urgent"] as TaskPriority[]).includes(
                body.priority,
            )
            ? (body.priority as TaskPriority)
            : undefined;

    const folderId =
        typeof body.folderId === "string" && body.folderId.length > 0
            ? body.folderId
            : null;

    const dueDate = toDate(body.dueDate);
    const startAt = toDate(body.startAt);
    const endAt = toDate(body.endAt);

    const task = await createTaskForUser(session.user.id, {
        title,
        description,
        status,
        priority,
        folderId,
        dueDate,
        startAt,
        endAt,
    });

    return NextResponse.json({ data: task }, { status: 201 });
}
