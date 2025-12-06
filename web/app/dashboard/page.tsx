"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

import TaskCenter from "@/components/tasks/task-center";

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending, error } = authClient.useSession();

  useEffect(() => {
    if (!isPending && (!session?.user || error)) {
      router.replace("/sign-in");
    }
  }, [isPending, session, error, router]);

  if (isPending) {
    return (
      <main>
        <p>Loading…</p>
      </main>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <>
      <TaskCenter />
    </>
  );
}
