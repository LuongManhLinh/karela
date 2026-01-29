import { create } from "zustand";

interface WaitingMessageState {
  sessionId: string | null;
  message: string | null;

  setWaitingMessage: (sessionId: string, message: string) => void;
  resetWaitingMessage: () => void;
}

export const useWaitingMessageStore = create<WaitingMessageState>((set) => ({
  projectKey: null,
  storyKey: null,
  sessionId: null,
  message: null,

  setWaitingMessage: (sessionId, message) =>
    set(() => ({
      sessionId,
      message,
    })),

  resetWaitingMessage: () =>
    set(() => ({
      sessionId: null,
      message: null,
    })),
}));
