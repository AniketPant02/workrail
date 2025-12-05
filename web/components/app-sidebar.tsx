"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import {
  CalendarClock,
  FolderClosed,
  LayoutDashboard,
} from "lucide-react";

import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";

const navSections = [
  {
    label: "Focus",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "Due soon",
        href: "/dashboard/due-soon",
        icon: CalendarClock,
      },
    ],
  },
  {
    label: "Folders",
    items: []
  }
];

export function WorkrailSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { data: session } = authClient.useSession();

  const isActive = useCallback(
    (href: string) => {
      if (href === "/dashboard") {
        return pathname === "/dashboard";
      }

      return pathname?.startsWith(href);
    },
    [pathname]
  );

  const handleSignOut = useCallback(async () => {
    setIsSigningOut(true);
    try {
      return await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            router.push("/sign-in");
          },
        },
      });
    } finally {
      setIsSigningOut(false);
    }
  }, [router]);

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="px-2 py-4">
          <div className="text-xl font-bold tracking-tight text-foreground">
            workrail
          </div>
          <p className="text-xs text-muted-foreground">
            Daily control center
          </p>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {navSections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel>
              {section.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      isActive={isActive(item.href)}
                    >
                      <Link
                        href={item.href}
                        className="flex w-full items-center gap-2"
                      >
                        <item.icon className="size-4 shrink-0" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: session?.user?.name,
            email: session?.user?.email,
            image: session?.user?.image,
          }}
          onSignOut={handleSignOut}
          isSigningOut={isSigningOut}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
