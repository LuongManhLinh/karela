"use client";

import { getToken } from "@/utils/jwtUtils";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { v4 as uuidv4 } from "uuid";

interface WebSocketContextType {
  isConnected: boolean;
  subscribe: (topic: string, callback: (data: any) => void) => void;
  unsubscribe: (topic: string, callback: (data: any) => void) => void;
  send: (data: any) => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error(
      "useWebSocketContext must be used within a WebSocketProvider",
    );
  }
  return context;
};

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const subscribersRef = useRef<Map<string, Set<(data: any) => void>>>(
    new Map(),
  );
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const clientIdRef = useRef(uuidv4());

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = process.env.NEXT_PUBLIC_API_URL
      ? process.env.NEXT_PUBLIC_API_URL.replace(/^http/, "ws")
      : `${protocol}//${window.location.host}/api/v1`; // Adjust based on your API URL

    const wsUrl =
      process.env.NEXT_PUBLIC_WEBSOCKET_URL || "ws://localhost:8000/api/v1/ws";

    const ws = new WebSocket(`${wsUrl}/${clientIdRef.current}`);

    ws.onopen = () => {
      console.log("WebSocket connected");
      setIsConnected(true);

      console.log("Sending auth token over WebSocket");
      const token = getToken();
      if (token) {
        ws.send(JSON.stringify({ action: "authenticate", token }));
        console.log("Auth token sent");
      }

      // Resubscribe to existing topics
      subscribersRef.current.forEach((_, topic) => {
        console.log("DEBUG: Resubscribing to:", topic);
        ws.send(JSON.stringify({ action: "subscribe", topic }));
      });
      // Ping interval to keep connection alive if needed
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log("WebSocket message received:", message);
        if (message.type === "pong") return;

        const { topic, data } = message;
        if (topic && subscribersRef.current.has(topic)) {
          subscribersRef.current
            .get(topic)
            ?.forEach((callback) => callback(data));
        }
      } catch (err) {
        console.error("Error parsing WS message:", err);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
      wsRef.current = null;
      // Reconnect
      if (reconnectTimeoutRef.current)
        clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = setTimeout(connect, 3000);
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
      ws.close();
    };

    wsRef.current = ws;
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  const subscribe = useCallback(
    (topic: string, callback: (data: any) => void) => {
      console.log("Subscribing to topic:", topic);
      if (!subscribersRef.current.has(topic)) {
        subscribersRef.current.set(topic, new Set());
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          console.log("DEBUG: Sending subscribe action for:", topic);
          wsRef.current.send(JSON.stringify({ action: "subscribe", topic }));
        }
      }
      subscribersRef.current.get(topic)?.add(callback);
    },
    [],
  );

  const unsubscribe = useCallback(
    (topic: string, callback: (data: any) => void) => {
      const callbacks = subscribersRef.current.get(topic);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          subscribersRef.current.delete(topic);
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(
              JSON.stringify({ action: "unsubscribe", topic }),
            );
          }
        }
      }
    },
    [],
  );

  const send = useCallback((data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    } else {
      console.warn("WebSocket is not connected, cannot send message");
    }
  }, []);

  return (
    <WebSocketContext.Provider
      value={{ isConnected, subscribe, unsubscribe, send }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};
