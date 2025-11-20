"use client"

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ForgotPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [msg, setMsg] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, newPassword }),
    });
    const data = await res.json();
    setMsg(data.message || data.error);
    if (res.ok) setTimeout(() => router.push("/"), 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm bg-white rounded-xl shadow p-6 space-y-4">
        <h1 className="text-2xl font-semibold text-center">Reset Password</h1>
        <input
          type="email"
          className="w-full border rounded p-2"
          placeholder="Email terdaftar"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          className="w-full border rounded p-2"
          placeholder="Password baru"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <button className="w-full rounded bg-blue-600 hover:bg-blue-700 text-white py-2">
          Reset Password
        </button>
        {msg && <p className="text-center text-sm text-gray-600">{msg}</p>}
      </form>
    </div>
  );
}