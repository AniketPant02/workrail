import { S3Client } from "@aws-sdk/client-s3"

export const s3 = new S3Client({
    region: process.env.S3_REGION || "garage",
    endpoint: process.env.S3_ENDPOINT || "http://localhost:3900",
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
    },
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
})
