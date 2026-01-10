"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import {
  CalendarClock,
  FolderClosed,
  LayoutDashboard,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2, // NEW
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
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { SidebarFolderSkeleton } from "@/components/ui/skeletons";
import { authClient } from "@/lib/auth-client";
import useSWR from "swr";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  // AlertDialogTrigger export was present in original file
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";
import { useDroppable } from "@dnd-kit/core";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type Folder = {
  id: string;
  name: string;
  color?: string | null;
};

const folderColors = [
  { name: "Default", value: "text-muted-foreground", bg: "bg-muted/50" },
  { name: "Red", value: "text-red-500", bg: "bg-red-500/10" },
  { name: "Orange", value: "text-orange-500", bg: "bg-orange-500/10" },
  { name: "Amber", value: "text-amber-500", bg: "bg-amber-500/10" },
  { name: "Yellow", value: "text-yellow-500", bg: "bg-yellow-500/10" },
  { name: "Lime", value: "text-lime-500", bg: "bg-lime-500/10" },
  { name: "Green", value: "text-green-500", bg: "bg-green-500/10" },
  { name: "Emerald", value: "text-emerald-500", bg: "bg-emerald-500/10" },
  { name: "Teal", value: "text-teal-500", bg: "bg-teal-500/10" },
  { name: "Cyan", value: "text-cyan-500", bg: "bg-cyan-500/10" },
  { name: "Sky", value: "text-sky-500", bg: "bg-sky-500/10" },
  { name: "Blue", value: "text-blue-500", bg: "bg-blue-500/10" },
  { name: "Indigo", value: "text-indigo-500", bg: "bg-indigo-500/10" },
  { name: "Violet", value: "text-violet-500", bg: "bg-violet-500/10" },
  { name: "Purple", value: "text-purple-500", bg: "bg-purple-500/10" },
  { name: "Fuchsia", value: "text-fuchsia-500", bg: "bg-fuchsia-500/10" },
  { name: "Pink", value: "text-pink-500", bg: "bg-pink-500/10" },
  { name: "Rose", value: "text-rose-500", bg: "bg-rose-500/10" },
];

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
      {
        title: "Completed",
        href: "/dashboard/completed",
        icon: CheckCircle2,
      },
    ],
  },
];

