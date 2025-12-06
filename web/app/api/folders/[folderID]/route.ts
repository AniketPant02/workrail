import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { deleteFolderById } from "@/actions/actions";

type RouteParams = {
    params: {
        folderID: string;
    };
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