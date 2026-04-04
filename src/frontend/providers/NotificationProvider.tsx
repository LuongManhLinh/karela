"use client";

import { AppSnackbar } from "@/components/AppSnackbar";
import React, { createContext, useCallback, useContext, useState } from "react";

interface NotificationOptions {
  severity?: "error" | "warning" | "info" | "success";
  duration?: number;
}

interface NotificationContextType {
  notify: (message: string, options?: NotificationOptions) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotificationContext must be used within a NotificationProvider",
    );
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState<
    "error" | "warning" | "info" | "success"
  >("info");
  const [duration, setDuration] = useState(3000);

  const notify = useCallback((msg: string, options?: NotificationOptions) => {
    setMessage(msg);
    setSeverity(options?.severity ?? "info");
    setDuration(options?.duration ?? 3000);
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      <AppSnackbar
        open={open}
        message={message}
        severity={severity}
        onClose={handleClose}
        duration={duration}
      />
    </NotificationContext.Provider>
  );
};
