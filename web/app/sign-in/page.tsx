"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function SignInPage() {
    const router = useRouter();
    const { data: session } = authClient.useSession();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (session?.user) {
            router.replace("/dashboard");
        }
    }, [session, router]);

    const handleGitHubLogin = async () => {
        setError(null);
        const result = await authClient.signIn.social({
            provider: "github",
            callbackURL: "/dashboard",
        });
        if (result?.error) {
            setError(result.error.message || "Sign in failed");
        } else if (result?.data?.url && result?.data?.redirect === false) {
            window.location.href = result.data.url;
        }
    };

    return (
        <main>
            <p>Sign in</p>
            <button onClick={handleGitHubLogin}>Continue with GitHub</button>
            {error ? <p>{error}</p> : null}
        </main>
    );
}
