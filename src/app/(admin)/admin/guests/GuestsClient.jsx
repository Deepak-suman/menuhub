"use client";
import React, { useState } from "react";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { Users, Search, Gift, Calendar, PhoneCall, Copy, Check, Sparkles } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function GuestsClient({ initialGuests = [] }) {
  const [guests, setGuests] = useState(initialGuests);
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);

  const isUpcomingThisWeek = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const now = new Date();
    
    // Set hours to 0 to compare days
    now.setHours(0,0,0,0);
    const bDay = new Date(now.getFullYear(), d.getMonth(), d.getDate());
    
    if (bDay < now) {
       bDay.setFullYear(now.getFullYear() + 1);
    }
    
    const diffTime = bDay - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays >= 0;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const copyAllNumbers = () => {
    const numbers = guests.map(g => g.phone).join(", ");
    if (numbers) {
      navigator.clipboard.writeText(numbers);
      setCopied(true);
      toast.success("All contact numbers copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error("No contact numbers to copy.");
    }
  };

  const filteredGuests = guests.filter(g => 
    (g.name && g.name.toLowerCase().includes(search.toLowerCase())) ||
    g.phone.includes(search)
  );

  const upcomingBirthdays = guests.filter(g => isUpcomingThisWeek(g.birthday));
  const upcomingAnniversaries = guests.filter(g => isUpcomingThisWeek(g.anniversary));

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
      <Toaster position="top-center" />
      
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-indigo-500 to-indigo-700 text-white rounded-2xl shadow-lg shadow-indigo-500/20">
            <Users size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              VIP Diners Club <Sparkles size={18} className="text-amber-500" />
            </h1>
            <p className="text-slate-500 font-medium mt-1">Manage customer loyalty profiles and campaigns</p>
          </div>
        </div>

        <button 
          onClick={copyAllNumbers}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-6 rounded-2xl shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 hover:shadow-lg active:scale-95 transition-all text-sm"
        >
          {copied ? <Check size={18} /> : <Copy size={18} />}
          Copy All Contacts for SMS/WhatsApp
        </button>
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Upcoming celebrations alerts */}
        {(upcomingBirthdays.length > 0 || upcomingAnniversaries.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            {upcomingBirthdays.length > 0 && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50/50 border border-amber-100 rounded-3xl p-6 shadow-sm flex items-start gap-4">
                <div className="p-3 bg-amber-100/80 text-amber-700 rounded-2xl shadow-sm shrink-0">
                  <Gift size={24} />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-lg leading-tight">🎂 Birthdays This Week</h3>
                  <p className="text-xs font-semibold text-slate-400 mb-3">Send birthday rewards to loyalty members</p>
                  <div className="flex flex-wrap gap-2">
                    {upcomingBirthdays.map(g => (
                      <span key={g.id} className="bg-white border border-amber-100 text-amber-700 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-sm">
                        {g.name || "Guest"} ({formatDate(g.birthday)})
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {upcomingAnniversaries.length > 0 && (
              <div className="bg-gradient-to-r from-rose-50 to-pink-50/50 border border-rose-100 rounded-3xl p-6 shadow-sm flex items-start gap-4">
                <div className="p-3 bg-rose-100/80 text-rose-700 rounded-2xl shadow-sm shrink-0">
                  <Calendar size={24} />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-lg leading-tight">🥂 Anniversaries This Week</h3>
                  <p className="text-xs font-semibold text-slate-400 mb-3">Offer special dining experiences</p>
                  <div className="flex flex-wrap gap-2">
                    {upcomingAnniversaries.map(g => (
                      <span key={g.id} className="bg-white border border-rose-100 text-rose-700 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-sm">
                        {g.name || "Guest"} ({formatDate(g.anniversary)})
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Search bar & Guest table */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Diners Directory</h2>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-1">{guests.length} members registered</p>
            </div>
            <div className="relative w-full md:w-80">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 border-0 rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold text-slate-700 placeholder-slate-400 transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-xs font-bold uppercase text-slate-400 border-b border-slate-100">
                  <th className="p-4 pl-6">Name</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">🎂 Birthday</th>
                  <th className="p-4">🥂 Anniversary</th>
                  <th className="p-4 pr-6">📅 Member Since</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredGuests.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-50/50 transition-colors font-medium text-slate-700 text-sm">
                    <td className="p-4 pl-6 font-bold text-slate-900">{g.name || "Anonymous Guest"}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <PhoneCall size={14} className="text-slate-400" />
                        <span className="font-bold text-slate-800">{g.phone}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600">{formatDate(g.birthday)}</td>
                    <td className="p-4 text-slate-600">{formatDate(g.anniversary)}</td>
                    <td className="p-4 pr-6 text-xs text-slate-400">
                      {new Date(g.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      })}
                    </td>
                  </tr>
                ))}

                {filteredGuests.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-12 text-center text-slate-400 font-bold">
                      No diners found matching that criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
