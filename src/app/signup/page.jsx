"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UtensilsCrossed, Store } from "lucide-react";

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    restaurantName: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Signup failed");
        setLoading(false);
        return;
      }

      // Automatically sign the user in after successful registration
      const loginRes = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (loginRes?.error) {
        router.push("/login?registered=true");
      } else {
        router.push("/admin/dashboard");
      }
    } catch (err) {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value});

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full max-w-lg border border-gray-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500 to-teal-500 rounded-2xl mx-auto mb-4 shadow-lg shadow-emerald-500/30 flex items-center justify-center text-white">
             <Store size={32} />
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Register Restaurant</h1>
          <p className="text-slate-500 font-medium mt-2">Join the Jambo SaaS platform</p>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded relative mb-4 text-sm text-center font-semibold">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSignup} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-1 text-sm">Your Name</label>
                <input 
                  type="text" 
                  name="name"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-1 text-sm">Email Address</label>
                <input 
                  type="email" 
                  name="email"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
          </div>
          
          <div>
            <label className="block text-gray-700 font-semibold mb-1 text-sm">Restaurant/Cafe Name</label>
            <input 
              type="text" 
              name="restaurantName"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={formData.restaurantName}
              onChange={handleChange}
              placeholder="e.g. Pizza King"
              required
            />
            <p className="text-xs text-slate-400 mt-1">This will be used to generate your public URL slug.</p>
          </div>
          
          <div>
            <label className="block text-gray-700 font-semibold mb-1 text-sm">Password</label>
            <input 
              type="password" 
              name="password"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className={`w-full text-white font-bold py-3 pt-3.5 rounded-xl transition-all shadow-md mt-4 ${
              loading ? "bg-emerald-400 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700 hover:-translate-y-0.5"
            }`}
          >
            {loading ? "Registering..." : "Create Account & Restaurant"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm font-semibold text-slate-500">
           Already have an account? <Link href="/login" className="text-emerald-600 hover:underline">Log In</Link>
        </p>
      </div>
    </div>
  );
}
