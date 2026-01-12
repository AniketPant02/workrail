import { NextRequest, NextResponse } from "next/server"
import { DeleteObjectCommand } from "@aws-sdk/client-s3"
import { db } from "@/db/db"
import { taskImage } from "@/db/schema"
import { s3 } from "@/lib/s3"
import { eq } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const session = await auth.api.getSession({ headers: await headers() })
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const [image] = await db
            .select()
            .from(taskImage)
            .where(eq(taskImage.id, id))
            .limit(1)

        if (!image) {
            return NextResponse.json({ error: "Image not found" }, { status: 404 })
        }

        await s3.send(
            new DeleteObjectCommand({
                Bucket: process.env.S3_BUCKET_NAME || "images",
                Key: image.key,
            })
        )

        await db.delete(taskImage).where(eq(taskImage.id, id))

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Delete error:", error)
        return NextResponse.json({ error: "Delete failed" }, { status: 500 })
    }
}
