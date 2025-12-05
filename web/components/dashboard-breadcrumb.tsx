"use client";

import { usePathname } from "next/navigation";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
} from "@/components/ui/breadcrumb";

function getDashboardLabel(pathname: string | null): string {
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

    // Handle /dashboard/{folderName}
    if (clean.startsWith("/dashboard/")) {
        const segments = clean.split("/");
        const slug = segments[segments.length - 1];

        // decodeURIComponent because you used encodeURI / encodeURIComponent
        try {
            return decodeURIComponent(slug);
        } catch {
            // if decoding fails for some reason, just show the raw slug
            return slug;
        }
    }

    // Fallback
    return "Dashboard";
}

export function DashboardBreadcrumb() {
    const pathname = usePathname();
    const label = getDashboardLabel(pathname);

    return (
        <Breadcrumb className="flex-1">
            <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbPage>{label}</BreadcrumbPage>
                </BreadcrumbItem>
            </BreadcrumbList>
        </Breadcrumb>
    );
}
