import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { deleteFolderById, updateFolderById } from "@/actions/actions";

type RouteParams = {
    params: Promise<{
        folderID: string;
    }>;
};

// Delete a folder by ID
export async function DELETE(req: NextRequest, { params }: RouteParams) {
    const { folderID } = await params;

    const session = await auth.api.getSession({ headers: req.headers });

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deleted = await deleteFolderById(folderID, session.user.id);

    if (!deleted) {
        return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    return NextResponse.json({ data: deleted }, { status: 200 });
}

// Update a folder by ID
export async function PATCH(req: NextRequest, { params }: RouteParams) {
    const { folderID } = await params;

    const session = await auth.api.getSession({ headers: req.headers });

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, color } = body;

    if (!name && !color) {
        return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const input: { name?: string; color?: string } = {};
    if (name) input.name = name;
    if (color) input.color = color;

    const updated = await updateFolderById(folderID, session.user.id, input);

    if (!updated) {
        return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    return NextResponse.json({ data: updated }, { status: 200 });
}