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
  Edit2, // NEW
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
import { useEffect, useRef } from "react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type Folder = {
  id: string;
  name: string;
};

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
                  <div className="flex w-full items-center gap-2 rounded-md bg-accent/40 px-2 py-1.5">
                    <FolderClosed className="size-4 shrink-0" />
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
                      className="w-full bg-transparent text-xs outline-none"
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
                <div className="px-2 text-xs text-muted-foreground">
                  Loading folders…
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
        <div className="flex w-full items-center gap-2 rounded-md bg-accent/40 px-2 py-1.5">
          <FolderClosed className="size-4 shrink-0" />
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
              // Determine UX: Should we save on blur?
              // Often better to save if valid, or just cancel.
              // Let's save on blur for convenience.
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
      <SidebarMenuItem>
        <SidebarMenuButton asChild tooltip={folder.name} isActive={isActive}>
          <Link href={href} className="flex min-w-0 items-center gap-2">
            <FolderClosed className="size-4 shrink-0" />
            <span className="truncate">{folder.name}</span>
          </Link>
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
