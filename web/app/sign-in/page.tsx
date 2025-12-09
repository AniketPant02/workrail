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
        <main className="min-h-screen bg-background">
            <div className="grid min-h-svh lg:grid-cols-2">
                <div className="flex flex-col px-6 py-12 md:px-10 md:py-16 lg:px-12 lg:py-20">
                    <div className="flex items-center gap-2">
                        <Link href="/" className="group flex items-center gap-2 transition-opacity hover:opacity-80">
                            <span className="text-lg font-bold tracking-tight text-foreground hidden sm:inline">workrail</span>
                        </Link>
                    </div>

                    <div className="flex flex-1 items-center justify-center py-8">
                        <div className="w-full max-w-sm">
                            <LoginForm handleGitHubLogin={handleGitHubLogin} handleGoogleLogin={handleGoogleLogin} />
                        </div>
                    </div>

                    {error && (
                        <div className="mb-4 px-4">
                            {error}
                        </div>
                    )}

                    <div className="text-center text-xs text-muted-foreground">
                        <p>By continuing, you agree to our Terms of Service and Privacy Policy</p>
                    </div>
                </div>

                <div className="bg-muted relative hidden lg:flex items-center justify-center overflow-hidden">
                    <img
                        src="https://images.unsplash.com/photo-1530569673472-307dc017a82d?q=80&w=988&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                        alt="Workspace visualization"
                        className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale transition-transform duration-500 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/40 via-black/20 to-transparent" />

                    <div className="relative z-10 text-center text-white px-6">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-pretty">Streamline your workflow</h2>
                        <p className="text-lg text-white/80 text-pretty max-w-md">
                            Manage projects, deliver faster, own your day.
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}