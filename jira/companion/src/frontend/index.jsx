import React, { useEffect, useMemo, useState } from "react";
import ForgeReconciler, {
  Box,
  Button,
  Inline,
  ProgressBar,
  SectionMessage,
  SectionMessageAction,
  Stack,
  Text,
} from "@forge/react";
import { invoke } from "@forge/bridge";
import ReportPanel from "./components/ReportPanel.jsx";
import SuggestionsPanel from "./components/SuggestionsPanel.jsx";
import HistorySidebar from "./components/HistorySidebar.jsx";
import RightPanel from "./components/RightPanel.jsx";
import ActionPanel from "./components/ActionPanel.jsx";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

const App = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [hadError, setHadError] = useState(false);
  const [message, setMessage] = useState(null);
  const [report, setReport] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [history, setHistory] = useState([]);

  const fetchData = async () => {
    setIsRunning(true);
    setHadError(false);
    setMessage("Analyzing…");
    setHistory([]);
    try {
      const result = await invoke("analyzeDefect", {});
      if (!result || result.hadError) {
        throw new Error("invoke failed");
      }
      setReport(result.data.report);
      setMessage(result.data.notification);
      setSuggestions(
        (result.data.report.suggestions || []).map((text, i) => ({
          id: `s${i + 1}`,
          text,
          done: false,
        }))
      );
      if (result.data) {
        const histExamples = [];
        for (let i = 0; i < 10; i++) {
          histExamples.push({
            id: `h${i + 1}`,
            title: result.data.report.title,
            timestamp: new Date().toISOString(),
          });
        }
        setHistory(histExamples);
      }
    } catch (e) {
      setHadError(true);
      setMessage("Failed to analyze. Please try again.");
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const [sockMessage, setSockMessage] = useState("Waiting for messages...");
  const [healthCheckMessage, setHealthCheckMessage] =
    useState("Checking health...");
  const [stompClient, setStompClient] = useState(null);

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () =>
        new SockJS(
          "https://certificate-engage-shapes-treated.trycloudflare.com/ws"
        ),
      reconnectDelay: 5000, // auto-reconnect every 5 seconds
      onConnect: () => {
        console.log("✅ Connected to WebSocket");
        client.subscribe("/topic/messages", (msg) => {
          setMessage(msg.body);
        });
      },
      onStompError: (frame) => {
        console.error("❌ Broker error: " + frame.headers["message"]);
      },
    });

    client.activate();

    setStompClient(client);

    const healthUrl =
      "https://certificate-engage-shapes-treated.trycloudflare.com/health";
    const checkHealth = async () => {
      try {
        const response = await fetch(healthUrl);
        if (response.ok) {
          setHealthCheckMessage("Backend is healthy.");
        } else {
          setHealthCheckMessage("Backend health check failed.");
        }
      } catch (error) {
        setHealthCheckMessage("Backend health check error.");
      }
    };

    // Initial health check
    checkHealth();

    // 3️⃣ Clean up connection when component unmounts
    return () => {
      if (stompClient) stompClient.disconnect();
    };
  }, []);

  const toggle = (id) => {
    setSuggestions((prev) => {
      const updated = [...prev];
      const idx = updated.findIndex((item) => item.id === id);
      if (idx === -1) return prev;
      updated[idx] = { ...updated[idx], done: !updated[idx].done };
      return updated;
    });
  };

  const completeAll = () => {
    setSuggestions((prev) => prev.map((s) => ({ ...s, done: true })));
  };

  const sortedHistory = useMemo(() => {
    return [...history].sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
  }, [history]);

  return (
    <Box
      xcss={{
        width: "100%",
        height: "700px",
        padding: "space.100",
        overflow: "hidden",
      }}
    >
      <Text>{sockMessage}</Text>
      <Text>{healthCheckMessage}</Text>
      <Inline space="space.200" alignBlock="stretch" alignInline="stretch">
        <Box
          xcss={{
            width: "400px",
            height: "680px",
          }}
        >
          <Box
            xcss={{
              padding: "space.100",
              backgroundColor: "elevation.surface.raised",
              boxShadow: "elevation.shadow.raised",
              borderRadius: "border.radius",
            }}
          >
            <ActionPanel
              idleMessage={"RatSnake is idle."}
              isRunning={isRunning}
              runMessage={"Analyzing…"}
              notification={message}
            />
          </Box>

          <Box
            xcss={{
              overflow: "auto",
              height: "600px",
              marginTop: "space.200",
              paddingRight: "space.200",
              paddingBottom: "space.400",
            }}
          >
            <HistorySidebar history={sortedHistory} />
          </Box>
        </Box>

        <Box
          xcss={{
            width: "100%",
            height: "680px",
            padding: "space.600",
            overflow: "auto",
            backgroundColor: "elevation.surface.raised",
            boxShadow: "elevation.shadow.raised",
            borderRadius: "border.radius",
          }}
        >
          <Box>
            <RightPanel
              markdown={report}
              suggestions={suggestions}
              onToggle={toggle}
              onCompleteAll={completeAll}
            />
          </Box>
        </Box>
      </Inline>
    </Box>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
