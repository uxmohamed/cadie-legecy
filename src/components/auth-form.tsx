"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";

export function AuthForm() {
  const [isSignUp, setIsSignUp] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const supabase = createClient();

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;
        setMessage("Check your email to confirm your account!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        router.push("/");
        router.refresh();
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setMessage(error.message);
      } else {
        setMessage("An error occurred");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-neutral-900">
          {isSignUp ? "Create an account" : "Sign in to Vault"}
        </h1>
        <p className="mt-2 text-sm text-neutral-400">
          {isSignUp
            ? "Enter your email to create your account"
            : "Enter your email and password to sign in"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="sr-only">
            Email
          </label>
          <Input
            id="email"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="password" className="sr-only">
            Password
          </label>
          <Input
            id="password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            minLength={6}
          />
        </div>

        {message && (
          <div
            className={`rounded-lg px-4 py-3 text-sm ${
              message.includes("error") || message.includes("Error")
                ? "bg-red-50 text-red-900"
                : "bg-green-50 text-green-900"
            }`}
          >
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-neutral-900 px-4 py-3 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          {loading ? "Loading..." : isSignUp ? "Sign up" : "Sign in"}
        </button>
      </form>

      <div className="text-center">
        <button
          onClick={() => {
            setIsSignUp(!isSignUp);
            setMessage("");
          }}
          className="text-sm text-neutral-400 hover:text-neutral-900"
        >
          {isSignUp
            ? "Already have an account? Sign in"
            : "Don't have an account? Sign up"}
        </button>
      </div>
    </div>
  );
}

