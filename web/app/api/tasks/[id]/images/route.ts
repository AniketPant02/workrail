import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db/db"
import { taskImage } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: taskId } = await params
        const session = await auth.api.getSession({ headers: await headers() })
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const images = await db
            .select()
            .from(taskImage)
            .where(eq(taskImage.taskId, taskId))
            .orderBy(desc(taskImage.createdAt))

        const commentsWithProxyUrl = images.map(img => ({
            ...img,
            url: `/api/images/${img.id}/view`
        }))

        return NextResponse.json(commentsWithProxyUrl)
    } catch (error) {
        console.error("Fetch images error:", error)
        return NextResponse.json({ error: "Failed to fetch images" }, { status: 500 })
    }
}
