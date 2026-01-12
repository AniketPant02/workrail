import { NextRequest, NextResponse } from "next/server"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import { nanoid } from "nanoid"
import { db } from "@/db/db"
import { taskImage } from "@/db/schema"
import { s3 } from "@/lib/s3"
import { auth } from "@/lib/auth"

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData()
        const file = formData.get("file") as File
        const taskId = formData.get("taskId") as string

        if (!file || !taskId) {
            return NextResponse.json({ error: "Missing file or taskId" }, { status: 400 })
        }

        const session = await auth.api.getSession({ headers: req.headers });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const buffer = Buffer.from(await file.arrayBuffer())
        const ext = file.name.split(".").pop()
        const key = `uploads/${nanoid()}.${ext}`

        await s3.send(
            new PutObjectCommand({
                Bucket: process.env.S3_BUCKET_NAME || "images",
                Key: key,
                Body: buffer,
                ContentType: file.type,
            })
        )

        const bucket = process.env.S3_BUCKET_NAME || "images"
        const endpoint = process.env.S3_ENDPOINT || "http://localhost:3900"
        const url = `${endpoint}/${bucket}/${key}`

        const { user } = session
        const [image] = await db.insert(taskImage).values({
            id: nanoid(),
            key,
            url,
            name: file.name,
            size: file.size,
            mimeType: file.type,
            taskId,
            userId: user.id,
        }).returning()

        return NextResponse.json(image)
    } catch (error) {
        console.error("Upload error:", error)
        return NextResponse.json({ error: "Upload failed" }, { status: 500 })
    }
}
