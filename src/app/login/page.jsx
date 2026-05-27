"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Email or Password Incorrect!");
      setLoading(false);
    } else {
      // Refresh to update server components 
      router.refresh();
      // Redirect handled by next-auth or we can manually route
      router.push("/admin/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full max-w-md border border-gray-100">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl mx-auto mb-4 shadow-lg shadow-blue-500/30 flex items-center justify-center">
            <span className="text-white font-black text-2xl">J</span>
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Login Portal</h1>
          <p className="text-slate-500 font-medium mt-2">Sign in to manage your spaces</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded relative mb-4 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-gray-700 font-semibold mb-1 text-sm">Email Address</label>
            <input
              type="email"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-1 text-sm">Password</label>
            <input
              type="password"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div className="text-right mt-1">
              <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                Forgot Password?
              </Link>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full text-white font-bold py-3 rounded-lg transition-all ${loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 shadow-md"
              }`}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
