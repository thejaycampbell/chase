"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    // Write the password as a plain cookie — middleware reads it on each request.
    // This is intentionally simple: Chase is a personal read-only dashboard,
    // not a multi-user app. Upgrade to a proper auth solution if needed.
    document.cookie = `ss_auth=${encodeURIComponent(password)}; path=/; SameSite=Lax`;

    // Redirect and let middleware decide if the password is correct
    router.push("/");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-xl font-bold text-zinc-100">Chase</h1>
          <p className="text-sm text-zinc-500">Enter your dashboard password to continue.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            autoFocus
            className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none"
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            type="submit"
            className="w-full rounded-md bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-white transition-colors"
          >
            Enter
          </button>
        </form>
      </div>
    </main>
  );
}
