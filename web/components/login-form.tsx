"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup } from "@/components/ui/field";

type LoginFormProps = React.ComponentProps<"form"> & {
  handleGitHubLogin: () => void | Promise<void>;
  handleGoogleLogin: () => void | Promise<void>;
};

export function LoginForm({
  handleGitHubLogin,
  handleGoogleLogin,
  className,
  ...props
}: LoginFormProps) {
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  return (
    <form className={cn("flex flex-col gap-8", className)} onSubmit={handleFormSubmit} {...props}>
      <FieldGroup>
        <div className="flex flex-col gap-3 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Welcome back</h1>
          <p className="text-sm text-muted-foreground">Sign in to your workrail account to continue</p>
        </div>

        <div className="flex flex-col gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2 h-11 text-sm font-medium transition-all duration-200 hover:bg-muted bg-transparent"
            onClick={async () => {
              await handleGitHubLogin()
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
            </svg>
            Continue with GitHub
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2 h-11 text-sm font-medium transition-all duration-200 hover:bg-muted bg-transparent"
            onClick={async () => {
              await handleGoogleLogin()
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512" className="h-5 w-5 fill-current">
              <path
                fill="currentColor"
                d="M488 261.8C488 403.3 391.1 504 248 504 111 504 0 393 0 256S111 8 248 8c66.8 0 122.6 24.5 165.1 64.9l-67 64.9C318.3 113.7 286.4 100 248 100c-86.5 0-156.6 70.1-156.6 156S161.5 412 248 412c74.2 0 136.1-47.4 148.9-114.3H248v-91.9h240c2.2 12.7 3.9 24.9 3.9 56z"
              />
            </svg>
            Continue with Google
          </Button>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <div className="flex-1 border-t border-border" />
          <span className="text-xs text-muted-foreground font-medium px-2">OR</span>
          <div className="flex-1 border-t border-border" />
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <p className="text-xs text-muted-foreground text-center">Email and password authentication coming soon</p>
        </div>
      </FieldGroup>

      <div className="text-center text-xs text-muted-foreground">
        Don't have an account?{" "}
        <a href="/sign-up" className="font-medium text-foreground hover:underline transition-colors">
          Sign up
        </a>
      </div>
    </form>
  );
}