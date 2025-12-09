import type { Metadata } from "next"
import { headers } from "next/headers"
import { ReactNode } from "react"

import { getFolderById } from "@/actions/actions"
import { auth } from "@/lib/auth"

type FolderLayoutProps = {
    children: ReactNode
    params: {
        folderID: string
    }
}

type FolderMetadataProps = {
    params: {
        folderID: string
    }
}

export async function generateMetadata({ params }: FolderMetadataProps): Promise<Metadata> {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
        return { title: "Dashboard" }
    }

    const folder = await getFolderById(params.folderID, session.user.id)
    return { title: folder?.name ?? "Dashboard" }
}

export default function FolderLayout({ children }: FolderLayoutProps) {
    return <>{children}</>
}
