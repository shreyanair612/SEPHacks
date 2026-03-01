import { useState, useEffect, useCallback, useRef } from "react";
import type { StatusResponse, EventsResponse } from "../types";
import { scenarios } from "../mockData";

const POLL_INTERVAL = 3000;

interface DriftData {
  status: StatusResponse;
  events: EventsResponse;
  triggerDrift: (scenario: string) => Promise<void>;
  isLive: boolean;
}

export function useDriftPolling(): DriftData {
  const [status, setStatus] = useState<StatusResponse>(scenarios.compliant.status);
  const [events, setEvents] = useState<EventsResponse>(scenarios.compliant.events);
  const [isLive, setIsLive] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const fetchData = useCallback(async () => {
    try {
      const [statusRes, eventsRes] = await Promise.all([
        fetch("/api/status"),
        fetch("/api/events"),
      ]);
      if (!statusRes.ok || !eventsRes.ok) throw new Error("API error");
      const statusData: StatusResponse = await statusRes.json();
      const eventsData: EventsResponse = await eventsRes.json();
      setStatus(statusData);
      setEvents(eventsData);
      setIsLive(true);
    } catch {
      // Backend unavailable — keep current state
      setIsLive(false);
    }
  }, []);

  const triggerDrift = useCallback(async (scenario: string) => {
    try {
      const res = await fetch("/api/trigger-drift", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario }),
      });
      if (res.ok) {
        // Fetch updated data immediately
        await fetchData();
        return;
      }
    } catch {
      // Backend unavailable — use mock data
    }

    // Fallback to mock data
    if (scenario === "compliant") {
      setStatus({ ...scenarios.compliant.status, last_scan: new Date().toISOString() });
      setEvents(scenarios.compliant.events);
    } else {
      setStatus({ ...scenarios.critical.status, last_scan: new Date().toISOString() });
      setEvents(scenarios.critical.events);
    }
  }, [fetchData]);

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, POLL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData]);

  return { status, events, triggerDrift, isLive };
}
