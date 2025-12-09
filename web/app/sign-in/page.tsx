"use client";

import Link from 'next/link'
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

import { LoginForm } from "@/components/login-form"

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

    const handleGoogleLogin = async () => {
        setError(null);
        const result = await authClient.signIn.social({
            provider: "google",
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
            <div className="grid min-h-svh lg:grid-cols-2">
                <div className="flex flex-col px-6 py-6 md:px-8 md:py-8">
                    <div className="flex justify-center gap-2 md:justify-start">
                        <Link href="/" className="text-xl font-bold tracking-tight text-foreground">
                            workrail
                        </Link>
                    </div>
                    <div className="flex flex-1 items-center justify-center">
                        <div className="w-full max-w-xs">
                            <LoginForm handleGitHubLogin={handleGitHubLogin} handleGoogleLogin={handleGoogleLogin} />
                        </div>
                    </div>
                </div>
                <div className="bg-muted relative hidden lg:block">
                    <img
                        src="https://images.unsplash.com/photo-1530569673472-307dc017a82d?q=80&w=988&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                        alt="Image"
                        className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
                    />
                </div>
            </div>
            {error ? <p>{error}</p> : null}
        </main>
    );
}