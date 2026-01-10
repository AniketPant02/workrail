import { Skeleton } from "@/components/ui/skeleton"

export function SidebarFolderSkeleton() {
    return (
        <div className="flex w-full items-center gap-2 px-2 py-1.5">
            <Skeleton className="h-4 w-4 shrink-0 rounded-sm" />
            <Skeleton className="h-4 w-24 rounded-sm" />
        </div>
    )
}

export function TaskItemSkeleton() {
    return (
        <div className="relative w-full overflow-hidden rounded-lg border border-border/40 bg-card p-2.5">
            <div className="flex items-start gap-2.5">
                <Skeleton className="h-4 w-4 shrink-0 rounded-full mt-0.5" />
                <div className="flex flex-col gap-2 flex-1 w-0">
                    <Skeleton className="h-4 w-3/4 rounded-sm" />
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-3 w-16 rounded-sm" />
                        <Skeleton className="h-3 w-12 rounded-sm" />
                    </div>
                </div>
            </div>
        </div>
    )
}

export function TimelineTaskSkeleton({ height = 72 }: { height?: number }) {
    return (
        <div
            className="absolute inset-x-2 rounded-md border border-transparent bg-muted/50 animate-pulse"
            style={{ height: height - 4 }} // Subtract a bit for margin
        />
    )
}
