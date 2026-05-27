"use client";
import React, { useState, useEffect, useRef } from "react";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { 
  ChefHat, 
  Clock, 
  Volume2, 
  VolumeX, 
  Flame,
  Activity,
  Megaphone,
  Sparkles,
  CheckSquare,
  Square,
  CheckCircle,
  AlertTriangle,
  Search,
  Hash,
  Layers,
  ShoppingBag,
  ArrowRight
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function KitchenClient() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [audioContextUnlocked, setAudioContextUnlocked] = useState(false);
  const [timeTick, setTimeTick] = useState(0);
  
  // Search state for Batch Summary Sidebar
  const [searchQuery, setSearchQuery] = useState("");

  // Refs for tracking order items to announce new items and rounds
  const knownOrderItemsMapRef = useRef(new Map());
  const eventSourceRef = useRef(null);
  const fallbackTimerRef = useRef(null);

  // FIFO Speech Queue Refs
  const speechQueueRef = useRef([]);
  const isProcessingSpeechRef = useRef(false);

  // Load configuration settings from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedSound = localStorage.getItem("kds_sound_enabled");
      if (savedSound !== null) setSoundEnabled(savedSound === "true");

      const savedSpeech = localStorage.getItem("kds_speech_enabled");
      if (savedSpeech !== null) setSpeechEnabled(savedSpeech === "true");
    }
  }, []);

  // Synthesize a professional ring-ding chime tone using Web Audio API
  const playAudioChime = (toneType = "new") => {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const now = ctx.currentTime;
      
      if (toneType === "update") {
        // Fast double-chirp for order round updates
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = "triangle";
        osc1.frequency.setValueAtTime(659.25, now); // E5
        osc1.frequency.setValueAtTime(880.00, now + 0.08); // A5
        gain1.gain.setValueAtTime(0.08, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.3);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = "triangle";
        osc2.frequency.setValueAtTime(783.99, now + 0.12); // G5
        osc2.frequency.setValueAtTime(1046.50, now + 0.20); // C6
        gain2.gain.setValueAtTime(0.08, now + 0.12);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.12);
        osc2.stop(now + 0.4);
      } else {
        // Crisp dual-tone Ding-Dong for new orders
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(587.33, now); // D5
        gain1.gain.setValueAtTime(0.12, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 1.2);
        
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(659.25, now + 0.12); // E5
        gain2.gain.setValueAtTime(0.1, now + 0.12);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.12);
        osc2.stop(now + 1.5);
      }
      
      setAudioContextUnlocked(true);
    } catch (e) {
      console.warn("Audio chime block or failed:", e);
    }
  };

  // FIFO Speech Queue Processor
  const processSpeechQueue = () => {
    if (isProcessingSpeechRef.current || speechQueueRef.current.length === 0) return;
    
    isProcessingSpeechRef.current = true;
    const current = speechQueueRef.current.shift();

    // 1. Play chime audio context
    if (soundEnabled) {
      playAudioChime(current.type);
    }

    // 2. Play Speech Synthesis after chime delay (450ms) to prevent overlapping sounds
    setTimeout(() => {
      if (speechEnabled && typeof window !== "undefined" && "speechSynthesis" in window) {
        try {
          window.speechSynthesis.cancel(); // Reset active speakers
          
          const utterance = new SpeechSynthesisUtterance(current.text);
          utterance.pitch = 1.05;
          utterance.rate = 0.92;
          
          // Move to next in queue strictly when current speech ends
          utterance.onend = () => {
            setTimeout(() => {
              isProcessingSpeechRef.current = false;
              processSpeechQueue();
            }, 1200); // 1.2s gap of silence between speech events
          };

          utterance.onerror = (e) => {
            console.error("Utterance speech synthesis error:", e);
            isProcessingSpeechRef.current = false;
            processSpeechQueue();
          };

          window.speechSynthesis.speak(utterance);
        } catch (e) {
          console.error("Speech Synthesis exception:", e);
          isProcessingSpeechRef.current = false;
          processSpeechQueue();
        }
      } else {
        // Speech is disabled, delay slightly and process next
        setTimeout(() => {
          isProcessingSpeechRef.current = false;
          processSpeechQueue();
        }, 1800);
      }
    }, 450);
  };

  // Queue a new speech announcement
  const queueSpeechAnnouncement = (type, text) => {
    speechQueueRef.current.push({ type, text });
    processSpeechQueue();
  };

  const unlockAudio = () => {
    playAudioChime("new");
    setAudioContextUnlocked(true);
    toast.success("Live sound and speech announcements enabled!", { icon: "🔊" });
  };

  // Main order fetcher function
  const fetchOrders = async (isInitial = false) => {
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        // Kitchen only cares about ACTIVE or PREPARING orders
        const kitchenOrders = data.filter(o => o.status !== "COMPLETED");
        
        // Reverse array so the oldest order stays on top/first grid cell
        const sortedOrders = [...kitchenOrders].reverse();

        setOrders(sortedOrders);

        // Detect new orders or new rounds ("Order More")
        if (sortedOrders.length > 0) {
          sortedOrders.forEach(order => {
            const currentItemsMap = new Map();
            order.items.forEach(item => {
              currentItemsMap.set(item.id, item.quantity);
            });

            if (!knownOrderItemsMapRef.current.has(order.id)) {
              // Brand New Order!
              knownOrderItemsMapRef.current.set(order.id, currentItemsMap);
              
              if (!isInitial) {
                const itemsText = order.items
                  .map(item => `${item.quantity} ${item.menuItem?.name || "Item"}`)
                  .join(", ");
                
                // Enqueue announcement
                queueSpeechAnnouncement("new", `New order for Table ${order.tableNumber}. Items: ${itemsText}`);
                
                toast(`New Table ${order.tableNumber} Order!`, {
                  icon: "🔔",
                  style: { borderRadius: "16px", background: "#0f172a", color: "#f8fafc", border: "1px solid #334155" }
                });
              }
            } else {
              // Existing active table! Check for subsequent items added ("Order More")
              const savedItemsMap = knownOrderItemsMapRef.current.get(order.id);
              const addedItemsList = [];

              order.items.forEach(item => {
                const savedQty = savedItemsMap.get(item.id) || 0;
                if (item.quantity > savedQty) {
                  addedItemsList.push({
                    name: item.menuItem?.name || "Item",
                    quantity: item.quantity - savedQty
                  });
                }
              });

              if (addedItemsList.length > 0 && !isInitial) {
                const addedText = addedItemsList
                  .map(item => `${item.quantity} ${item.name}`)
                  .join(", ");
                
                // Enqueue announcement
                queueSpeechAnnouncement("update", `Table ${order.tableNumber} added items. ${addedText}`);
                
                toast.success(`Table ${order.tableNumber} added: ${addedText}`, {
                  icon: "➕",
                  duration: 5000,
                  style: { borderRadius: "16px", background: "#0f172a", color: "#34d399", border: "1px solid #065f46" }
                });
              }

              // Update saved map
              knownOrderItemsMapRef.current.set(order.id, currentItemsMap);
            }
          });

          // Clean up refs for orders that are no longer active
          const activeOrderIds = new Set(sortedOrders.map(o => o.id));
          for (const orderId of knownOrderItemsMapRef.current.keys()) {
            if (!activeOrderIds.has(orderId)) {
              knownOrderItemsMapRef.current.delete(orderId);
            }
          }
        } else {
          knownOrderItemsMapRef.current.clear();
        }
      }
    } catch (e) {
      console.error("Failed to fetch kitchen orders:", e);
    } finally {
      setLoading(false);
    }
  };

  // Establish SSE stream connection with Smart Fallback
  useEffect(() => {
    fetchOrders(true);

    const connectSSE = () => {
      if (typeof window === "undefined") return;

      try {
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }

        console.log("Connecting KDS real-time SSE stream...");
        eventSourceRef.current = new EventSource("/api/orders/live");

        eventSourceRef.current.addEventListener("connected", () => {
          console.log("KDS real-time SSE connected!");
          if (fallbackTimerRef.current) {
            clearInterval(fallbackTimerRef.current);
            fallbackTimerRef.current = null;
          }
        });

        eventSourceRef.current.addEventListener("update", (event) => {
          console.log("SSE live event received, refreshing data...");
          fetchOrders(false);
        });

        eventSourceRef.current.onerror = (err) => {
          console.warn("KDS SSE connection closed/error. Initiating polling fallback.");
          if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
          }
          startPollingFallback();
        };

      } catch (err) {
        console.error("SSE setup crash:", err);
        startPollingFallback();
      }
    };

    const startPollingFallback = () => {
      if (fallbackTimerRef.current) return;
      console.log("Starting backup polling (every 6 seconds)...");
      fallbackTimerRef.current = setInterval(() => {
        fetchOrders(false);
      }, 6000);
    };

    connectSSE();

    const minuteTick = setInterval(() => {
      setTimeTick(prev => prev + 1);
    }, 60000);

    return () => {
      if (eventSourceRef.current) eventSourceRef.current.close();
      if (fallbackTimerRef.current) clearInterval(fallbackTimerRef.current);
      clearInterval(minuteTick);
    };
  }, []);

  // Update order status (Start Preparing or Complete Ready)
  const updateOrderStatus = async (id, targetStatus) => {
    const isComplete = targetStatus === "COMPLETED";
    toast.loading(isComplete ? "Marking ready..." : "Starting order...", { id: "status_update" });
    
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStatus })
      });
      
      if (res.ok) {
        toast.success(isComplete ? "Order Marked Ready!" : "Order in Preparation!", { id: "status_update" });
        fetchOrders(false);
      } else {
        toast.error("Failed to update status", { id: "status_update" });
      }
    } catch (err) {
      toast.error("Network connection error", { id: "status_update" });
    }
  };

  // Toggle checklist item using LIVE Database sync + snappy Optimistic UI Updates
  const toggleItemChecked = async (orderId, itemId, currentStatus) => {
    const newStatus = currentStatus === "COMPLETED" ? "PENDING" : "COMPLETED";
    
    // Play light synth pop on tick
    if (soundEnabled && typeof window !== "undefined") {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(newStatus === "COMPLETED" ? 880 : 440, ctx.currentTime);
        gain.gain.setValueAtTime(0.02, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } catch(e) {}
    }

    // SNAPPY OPTIMISTIC UPDATE
    setOrders(prevOrders => prevOrders.map(order => {
      if (order.id === orderId) {
        return {
          ...order,
          items: order.items.map(item => {
            if (item.id === itemId) {
              return { ...item, status: newStatus };
            }
            return item;
          })
        };
      }
      return order;
    }));

    try {
      const res = await fetch(`/api/orders/${orderId}/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!res.ok) {
        throw new Error("Failed to sync item status");
      }
    } catch (err) {
      toast.error("Connection failed! Item status reverted.");
      fetchOrders(false);
    }
  };

  const toggleSoundConfig = () => {
    setSoundEnabled(prev => {
      const newVal = !prev;
      localStorage.setItem("kds_sound_enabled", String(newVal));
      if (newVal) playAudioChime("new");
      return newVal;
    });
  };

  const toggleSpeechConfig = () => {
    setSpeechEnabled(prev => {
      const newVal = !prev;
      localStorage.setItem("kds_speech_enabled", String(newVal));
      return newVal;
    });
  };

  if (loading) return <LoadingSpinner fullScreen />;

  // Calculate stats
  const totalActive = orders.length;
  const preparingCount = orders.filter(o => o.status === "PREPARING").length;
  const pendingCount = orders.filter(o => o.status === "ACTIVE").length;
  const delayedCount = orders.filter(o => {
    const diff = Math.floor((Date.now() - new Date(o.createdAt).getTime()) / 60000);
    return diff >= 12;
  }).length;

  // --- LIVE DISH AGGREGATION SIDEBAR CALCULATIONS ---
  const aggregatedPendingItems = {};
  orders.forEach(order => {
    order.items.forEach(item => {
      if (item.status === "PENDING") {
        const dishName = item.menuItem?.name || "Unknown Item";
        const key = `${dishName}-${item.size || "Full"}`;
        
        if (!aggregatedPendingItems[key]) {
          aggregatedPendingItems[key] = {
            name: dishName,
            size: item.size || "Full",
            quantity: 0,
            tables: []
          };
        }
        
        aggregatedPendingItems[key].quantity += item.quantity;
        aggregatedPendingItems[key].tables.push({
          tableNumber: order.tableNumber,
          quantity: item.quantity
        });
      }
    });
  });

  // Sort and apply query filters
  const filteredBatchList = Object.values(aggregatedPendingItems)
    .filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => b.quantity - a.quantity);

  return (
    <div className="p-6 md:p-8 bg-slate-950 min-h-screen text-slate-100 font-sans antialiased SelectionColor">
      <Toaster position="top-right" />

      {/* Audio Consent Bar */}
      {!audioContextUnlocked && (
        <div className="mb-6 p-4 bg-gradient-to-r from-indigo-600/90 to-purple-600/90 text-white rounded-2xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-bounce">
          <div className="flex items-center gap-3">
            <Megaphone size={28} className="animate-pulse" />
            <div className="text-center sm:text-left">
              <h3 className="font-bold text-lg">Enable Real-Time Voice Alerts</h3>
              <p className="text-xs text-indigo-100">Click to permit audio chime & order announcements.</p>
            </div>
          </div>
          <button 
            onClick={unlockAudio}
            className="px-6 py-2 bg-white text-indigo-700 font-black rounded-xl hover:bg-slate-100 transition-all text-sm shrink-0 shadow-lg"
          >
            Activate Sound 🔊
          </button>
        </div>
      )}
      
      {/* Header Dashboard */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 bg-slate-900/60 p-6 rounded-3xl border border-slate-800 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-gradient-to-br from-orange-400 to-rose-500 text-white rounded-2xl shadow-lg shadow-orange-500/20">
            <ChefHat size={36} />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-2">
              Kitchen Display
              <span className="h-3.5 w-3.5 bg-emerald-500 rounded-full animate-ping block" />
            </h1>
            <p className="text-slate-400 font-medium mt-0.5 text-sm sm:text-base flex items-center gap-1.5">
              <Activity size={16} className="text-emerald-400" />
              Live Order Streaming active
            </p>
          </div>
        </div>

        {/* Live Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-950/50 p-3 rounded-2xl border border-slate-800">
          <div className="px-4 py-2 text-center border-r border-slate-800/80 last:border-0">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest block">Total Active</span>
            <span className="text-2xl font-black text-white mt-1 block">{totalActive}</span>
          </div>
          <div className="px-4 py-2 text-center border-r border-slate-800/80 last:border-0">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest block">New Orders</span>
            <span className="text-2xl font-black text-blue-400 mt-1 block">{pendingCount}</span>
          </div>
          <div className="px-4 py-2 text-center border-r border-slate-800/80 last:border-0">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest block">Preparing</span>
            <span className="text-2xl font-black text-amber-400 mt-1 block">{preparingCount}</span>
          </div>
          <div className="px-4 py-2 text-center last:border-0">
            <span className="text-[10px] uppercase font-bold text-rose-400 tracking-widest block flex items-center justify-center gap-1">
              Delayed
              {delayedCount > 0 && <Flame size={12} className="text-rose-500 animate-bounce" />}
            </span>
            <span className={`text-2xl font-black mt-1 block ${delayedCount > 0 ? "text-rose-500 animate-pulse" : "text-slate-400"}`}>
              {delayedCount}
            </span>
          </div>
        </div>

        {/* Config Toggles */}
        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={toggleSoundConfig}
            className={`p-3 rounded-2xl border transition-all flex items-center gap-2 text-sm font-bold ${
              soundEnabled 
                ? "bg-slate-800 border-slate-700 text-emerald-400 hover:bg-slate-700" 
                : "bg-slate-900 border-slate-800 text-slate-500 hover:bg-slate-800"
            }`}
            title={soundEnabled ? "Mute Bell Chime" : "Unmute Bell Chime"}
          >
            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            <span className="hidden sm:inline">Chime</span>
          </button>
          <button 
            onClick={toggleSpeechConfig}
            className={`p-3 rounded-2xl border transition-all flex items-center gap-2 text-sm font-bold ${
              speechEnabled 
                ? "bg-slate-800 border-slate-700 text-indigo-400 hover:bg-slate-700" 
                : "bg-slate-900 border-slate-800 text-slate-500 hover:bg-slate-800"
            }`}
            title={speechEnabled ? "Mute Voice Announcements" : "Unmute Voice Announcements"}
          >
            <Megaphone size={20} />
            <span className="hidden sm:inline">Speech</span>
          </button>
        </div>
      </div>

      {/* SPLIT LAYOUT: 75% Orders Grid, 25% Batch Prep Summary Sidebar */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Left Side: Orders Grid (75%) */}
        <div className="flex-1 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {orders.map((order) => {
              const timeElapsedMins = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
              let borderGlowClass = "border-slate-800 bg-slate-900/60";
              let alertIndicator = null;
              
              if (timeElapsedMins < 6) {
                borderGlowClass = "border-emerald-500/40 bg-slate-900/80 shadow-[0_0_15px_rgba(16,185,129,0.1)]";
              } else if (timeElapsedMins >= 12 && timeElapsedMins < 20) {
                borderGlowClass = "border-amber-500/50 bg-slate-900/80 shadow-[0_0_20px_rgba(245,158,11,0.15)] animate-pulse";
                alertIndicator = (
                  <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 font-bold uppercase tracking-wider">
                    <AlertTriangle size={10} /> Delayed
                  </span>
                );
              } else if (timeElapsedMins >= 20) {
                borderGlowClass = "border-rose-500/70 bg-slate-900/90 shadow-[0_0_25px_rgba(239,68,68,0.25)] animate-pulse";
                alertIndicator = (
                  <span className="flex items-center gap-1 text-[10px] text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20 font-bold uppercase tracking-wider animate-bounce">
                    <Flame size={10} /> Critical
                  </span>
                );
              }

              return (
                <div 
                  key={order.id} 
                  className={`rounded-3xl p-6 shadow-2xl border flex flex-col relative overflow-hidden transition-all duration-300 hover:scale-[1.015] hover:shadow-slate-950/40 ${borderGlowClass}`}
                >
                  <div 
                    className={`absolute top-0 left-0 right-0 h-2 transition-colors duration-300 ${
                      order.status === "PREPARING" 
                        ? "bg-gradient-to-r from-amber-400 to-orange-500" 
                        : timeElapsedMins >= 20
                          ? "bg-rose-600 animate-pulse"
                          : timeElapsedMins >= 12
                            ? "bg-amber-500 animate-pulse"
                            : "bg-gradient-to-r from-indigo-500 to-emerald-500"
                    }`} 
                  />
                  
                  <div className="flex justify-between items-start mb-5 mt-2">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5 block">Table</span>
                      <span className="text-5xl font-black text-white">{order.tableNumber}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">Placed At</span>
                      <span className="text-sm font-bold text-slate-300 flex items-center justify-end gap-1.5">
                        <Clock size={14} className="text-slate-400" />
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span className={`inline-block mt-2 font-bold text-xs ${
                        timeElapsedMins >= 20 ? "text-rose-500 animate-pulse" : timeElapsedMins >= 12 ? "text-amber-400" : "text-slate-400"
                      }`}>
                        {timeElapsedMins === 0 ? "Just now" : `${timeElapsedMins} min ago`}
                      </span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap items-center gap-2 mb-5">
                    {order.status === "PREPARING" ? (
                      <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 text-[10px] font-black rounded-lg border border-amber-500/20 uppercase tracking-widest flex items-center gap-1">
                        <Flame size={12} className="animate-pulse" /> Preparing
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-black rounded-lg border border-blue-500/20 uppercase tracking-widest">
                        New Order
                      </span>
                    )}
                    {alertIndicator}
                    {order.customerName && (
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] font-semibold rounded-md border border-slate-700 max-w-[120px] truncate" title={order.customerName}>
                         👤 {order.customerName}
                      </span>
                    )}
                  </div>

                  {/* Items List */}
                  <div className="flex-1 bg-slate-955/40 bg-slate-950/60 rounded-2xl p-4 mb-6 border border-slate-800/80 overflow-y-auto max-h-[280px] custom-scrollbar">
                    {Object.entries(
                      order.items.reduce((acc, item) => {
                        const round = item.roundNumber || 1;
                        if (!acc[round]) acc[round] = [];
                        acc[round].push(item);
                        return acc;
                      }, {})
                    ).map(([round, items]) => (
                      <div key={round} className="mb-6 last:mb-0">
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-slate-900 text-slate-400 rounded-lg text-[9px] font-black uppercase tracking-wider mb-3 border border-slate-800">
                          <Sparkles size={10} className="text-yellow-500" />
                          <span>{round == 1 ? "1st Round" : round == 2 ? "2nd Round" : round == 3 ? "3rd Round" : `${round}th Round`}</span>
                        </div>

                        <ul className="space-y-3.5">
                          {items.map((item) => {
                            const isChecked = item.status === "COMPLETED";
                            return (
                              <li 
                                key={item.id} 
                                onClick={() => toggleItemChecked(order.id, item.id, item.status)}
                                className="flex justify-between items-center cursor-pointer group select-none py-1.5"
                              >
                                <div className="flex items-start gap-2.5 flex-1 min-w-0 pr-2">
                                  {isChecked ? (
                                    <CheckSquare size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                                  ) : (
                                    <Square size={18} className="text-slate-600 group-hover:text-slate-400 shrink-0 mt-0.5 transition-colors" />
                                  )}
                                  <div className="min-w-0">
                                    <span className={`font-bold block text-sm sm:text-base transition-all break-words leading-tight ${
                                      isChecked ? "line-through text-slate-500 opacity-60" : "text-slate-200 group-hover:text-white"
                                    }`}>
                                      {item.menuItem?.name || "Item"}
                                    </span>
                                    {item.size && item.size !== "Full" && (
                                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider mt-0.5 block">{item.size}</span>
                                    )}
                                  </div>
                                </div>
                                <span className={`w-8 h-8 rounded-full flex items-center justify-center font-black shrink-0 text-sm border transition-all ${
                                  isChecked 
                                    ? "bg-slate-900 border-slate-800 text-slate-500 opacity-40" 
                                    : "bg-slate-800 border-slate-700 text-white shadow-inner"
                                }`}>
                                  x{item.quantity}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>

                  {/* Stage Action Buttons */}
                  <div className="space-y-3">
                    {order.status === "ACTIVE" ? (
                      <button 
                        onClick={() => updateOrderStatus(order.id, "PREPARING")}
                        className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-400 hover:to-orange-400 rounded-2xl font-black text-sm tracking-widest uppercase transition-all flex items-center justify-center gap-2 group shadow-lg shadow-orange-500/20"
                      >
                        <Flame size={18} className="group-hover:scale-110 transition-transform" />
                        Start Cooking
                      </button>
                    ) : (
                      <button 
                        onClick={() => updateOrderStatus(order.id, "COMPLETED")}
                        className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-400 hover:to-teal-500 rounded-2xl font-black text-sm tracking-widest uppercase transition-all flex items-center justify-center gap-2 group shadow-lg shadow-emerald-500/20"
                      >
                        <CheckCircle size={18} className="group-hover:scale-110 transition-transform animate-pulse" />
                        Mark Ready
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            
            {orders.length === 0 && (
              <div className="col-span-full py-32 flex flex-col items-center justify-center text-center bg-slate-900/30 rounded-3xl border border-dashed border-slate-800/80 p-8">
                 <div className="w-24 h-24 rounded-full bg-slate-900/60 flex items-center justify-center mb-6 shadow-inner border border-slate-800">
                   <ChefHat size={48} className="text-slate-600 opacity-50" />
                 </div>
                 <h2 className="text-2xl font-black text-slate-400 tracking-tight">Kitchen is currently clear!</h2>
                 <p className="font-semibold mt-2 text-slate-500 text-sm max-w-sm">No pending orders right now. New tables will show up automatically in real-time.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Live Batch Prep Summary Sidebar (25% Width) */}
        <div className="w-full lg:w-[350px] shrink-0 bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl sticky top-6">
          <div className="flex items-center gap-2.5 mb-6 border-b border-slate-800 pb-4">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
              <Layers size={22} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-1.5">
                Batch Prep Summary
              </h2>
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Tally of pending dishes</p>
            </div>
          </div>

          {/* Search bar inside sidebar */}
          <div className="relative mb-6">
            <Search className="absolute left-3.5 top-3 text-slate-500" size={16} />
            <input 
              type="text" 
              placeholder="Search active dishes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-semibold"
            />
          </div>

          {/* Aggregated batch list */}
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
            {filteredBatchList.map((batchItem, idx) => (
              <div 
                key={idx} 
                className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col gap-3.5 group relative overflow-hidden"
              >
                {/* Background decorative glow on hover */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="flex justify-between items-start">
                  <div className="min-w-0 pr-2">
                    <span className="font-bold text-slate-200 group-hover:text-white transition-colors block text-base leading-tight break-words">
                      {batchItem.name}
                    </span>
                    {batchItem.size && batchItem.size !== "Full" && (
                      <span className="inline-block px-2 py-0.5 bg-slate-800/80 text-slate-400 text-[9px] font-black rounded border border-slate-700 uppercase mt-1 tracking-wider">
                        {batchItem.size}
                      </span>
                    )}
                  </div>
                  
                  {/* Aggregated Quantity Badge */}
                  <span className="h-10 w-10 shrink-0 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-md font-black flex items-center justify-center text-lg">
                    {batchItem.quantity}
                  </span>
                </div>

                {/* Target tables lists */}
                <div className="border-t border-slate-800/80 pt-3">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Target Tables:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {batchItem.tables.map((table, tIdx) => (
                      <span 
                        key={tIdx} 
                        className="px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-[10px] font-bold text-slate-300 flex items-center gap-1"
                      >
                        <Hash size={9} className="text-indigo-400" />
                        <span>Table {table.tableNumber}</span>
                        <span className="text-slate-500 font-extrabold">&bull;</span>
                        <span className="text-indigo-300 font-black">x{table.quantity}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {filteredBatchList.length === 0 && (
              <div className="py-12 flex flex-col items-center justify-center text-slate-600 text-center">
                <ShoppingBag size={40} className="opacity-20 mb-3" />
                <span className="text-sm font-bold text-slate-500">No active dishes pending</span>
                <span className="text-xs text-slate-600 mt-1 max-w-[200px]">Cooking summaries will populate here when tables place orders.</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
