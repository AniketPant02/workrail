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

  const onSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/sign-in");
        },
      },
    });
  };

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

  const displayName =
    session.user.name || session.user.email || "User";

  return (
    <main>
      <p>{displayName}</p>
      <button type="button" onClick={onSignOut}>
        Sign out
      </button>
    </main>
  );
}