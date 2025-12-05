"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

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
    <div className="space-y-8">
      <section>
        <p>Create new task... populate in SQL</p>

        <p>List of tasks here using some elegant card-like list... populated via SQL</p>
      </section>
    </div>
  );
}
