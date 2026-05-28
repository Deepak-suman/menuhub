import { useState, useEffect } from "react";

export function useOrderPolling(orderId, intervalMs = 5000) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!orderId) return;

    let isMounted = true;
    let eventSource = null;
    let fallbackTimer = null;
    let isPolling = false;

    const token = typeof window !== "undefined" ? localStorage.getItem(`menuhub_order_token_${orderId}`) : null;

    // Helper to fetch order from standard REST endpoint (Fallback method)
    const fetchOrder = async () => {
      try {
        const headers = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        const res = await fetch(`/api/orders/${orderId}`, { headers });
        if (!res.ok) {
          throw new Error("Failed to fetch order");
        }
        const data = await res.json();
        
        if (isMounted) {
          setOrder(prev => {
            if (!prev) return data;
            return {
              ...prev,
              ...data,
              items: data.items || prev.items,
              restaurant: data.restaurant || prev.restaurant,
            };
          });
          setError(null);
          
          // Stop polling if order is closed
          if (data.status === "CLOSED" && fallbackTimer) {
             clearInterval(fallbackTimer);
          }
        }
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    // Helper to start the fallback polling mechanism
    const startFallbackPolling = () => {
      if (isPolling) return;
      isPolling = true;
      console.warn("SSE disconnected or failed. Falling back to HTTP constant polling.");
      
      // Perform immediate HTTP fetch
      fetchOrder();
      
      fallbackTimer = setInterval(fetchOrder, intervalMs);
    };

    // Attempt to connect via Server-Sent Events (SSE)
    const connectSSE = () => {
      try {
        const sseUrl = token
          ? `/api/orders/${orderId}/live?token=${encodeURIComponent(token)}`
          : `/api/orders/${orderId}/live`;
        eventSource = new EventSource(sseUrl);

        eventSource.addEventListener("initial", (event) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data);
            setOrder(prev => {
              if (!prev) return data;
              return {
                ...prev,
                ...data,
                items: data.items || prev.items,
                restaurant: data.restaurant || prev.restaurant,
              };
            });
            setError(null);
            setLoading(false);
          } catch (err) {
            console.error("Error parsing SSE initial data:", err);
          }
        });

        eventSource.addEventListener("update", (event) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data);
            setOrder(prev => {
              if (!prev) return data;
              return {
                ...prev,
                ...data,
                items: data.items || prev.items,
                restaurant: data.restaurant || prev.restaurant,
              };
            });
            setError(null);

            if (data.status === "CLOSED") {
              eventSource.close();
            }
          } catch (err) {
            console.error("Error parsing SSE update data:", err);
          }
        });

        eventSource.onerror = (err) => {
          console.error("SSE connection error:", err);
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          if (isMounted) {
            startFallbackPolling();
          }
        };
      } catch (err) {
        console.error("Failed to initialize EventSource:", err);
        startFallbackPolling();
      }
    };

    // Start by connecting to real-time SSE stream
    connectSSE();

    return () => {
      isMounted = false;
      if (eventSource) {
        eventSource.close();
      }
      if (fallbackTimer) {
        clearInterval(fallbackTimer);
      }
    };
  }, [orderId, intervalMs]);

  return { order, loading, error };
}
