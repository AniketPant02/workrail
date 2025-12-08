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
import { HourlyTimeline } from "@/components/timeline/hourly-timeline";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "workrail - a monotasking productivity app",
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <WorkrailSidebar />
      <SidebarInset>
        <div className="flex h-screen w-full flex-col overflow-hidden">
          <header className="flex h-16 shrink-0 items-center gap-3 border-b px-4">
            <SidebarTrigger className="text-muted-foreground" />
            <Separator
              orientation="vertical"
              className="h-6 bg-border"
            />
            <DashboardBreadcrumb />
          </header>
          <div className="flex flex-1 min-h-0 flex-row gap-4 lg:gap-0">
            <section className="flex-1 min-h-0 flex flex-col overflow-hidden">{children}</section>
            <aside className="border-t lg:w-80 lg:border-l lg:border-t-0 flex flex-col min-h-0 h-full overflow-hidden">
              <HourlyTimeline />
            </aside>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
