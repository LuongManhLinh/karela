import { useEffect } from "react";
import { useWebSocketContext } from "@/providers/WebSocketProvider";

export const useSubscription = (
  topic: string | null | undefined,
  onMessage: (data: any) => void
) => {
  const { subscribe, unsubscribe } = useWebSocketContext();

  useEffect(() => {
    if (!topic) return;

    subscribe(topic, onMessage);

    return () => {
      unsubscribe(topic, onMessage);
    };
  }, [topic, subscribe, unsubscribe, onMessage]);
};