export function WorkrailSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { data: session } = authClient.useSession();

  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const {
    data: foldersResponse,
    error: foldersError,
    isLoading: foldersLoading,
    mutate: mutateFolders,
  } = useSWR("/api/folders", fetcher);

  const folders: Folder[] = foldersResponse?.data ?? [];

  const isActive = useCallback(
    (href: string) => {
      if (href === "/dashboard") {
        return pathname === "/dashboard";
      }

      return pathname?.startsWith(href);
    },
    [pathname],
  );

  const handleSignOut = useCallback(async () => {
    setIsSigningOut(true);
    try {
      await authClient.signOut({
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

  const handleStartAddFolder = useCallback(() => {
    setIsAddingFolder(true);
    setNewFolderName("");
  }, []);

  const handleCancelAddFolder = useCallback(() => {
    setIsAddingFolder(false);
    setNewFolderName("");
  }, []);

  const handleCreateFolder = useCallback(async () => {
    const name = newFolderName.trim();
    if (!name) return;

    const res = await fetch("/api/folders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name }),
    });

    if (!res.ok) return;

    const json = await res.json();
    const created: Folder = json.data;

    setNewFolderName("");
    setIsAddingFolder(false);
    mutateFolders();

    router.push(`/dashboard/${created.id}`);
  }, [newFolderName, mutateFolders, router]);

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
            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
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
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between">
            <span>Folders</span>
            <button
              type="button"
              onClick={handleStartAddFolder}
              className="inline-flex items-center justify-center rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label="Add folder"
            >
              <Plus className="h-4 w-4" />
            </button>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {isAddingFolder && (
                <SidebarMenuItem>
                  <div className="flex h-8 w-full items-center gap-2 rounded-md bg-accent/40 px-2">
                    <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted/50">
                      <FolderClosed className="size-3.5 shrink-0" />
                    </div>
                    <input
                      autoFocus
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleCreateFolder();
                        } else if (e.key === "Escape") {
                          e.preventDefault();
                          handleCancelAddFolder();
                        }
                      }}
                      placeholder="New folder..."
                      className="w-full bg-transparent text-sm outline-none"
                    />
                  </div>
                </SidebarMenuItem>
              )}

              {foldersError && (
                <div className="px-2 text-xs text-destructive">
                  Failed to load folders
                </div>
              )}
              {foldersLoading && !foldersError && (
                <div className="flex flex-col gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <SidebarFolderSkeleton key={i} />
                  ))}
                </div>
              )}

              {!foldersLoading &&
                !foldersError &&
                folders.map((folder) => {
                  const href = `/dashboard/${folder.id}`;
                  return (
                    <FolderRow
                      key={folder.id}
                      folder={folder}
                      href={href}
                      isActive={isActive(href)}
                      onDeleted={async () => {
                        await mutateFolders();
                        // if we're currently viewing this folder, send user back to dashboard
                        if (pathname === href) {
                          router.push("/dashboard");
                        }
                      }}
                      onRenamed={async () => {
                        await mutateFolders();
                      }}
                    />
                  );
                })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
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

type FolderRowProps = {
  folder: Folder;
  href: string;
  isActive: boolean;
  onDeleted: () => void | Promise<void>;
  onRenamed: () => void | Promise<void>;
};

function FolderRow({ folder, href, isActive, onDeleted, onRenamed }: FolderRowProps) {
  const [open, setOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(folder.name);
  const inputRef = useRef<HTMLInputElement>(null);

  const { isOver, setNodeRef, active } = useDroppable({
    id: `folder-${folder.id}`,
    data: { type: "folder", folderId: folder.id },
  });

  // Only highlight when a task is being dragged over this folder
  const isDragOverWithTask = isOver && active?.data?.current?.type === "task";

  useEffect(() => {
    if (isRenaming) {
      inputRef.current?.focus();
    }
  }, [isRenaming]);

  // Sync renameValue with props if not renaming
  useEffect(() => {
    if (!isRenaming) {
      setRenameValue(folder.name);
    }
  }, [folder.name, isRenaming]);

  const handleConfirmRename = useCallback(async () => {
    const name = renameValue.trim();
    if (!name || name === folder.name) {
      setIsRenaming(false);
      setRenameValue(folder.name);
      return;
    }

    const res = await fetch(`/api/folders/${folder.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    if (res.ok) {
      await onRenamed();
    }

    setIsRenaming(false);
  }, [folder.id, folder.name, renameValue, onRenamed]);

  const handleColorChange = useCallback(async (color: string) => {
    const colorToSave = color === "text-muted-foreground" ? null : color;

    const res = await fetch(`/api/folders/${folder.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ color: colorToSave }),
    });

    if (res.ok) {
      await onRenamed();
    }
  }, [folder.id, onRenamed]);

  const handleConfirmDelete = useCallback(async () => {
    const res = await fetch(`/api/folders/${folder.id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      await onDeleted();
    }

    setOpen(false);
  }, [folder.id, onDeleted]);

  if (isRenaming) {
    return (
      <SidebarMenuItem>
        <div className="flex h-8 w-full items-center gap-2 rounded-md bg-accent/40 px-2">
          <div className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-md transition-colors",
            folder.color
              ? folder.color.replace('text-', 'bg-').replace('500', '500/15')
              : "bg-muted/50"
          )}>
            <FolderClosed className={cn("size-3.5 shrink-0 transition-colors", folder.color || "text-muted-foreground")} />
          </div>
          <input
            ref={inputRef}
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleConfirmRename();
              } else if (e.key === "Escape") {
                e.preventDefault();
                setIsRenaming(false);
                setRenameValue(folder.name);
              }
            }}
            onBlur={() => {
              handleConfirmRename();
            }}
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
      </SidebarMenuItem>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <SidebarMenuItem ref={setNodeRef} className={cn(
        "transition-all duration-150",
        isDragOverWithTask && "ring-2 ring-primary ring-offset-1 ring-offset-background rounded-md bg-accent/30"
      )}>
        <SidebarMenuButton asChild tooltip={folder.name} isActive={isActive}>
          <div className="flex w-full items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex size-7 -ml-1.5 -mr-1 items-center justify-center rounded-lg outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-sidebar-accent transition-colors">
                  <div className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-md transition-all duration-200 group-hover:scale-110",
                    folder.color
                      ? folder.color.replace('text-', 'bg-').replace('500', '500/15')
                      : "bg-muted/50"
                  )}>
                    <FolderClosed className={cn("size-3.5 transition-colors", folder.color || "text-muted-foreground")} />
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-60 p-2">
                <div className="grid grid-cols-6 gap-1.5">
                  {folderColors.map((color) => (
                    <DropdownMenuItem
                      key={color.value}
                      className="p-0 focus:bg-transparent"
                      onClick={(e) => {
                        e.preventDefault();
                        handleColorChange(color.value);
                      }}
                    >
                      <div
                        className={cn(
                          "group flex size-8 items-center justify-center rounded-lg border transition-all hover:scale-110 cursor-pointer",
                          color.value === "text-muted-foreground" ? "bg-muted border-border" : cn("border-transparent", color.bg),
                        )}
                        title={color.name}
                      >
                        <FolderClosed className={cn("size-4 transition-colors", color.value)} />
                      </div>
                    </DropdownMenuItem>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link href={href} className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden outline-none">
              <span className="truncate">{folder.name}</span>
            </Link>
          </div>
        </SidebarMenuButton>

        {/* Edit Action */}
        <SidebarMenuAction
          showOnHover
          aria-label={`Rename folder ${folder.name}`}
          className="right-7 hover:bg-transparent hover:text-foreground text-muted-foreground"
          onClick={(e) => {
            e.preventDefault();
            setIsRenaming(true);
          }}
        >
          <Edit2 className="h-3.5 w-3.5" />
        </SidebarMenuAction>

        {/* Delete Action */}
        <AlertDialogTrigger asChild>
          <SidebarMenuAction
            showOnHover
            aria-label={`Delete folder ${folder.name}`}
            className="hover:bg-transparent hover:text-red-500 text-muted-foreground"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </SidebarMenuAction>
        </AlertDialogTrigger>
      </SidebarMenuItem>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this folder?</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove <span className="font-medium">{folder.name}</span>{" "}
            from your workspace. Tasks inside will not be deleted, but they may
            lose their folder association.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline">Cancel</Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant="destructive"
              onClick={(e) => {
                e.preventDefault();
                handleConfirmDelete();
              }}
            >
              Delete folder
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
