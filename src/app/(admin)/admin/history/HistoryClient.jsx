"use client";
import React, { useState, useMemo } from "react";
import { ArrowLeft, Clock, History, Calendar, CheckCircle2, ChevronRight, Star, Printer, Search, ArrowUpDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";

const OrderDetailsModal = dynamic(() => import("@/components/admin/OrderDetailsModal"), {
  ssr: false
});

export default function HistoryClient({ initialOrders = [] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all"); // "all", "today", "week", "month"
  const [sortBy, setSortBy] = useState("desc"); // "desc", "asc", "price-high", "price-low"

  // Quick stats calculations
  const stats = useMemo(() => {
    const totalCount = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    
    // Average rating
    let ratingSum = 0;
    let ratingCount = 0;
    orders.forEach(o => {
      if (o.rating) {
        const avg = (
          (o.rating.foodTaste || 0) + 
          (o.rating.service || 0) + 
          (o.rating.cleanliness || 0) + 
          (o.rating.chef || 0) + 
          (o.rating.staff || 0) + 
          (o.rating.seatingComfort || 0)
        ) / 6;
        ratingSum += avg;
        ratingCount++;
      }
    });
    
    const avgRating = ratingCount > 0 ? (ratingSum / ratingCount).toFixed(1) : "N/A";
    return { totalCount, totalRevenue, avgRating };
  }, [orders]);

  // Filtering and Sorting
  const filteredAndSortedOrders = useMemo(() => {
    let result = [...orders];

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(o => 
        o.id.toLowerCase().includes(term) ||
        (o.tableNumber && o.tableNumber.toString().includes(term)) ||
        (o.customerName && o.customerName.toLowerCase().includes(term)) ||
        (o.items && o.items.some(i => i.menuItem.name.toLowerCase().includes(term)))
      );
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const oneWeekAgo = today - 7 * 24 * 60 * 60 * 1000;
      const oneMonthAgo = today - 30 * 24 * 60 * 60 * 1000;

      result = result.filter(o => {
        const orderTime = new Date(o.createdAt).getTime();
        if (dateFilter === "today") return orderTime >= today;
        if (dateFilter === "week") return orderTime >= oneWeekAgo;
        if (dateFilter === "month") return orderTime >= oneMonthAgo;
        return true;
      });
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "desc") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === "asc") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === "price-high") {
        return (b.totalAmount || 0) - (a.totalAmount || 0);
      }
      if (sortBy === "price-low") {
        return (a.totalAmount || 0) - (b.totalAmount || 0);
      }
      return 0;
    });

    return result;
  }, [orders, searchTerm, dateFilter, sortBy]);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }) + " at " + d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getOrderAverageRating = (rating) => {
    if (!rating) return null;
    const score = (
      (rating.foodTaste || 0) +
      (rating.service || 0) +
      (rating.cleanliness || 0) +
      (rating.chef || 0) +
      (rating.staff || 0) +
      (rating.seatingComfort || 0)
    ) / 6;
    return score.toFixed(1);
  };

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="p-2 bg-white rounded-xl shadow-sm text-gray-500 hover:text-indigo-600 transition-colors border border-gray-100">
              <ArrowLeft size={24} />
            </Link>
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                <History className="text-indigo-600" /> Order History
              </h1>
              <p className="text-slate-500 font-medium mt-1">View, search, and analyze all completed orders.</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-bold">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Closed Orders</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{stats.totalCount}</h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center font-bold">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Revenue</p>
              <h3 className="text-2xl font-black text-emerald-600 mt-1">₹{stats.totalRevenue.toLocaleString()}</h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
            <div className="w-12 h-12 bg-yellow-50 text-yellow-600 rounded-2xl flex items-center justify-center font-bold">
              <Star size={24} className="fill-yellow-400 text-yellow-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Feedback</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">
                {stats.avgRating} <span className="text-xs text-slate-400 font-medium">/ 5.0</span>
              </h3>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 md:p-6 rounded-3xl border border-slate-100 shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by Order ID, Table #, Customer name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-0 rounded-2xl text-slate-700 placeholder-slate-400 font-bold focus:bg-slate-100 focus:outline-none transition-all"
            />
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            {/* Date filter dropdown */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-3 bg-slate-50 border-0 rounded-2xl text-slate-700 font-bold focus:bg-slate-100 focus:outline-none transition-all cursor-pointer"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="week">Past 7 Days</option>
              <option value="month">Past 30 Days</option>
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 bg-slate-50 border-0 rounded-2xl text-slate-700 font-bold focus:bg-slate-100 focus:outline-none transition-all cursor-pointer"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
              <option value="price-high">Highest Amount</option>
              <option value="price-low">Lowest Amount</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        {filteredAndSortedOrders.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-3xl border border-slate-100 shadow-sm">
            <p className="text-slate-400 font-bold">No matching closed orders found.</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-slate-400 font-bold text-xs uppercase tracking-wider">
                    <th className="py-4 px-6">Order ID</th>
                    <th className="py-4 px-6">Table</th>
                    <th className="py-4 px-6">Date & Time</th>
                    <th className="py-4 px-6 text-right">Amount</th>
                    <th className="py-4 px-6 text-center">Rating</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredAndSortedOrders.map((order) => {
                    const ratingScore = getOrderAverageRating(order.rating);
                    return (
                      <tr key={order.id} className="hover:bg-slate-50/50 transition-colors font-medium text-slate-700">
                        <td className="py-4 px-6 font-bold text-slate-900 truncate max-w-[120px]">
                          #{order.id}
                        </td>
                        <td className="py-4 px-6">
                          <span className="bg-slate-100 text-slate-700 font-bold px-2.5 py-1 rounded-lg text-sm border border-slate-200">
                            Table {order.tableNumber}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-sm text-slate-500">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="py-4 px-6 text-right font-black text-slate-800">
                          ₹{order.totalAmount}
                        </td>
                        <td className="py-4 px-6 text-center">
                          {ratingScore ? (
                            <span className="inline-flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2 py-1 rounded-lg text-xs font-bold border border-yellow-100">
                              <Star size={12} className="fill-yellow-400 text-yellow-400" /> {ratingScore}
                            </span>
                          ) : (
                            <span className="text-slate-300 text-xs font-medium">—</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/admin/bill/${order.id}`}
                              target="_blank"
                              className="inline-flex items-center justify-center bg-green-50 hover:bg-green-100 text-green-600 w-10 h-10 rounded-xl transition-colors border border-green-100"
                              title="Print Bill"
                            >
                              <Printer size={18} />
                            </Link>

                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="inline-flex items-center justify-center bg-indigo-50 hover:bg-indigo-100 text-indigo-600 w-10 h-10 rounded-xl transition-colors border border-indigo-100"
                              title="View Details"
                            >
                              <ChevronRight size={20} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {selectedOrder && (
        <OrderDetailsModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  );
}
