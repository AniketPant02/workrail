import { ReactNode } from "react";
import type { Metadata } from "next";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { WorkrailSidebar } from "@/components/app-sidebar";
import { DashboardBreadcrumb } from "@/components/dashboard-breadcrumb";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "workrail - a monotasking productivity app",
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <WorkrailSidebar />
      <SidebarInset>
        <div className="flex min-h-screen w-full flex-col">
          <header className="flex h-16 shrink-0 items-center gap-3 border-b px-4">
            <SidebarTrigger className="text-muted-foreground" />
            <Separator
              orientation="vertical"
              className="h-6 bg-border"
            />
            <DashboardBreadcrumb />
          </header>
          <div className="flex flex-1 min-h-0 flex-col gap-4 lg:flex-row lg:gap-0">
            <section className="flex-1 min-h-0">{children}</section>
            <aside className="border-t px-4 py-6 lg:w-80 lg:border-l lg:border-t-0">
              <h2 className="text-sm font-semibold tracking-tight">
                Timeline
              </h2>
              <p className="text-sm text-muted-foreground">
                placeholder for timeline component
              </p>
            </aside>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
