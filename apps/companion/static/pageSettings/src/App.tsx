import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  Stack,
  Typography,
  Divider,
} from "@mui/material";
import { SettingsForm } from "./components/SettingsForm";
import {
  getContext,
  invokeGetSettings,
  invokeSetSettings,
} from "./services/settingsApi";
import type { ProjectSettings } from "./types";
import "./App.css";

function App() {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [settings, setSettings] = useState<ProjectSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const ctx = await getContext();
        const pid =
          ctx?.extension?.project?.id ?? ctx?.extension?.project?.key ?? null;
        if (!pid) throw new Error("Missing project context");
        setProjectId(String(pid));
        const initial = await invokeGetSettings(String(pid));
        setSettings(initial);
      } catch (e: any) {
        setMessage({ type: "error", text: e?.message ?? String(e) });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = useCallback(
    async (next: ProjectSettings) => {
      if (!projectId) return;
      setSaving(true);
      try {
        await invokeSetSettings(projectId, next);
        setSettings(next);
        setMessage({ type: "success", text: "Settings saved." });
      } catch (e: any) {
        setMessage({ type: "error", text: e?.message ?? String(e) });
      } finally {
        setSaving(false);
      }
    },
    [projectId]
  );

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
      <Stack spacing={2}>
        <Typography variant="h5">Project knowledge settings</Typography>
        <Typography variant="body2" color="text.secondary">
          Capture the core documents for the project. These will be referenced
          by the analysis UI.
        </Typography>
        <Divider />
        <SettingsForm
          value={settings ?? { enableLLM: true, coverageThreshold: 70 }}
          onChange={setSettings}
        />
        <Box>
          <Button
            variant="contained"
            color="primary"
            onClick={() => settings && handleSave(settings)}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save settings"}
          </Button>
        </Box>
      </Stack>

      <Snackbar
        open={!!message}
        autoHideDuration={4000}
        onClose={() => setMessage(null)}
      >
        <Alert
          onClose={() => setMessage(null)}
          severity={(message?.type ?? "success") as any}
          sx={{ width: "100%" }}
        >
          {message?.text ?? ""}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default App;
