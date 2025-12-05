"use client";

import { useCallback } from "react";
import { ChevronsUpDown, LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar";

type NavUserProps = {
    user: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
    };
    onSignOut: () => Promise<void>;
    isSigningOut?: boolean;
};

export function NavUser({ user, onSignOut, isSigningOut }: NavUserProps) {
    const { isMobile } = useSidebar();
    const { resolvedTheme, setTheme } = useTheme();
    const displayName = user.name || user.email || "User";
    const email = user.email || "user@example.com";
    const avatarFallback = displayName
        .split(" ")
        .map((chunk) => chunk.trim().charAt(0))
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase();
    const toggleTheme = useCallback(() => {
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
    }, [resolvedTheme, setTheme]);
    const themeIcon = resolvedTheme === "dark" ? <Sun className="mr-2 size-4" /> : <Moon className="mr-2 size-4" />;
    const themeLabel = resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode";

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <Avatar className="h-8 w-8 rounded-lg">
                                <AvatarImage src={user.image ?? undefined} alt={displayName} />
                                <AvatarFallback className="rounded-lg">
                                    {avatarFallback}
                                </AvatarFallback>
                            </Avatar>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-medium">
                                    {displayName}
                                </span>
                                <span className="truncate text-xs text-muted-foreground">
                                    {email}
                                </span>
                            </div>
                            <ChevronsUpDown className="ml-auto size-4 opacity-50" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                        side={isMobile ? "bottom" : "right"}
                        align="end"
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="p-0 font-normal">
                            <div className="flex items-center gap-3 px-2 py-2 text-left text-sm">
                                <Avatar className="h-9 w-9 rounded-lg">
                                    <AvatarImage src={user.image ?? undefined} alt={displayName} />
                                    <AvatarFallback className="rounded-lg">
                                        {avatarFallback}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-medium">
                                        {displayName}
                                    </span>
                                    <span className="truncate text-xs text-muted-foreground">
                                        {email}
                                    </span>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={toggleTheme} className="text-sm font-medium">
                            {themeIcon}
                            {themeLabel}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={onSignOut}
                            disabled={isSigningOut}
                            className="text-sm font-medium"
                        >
                            <LogOut className="mr-2 size-4" />
                            {isSigningOut ? "Signing out…" : "Sign out"}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
