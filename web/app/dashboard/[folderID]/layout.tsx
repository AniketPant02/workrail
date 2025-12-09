import type { Metadata } from "next";
import { headers } from "next/headers";
import type { ReactNode } from "react";

import { getFolderById } from "@/actions/actions";
import { auth } from "@/lib/auth";

type FolderParams = Promise<{
    folderID: string;
}>;

type FolderLayoutProps = {
    children: ReactNode;
    params: FolderParams;
};

type FolderMetadataProps = {
    params: FolderParams;
};

export async function generateMetadata(
    { params }: FolderMetadataProps
): Promise<Metadata> {
    const { folderID } = await params;

    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
        return { title: "Dashboard | workrail" };
    }

    const folder = await getFolderById(folderID, session.user.id);

    return {
        title: folder?.name ? `${folder.name} | workrail` : "Dashboard | workrail",
    };
}

export default async function FolderLayout({ children, params }: FolderLayoutProps) {
    return <>{children}</>;
}