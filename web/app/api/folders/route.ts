import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAllFoldersForUser, createFolderForUser } from "@/actions/actions";

// GET all of a user's folders
export async function GET(req: NextRequest) {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const folders = await getAllFoldersForUser(session.user.id);

    return NextResponse.json({ data: folders }, { status: 200 });
}

// CREATE new folder for a user
export async function POST(req: NextRequest) {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const color = typeof body?.color === "string" ? body.color : undefined;

    if (!name) {
        return NextResponse.json(
            { error: "Name is required" },
            { status: 400 },
        );
    }

    const folder = await createFolderForUser(session.user.id, { name, color });

    return NextResponse.json({ data: folder }, { status: 201 });
}
