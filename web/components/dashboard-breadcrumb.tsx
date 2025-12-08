"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import useSWR from "swr";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
} from "@/components/ui/breadcrumb";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type Folder = {
    id: string;
    name: string;
};

function getDashboardLabel(pathname: string | null, folderName?: string, foldersLoading?: boolean): string {
    if (!pathname) return "Dashboard";

    // Strip query/hash and trailing slash
    let clean = pathname.split("?")[0].split("#")[0];
    if (clean.endsWith("/") && clean !== "/") {
        clean = clean.slice(0, -1);
    }

    if (clean === "/dashboard") {
        return "Dashboard";
    }

    if (clean === "/dashboard/due-soon") {
        return "Due soon";
    }

    // Handle /dashboard/{folderID}
    if (clean.startsWith("/dashboard/")) {
        if (foldersLoading) return "Loading…";
        if (folderName) return folderName;
        return "Folder";
    }

    // Fallback
    return "Dashboard";
}

export function DashboardBreadcrumb() {
    const pathname = usePathname();

    // Attempt to read folderId from the path: /dashboard/[folderID]
    const { folderId, cleanPath } = useMemo(() => {
        if (!pathname) return { folderId: null as string | null, cleanPath: null as string | null };

        // Mirror the cleaning logic in getDashboardLabel
        let clean = pathname.split("?")[0].split("#")[0];
        if (clean.endsWith("/") && clean !== "/") {
            clean = clean.slice(0, -1);
        }

        // Exclude known non-folder dashboard paths
        if (clean === "/dashboard" || clean === "/dashboard/due-soon") {
            return { folderId: null, cleanPath: clean };
        }

        if (clean.startsWith("/dashboard/")) {
            const slug = clean.split("/")[2];
            try {
                return { folderId: decodeURIComponent(slug), cleanPath: clean };
            } catch {
                return { folderId: slug, cleanPath: clean };
            }
        }

        return { folderId: null, cleanPath: clean };
    }, [pathname]);

    const { data: foldersResponse, isLoading: foldersLoading } = useSWR(folderId ? "/api/folders" : null, fetcher);
    const folders: Folder[] = foldersResponse?.data ?? [];

    const folderName = useMemo(() => {
        if (!folderId) return undefined;
        return folders.find((f) => f.id === folderId)?.name;
    }, [folderId, folders]);

    const label = getDashboardLabel(cleanPath, folderName, foldersLoading);

    return (
        <Breadcrumb className="flex-1 text-lg font-semibold">
            <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbPage>{label}</BreadcrumbPage>
                </BreadcrumbItem>
            </BreadcrumbList>
        </Breadcrumb>
    );
}
