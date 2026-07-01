import { useEffect, useRef } from "react";
import { useMailStore } from "../store/useMailStore";

export function useRealtimeEmails() {
  const addNewEmail = useMailStore((s) => s.addNewEmail);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function connect() {
      if (wsRef.current?.readyState === WebSocket.OPEN) return;

      const ws = new WebSocket("ws://localhost:8000/ws");
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === "new_email") {
            addNewEmail(message.data);
          }
        } catch (e) {}
      };

      ws.onclose = () => {
        reconnectRef.current = setTimeout(connect, 5000);
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      wsRef.current?.close();
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
    };
  }, []);

  return null;
}