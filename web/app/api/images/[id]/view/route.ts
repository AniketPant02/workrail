import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db/db"
import { taskImage } from "@/db/schema"
import { eq } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { s3 } from "@/lib/s3"
import { GetObjectCommand } from "@aws-sdk/client-s3"

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const session = await auth.api.getSession({ headers: await headers() })
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const [image] = await db
            .select()
            .from(taskImage)
            .where(eq(taskImage.id, id))
            .limit(1)

        if (!image) {
            return NextResponse.json({ error: "Image not found" }, { status: 404 })
        }

        const command = new GetObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME || "images",
            Key: image.key,
        })

        try {
            const s3Response = await s3.send(command)

            // @ts-ignore
            const stream = s3Response.Body as ReadableStream

            return new NextResponse(stream as any, {
                headers: {
                    "Content-Type": image.mimeType,
                    "Cache-Control": "public, max-age=31536000, immutable",
                },
            })
        } catch (s3Error) {
            console.error("S3 Fetch error:", s3Error)
            return NextResponse.json({ error: "Image retrieval failed" }, { status: 500 })
        }

    } catch (error) {
        console.error("View image error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
