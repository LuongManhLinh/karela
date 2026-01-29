"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  Box,
  Paper,
  CircularProgress,
  Typography,
  Button,
  Switch,
  Tooltip,
  IconButton,
} from "@mui/material";
import { Info as InfoIcon, Try as TryIcon } from "@mui/icons-material";
import { useTranslations } from "next-intl";
import { defineGherkinMode } from "@/utils/ace-gherkin-mode";
import { defineCustomThemes } from "@/utils/ace-themes";
import {
  getGherkinEditorTheme,
  setGherkinEditorTheme,
} from "@/utils/editorThemeUtils";
import { ACChatPopover } from "./AcChatPopover";
import { scrollBarSx } from "@/constants/scrollBarSx";
import { useWebSocketContext } from "@/providers/WebSocketProvider";
import { LintError } from "@/utils/gherkinLinter";
import { lintGherkinAction } from "@/app/actions";

// Dynamic import of React Ace avoiding SSR issues
const AceEditor = dynamic(
  async () => {
    const ace = await import("react-ace");
    await import("ace-builds/src-noconflict/ace");
    await import("ace-builds/src-noconflict/ext-language_tools");
    await import("ace-builds/src-noconflict/theme-monokai");
    await import("ace-builds/src-noconflict/theme-github");
    await import("ace-builds/src-noconflict/theme-tomorrow");
    await import("ace-builds/src-noconflict/theme-solarized_dark");
    await import("ace-builds/src-noconflict/theme-solarized_light");
    await import("ace-builds/src-noconflict/theme-twilight");
    // Define custom mode and themes
    defineGherkinMode();
    defineCustomThemes();
    return ace;
  },
  {
    ssr: false,
    loading: () => (
      <Box display="flex" justifyContent="center" p={2}>
        <CircularProgress size={24} />
      </Box>
    ),
  },
) as any;

interface GherkinEditorWrapperProps {
  acId: string;
  initialValue: string;
  readOnly?: boolean;
  onSave?: (gherkin: string) => void;
  onSendFeedback?: (gherkin: string, feedback: string) => Promise<void>;
}

interface LintAnnotation {
  row: number;
  text: string;
  type: "error" | "warning" | "info";
}

// Local type for our parsed suggestion
interface ParsedSuggestion {
  type: "CREATE" | "UPDATE" | "DELETE"; // Visual type
  originalContent?: string;
  newContent: string;
  range?: {
    start: { row: number; column: number };
    end: { row: number; column: number };
  };
  explanation?: string; // Optional
}

const GherkinEditorWrapper: React.FC<GherkinEditorWrapperProps> = ({
  acId,
  initialValue,
  readOnly = false,
  onSave,
  onSendFeedback,
}) => {
  const [suggestion, setSuggestion] = useState<ParsedSuggestion | null>(null);
  const [annotations, setAnnotations] = useState<LintAnnotation[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [sendingFeedback, setSendingFeedback] = useState(false);
  const [saving, setSaving] = useState(false);
  const t = useTranslations("ac.GherkinEditorWrapper");

  const chatButtonRef = useRef<HTMLButtonElement>(null);
  const { subscribe, unsubscribe, send } = useWebSocketContext();

  const editorInstanceRef = useRef<any>(null);
  const [value, setValue] = useState(initialValue);

  const [markers, setMarkers] = useState<any[]>([]);
  const [popupPos, setPopupPos] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [editorTheme, setEditorTheme] = useState(getGherkinEditorTheme());
  const [aiSuggestionEnabled, setAiSuggestionEnabled] = useState(false);

  const isInternalChangeRef = useRef(false);

  const parseSuggestionRaw = (rawText: string): ParsedSuggestion | null => {
    // 1. Check for SEARCH/REPLACE
    if (rawText.includes("<<<<<<< SEARCH")) {
      const searchMatch = rawText.match(
        /<<<<<<< SEARCH\s*([\s\S]*?)\s*=======\s*([\s\S]*?)>>>>>>> REPLACE/,
      );
      if (searchMatch) {
        const original = searchMatch[1]; // Keep newlines, but maybe trim edges if needed?
        const replacement = searchMatch[2];

        // Determine type
        // If replacement is empty -> DELETE
        // If original is empty -> CREATE (unlikely in this block, but possible)
        // Else -> UPDATE
        let type: "CREATE" | "UPDATE" | "DELETE" = "UPDATE";
        if (!replacement.trim()) type = "DELETE";
        else if (!original.trim()) type = "CREATE";

        // Find range in editor?
        // We'll do finding in useEffect when we set the suggestion.
        return {
          type,
          originalContent: original,
          newContent: replacement,
          explanation: "Provided change via SEARCH/REPLACE format.",
        };
      }
    }

    // 2. Check for FIM
    if (rawText.includes("<MID>")) {
      // We expect: <PRE> ... <SUF> ... <MID> [Suggestion]
      // Or just [Suggestion] if it forgot specific tags, but prompt said "Format 2".
      const parts = rawText.split("<MID>");
      if (parts.length >= 2) {
        const suggestionText = parts[1]; // Take everything after <MID>
        // Remove </MID> if AI hallucinated it
        const cleanSuggestion = suggestionText.replace("</MID>", "");

        return {
          type: "CREATE",
          newContent: cleanSuggestion,
          explanation: "Suggested content to insert at cursor via FIM.",
        };
      }
    }

    return null;
  };

  const handleSuggestionResponse = useCallback((response: any) => {
    console.log("AI suggestion response received:", response);
    if (response) {
      console.log("Received AI suggestion response:", response);
      const parsed = parseSuggestionRaw(response);
      console.log("Parsed suggestion:", parsed);
      if (parsed) {
        setSuggestion(parsed);
      }
    } else {
      console.warn("Invalid AI suggestion response:", response);
    }
  }, []);

  useEffect(() => {
    const topic = `suggestions:${acId}`;
    subscribe(topic, handleSuggestionResponse);
    return () => unsubscribe(topic, handleSuggestionResponse);
  }, [acId, subscribe, unsubscribe, handleSuggestionResponse]);

  const fetchSuggestions = useCallback(
    async (content: string, line: number, col: number) => {
      send({
        action: "request_suggestion",
        ac_id: acId,
        content: content,
        cursor_line: line,
        cursor_column: col,
        request_id: Date.now().toString(),
      });
    },
    [send, acId],
  );

  const clearSuggestions = useCallback(async () => setSuggestion(null), []);

  const lintContent = useCallback(async (content: string) => {
    const errors = await lintGherkinAction(content);
    const newAnnotations: LintAnnotation[] = errors.map((err: LintError) => ({
      row: err.line - 1,
      text: err.message,
      type: "error",
    }));
    setAnnotations(newAnnotations);
  }, []);

  useEffect(() => {
    if (initialValue !== value) {
      setValue(initialValue);
    }
  }, [initialValue]);

  // Debounce logic for linting - 500ms for snappier feel
  useEffect(() => {
    const handler = setTimeout(() => {
      lintContent(value);
    }, 500);
    return () => clearTimeout(handler);
  }, [value, lintContent]);

  const handleChange = (newValue: string) => {
    setValue(newValue);
    if (!isInternalChangeRef.current) {
      clearSuggestions();
    }
    isInternalChangeRef.current = false;
  };

  const changed = useRef(false);
  useEffect(() => {
    const isChanged = async () => initialValue !== value;
    isChanged().then((res) => {
      changed.current = res;
    });
  }, [value, initialValue]);

  // Locate suggestion and create markers
  useEffect(() => {
    if (!suggestion || !editorInstanceRef.current) {
      setMarkers([]);
      setPopupPos(null);
      return;
    }

    const editor = editorInstanceRef.current;
    const session = editor.session;
    const doc = session.getDocument();

    let startRow = 0,
      startCol = 0,
      endRow = 0,
      endCol = 0;

    if (suggestion.type === "CREATE") {
      // Input at cursor usually, for FIM
      // Or if we have originalContent as empty (rare)
      // For FIM we use cursor position
      const cursor = editor.getCursorPosition();
      startRow = cursor.row;
      startCol = cursor.column;
      endRow = cursor.row;
      endCol = cursor.column;
    } else {
      // SEARCH/REPLACE - Find text
      if (suggestion.originalContent) {
        // Try to find the exact text
        // We need to match newlines carefully.
        // Ace's text might have different newlines (\r\n vs \n).
        // We'll normalize? Ace `getValue()` return strings.
        const text = editor.getValue();

        // Normalize newlines for search?
        // Ideally the AI returns exact copy from the file content provided.
        // But indentation might be tricky.
        // Simple indexOf first.
        const idx = text.indexOf(suggestion.originalContent);

        if (idx !== -1) {
          // Found it. Convert index to Position.
          const startPos = doc.indexToPosition(idx);
          const endPos = doc.indexToPosition(
            idx + suggestion.originalContent.length,
          );
          startRow = startPos.row;
          startCol = startPos.column;
          endRow = endPos.row;
          endCol = endPos.column;

          // Update suggestion range
          setSuggestion((prev) =>
            prev
              ? {
                  ...prev,
                  range: {
                    start: { row: startRow, column: startCol },
                    end: { row: endRow, column: endCol },
                  },
                }
              : null,
          );
        } else {
          console.warn(
            "Could not find original content in editor:",
            suggestion.originalContent,
          );
          // Fallback: don't show marker or show error?
          return;
        }
      }
    }

    // Create Markers
    const newMarkers: any[] = [];
    const markerClass =
      suggestion.type === "CREATE"
        ? "marker-create"
        : suggestion.type === "DELETE"
          ? "marker-delete"
          : "marker-update";

    newMarkers.push({
      startRow: startRow,
      startCol: startCol,
      endRow: endRow,
      endCol: endCol,
      className: markerClass,
      type: "text",
      inFront: false,
    });

    // Popup Position
    const coords = editor.renderer.textToScreenCoordinates(startRow, startCol);
    setPopupPos({ top: coords.pageY + 20, left: coords.pageX });
    setMarkers(newMarkers);
  }, [suggestion?.originalContent, suggestion?.newContent, suggestion?.type]); // Dependencies

  // Custom commands
  useEffect(() => {
    if (editorInstanceRef.current && suggestion) {
      const editor = editorInstanceRef.current;

      const applySuggestion = () => {
        isInternalChangeRef.current = true;

        if (suggestion.type === "CREATE") {
          // Insert at cursor
          const cursor = editor.getCursorPosition();
          editor.session.insert(cursor, suggestion.newContent);
          // Update ref so we can dismiss/undo if needed (simple undo usually works via Ctrl+Z, but for Dismiss command...)
          // Implementing "Dismiss" for inserted text is tricky effectively without Undo.
          // We will rely on editor built-in undo for that?
          // Or track it like before.
        } else if (suggestion.range) {
          // Update/Delete
          // range is set in previous useEffect when finding text
          const range = {
            start: suggestion.range.start,
            end: suggestion.range.end,
          };
          editor.session.replace(range, suggestion.newContent);
        }

        clearSuggestions();
        setMarkers([]);
        setPopupPos(null);
      };

      const dismissSuggestion = () => {
        // Just clear
        clearSuggestions();
        setMarkers([]);
        setPopupPos(null);
      };

      editor.commands.addCommand({
        name: "applySuggestion",
        bindKey: { win: "Tab", mac: "Tab" },
        exec: () => {
          applySuggestion();
          return true;
        },
        readOnly: false,
      });

      editor.commands.addCommand({
        name: "dismissSuggestion",
        bindKey: { win: "Shift-Tab", mac: "Shift-Tab" },
        exec: () => {
          dismissSuggestion();
          return true;
        },
        readOnly: false,
      });

      return () => {
        editor.commands.removeCommand("applySuggestion");
        editor.commands.removeCommand("dismissSuggestion");
      };
    }
  }, [suggestion, clearSuggestions]);

  // AI Trigger
  useEffect(() => {
    const handler = setTimeout(() => {
      if (aiSuggestionEnabled && editorInstanceRef.current) {
        const editor = editorInstanceRef.current;
        if (editor && editor.getCursorPosition && !suggestion) {
          const cursor = editor.getCursorPosition();
          if (value.trim().length > 0) {
            fetchSuggestions(value, cursor.row + 1, cursor.column + 1);
          }
        }
      }
    }, 1500);
    return () => clearTimeout(handler);
  }, [value, aiSuggestionEnabled, fetchSuggestions, suggestion]); // Removed suggestions.length

  const handleToggleAISuggestions = (checked: boolean) => {
    if (!checked) {
      clearSuggestions();
    }
    setAiSuggestionEnabled(checked);
  };

  const handleThemeChange = (theme: string) => {
    setEditorTheme(theme);
    setGherkinEditorTheme(theme);
  };

  const hanldeChatClick = () => {
    setChatOpen(!chatOpen);
  };

  const handleSendFeedback = async (feedback: string) => {
    if (editorInstanceRef.current && onSendFeedback) {
      try {
        setSendingFeedback(true);
        await onSendFeedback(value, feedback);
        setChatOpen(false);
      } catch (error) {
        console.error("Error sending feedback:", error);
      } finally {
        setSendingFeedback(false);
      }
    }
  };

  const handleSave = async () => {
    if (editorInstanceRef.current && onSave) {
      try {
        setSaving(true);
        await onSave(value);
      } catch (error) {
        console.error("Error sending feedback:", error);
      } finally {
        setSaving(false);
      }
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: "400px",
        bgcolor: "background.paper",
        boxShadow: 1,
        borderRadius: 1,
        overflow: "hidden",
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      {/* Toolbar */}
      <Box
        sx={{
          p: 1,
          bgcolor: "background.default",
          borderBottom: "1px solid",
          borderColor: "divider",
          display: "flex",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Button
          variant="outlined"
          size="small"
          onClick={handleSave}
          startIcon={saving ? <CircularProgress size={14} /> : null}
        >
          {t("save")}{changed.current ? "*" : ""}
        </Button>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="body2" sx={{ fontWeight: "bold" }}>
            {t("theme")}:
          </Typography>
          <select
            value={editorTheme}
            onChange={(e) => handleThemeChange(e.target.value)}
            style={{
              padding: "4px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          >
            <option value="jira">{t("themes.jira")}</option>
            <option value="cucumber">{t("themes.cucumber")}</option>
            <option value="github">{t("themes.github")}</option>
            <option value="monokai">{t("themes.monokai")}</option>
            <option value="twilight">{t("themes.twilight")}</option>
            <option value="solarized_light">{t("themes.solarized_light")}</option>
            <option value="solarized_dark">{t("themes.solarized_dark")}</option>
          </select>
        </Box>

        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="body2" sx={{ fontWeight: "bold" }}>
            {t("errors")}:
          </Typography>
          <Tooltip
            title={annotations.map((a) => a.text).join("\n") || t("noErrors")}
          >
            <Box
              sx={{
                bgcolor: annotations.length > 0 ? "error.main" : "success.main",
                color: "white",
                borderRadius: 12,
                px: 1,
              }}
            >
              {annotations.length}
            </Box>
          </Tooltip>
        </Box>

        <Box display="flex" alignItems="center">
          <Typography variant="body2" sx={{ fontWeight: "bold" }}>
            {t("aiSuggestions")}:
          </Typography>
          <Switch
            checked={aiSuggestionEnabled}
            onChange={(e) => handleToggleAISuggestions(e.target.checked)}
            color="primary"
          />
        </Box>

        <Box flexGrow={1} />
        <IconButton onClick={hanldeChatClick} ref={chatButtonRef}>
          <TryIcon color="action" />
        </IconButton>
        <Tooltip title={t("aiTip")}>
          <InfoIcon color="action" />
        </Tooltip>
      </Box>

      {/* Editor Container */}
      <Box
        sx={{
          flexGrow: 1,
          position: "relative",
          "& .marker-create": {
            position: "absolute",
            backgroundColor: "rgba(76, 175, 80, 0.4) !important",
            zIndex: 5,
          },
          "& .marker-delete": {
            position: "absolute",
            backgroundColor: "rgba(244, 67, 54, 0.5) !important",
            zIndex: 5,
          },
          "& .marker-update": {
            position: "absolute",
            backgroundColor: "rgba(255, 235, 59, 0.5) !important",
            zIndex: 5,
          },
          "& .ace_gutter-layer .ace_gutter-cell.ace_error": {
            backgroundImage: "none",
            color: "red",
            fontWeight: "bold",
            "&:before": { content: "'!'", color: "red", marginRight: "2px" },
          },
        }}
      >
        <AceEditor
          onLoad={(editor: any) => {
            editorInstanceRef.current = editor;
          }}
          mode="gherkin"
          theme={editorTheme}
          name="gherkin_editor"
          value={value}
          onChange={handleChange}
          width="100%"
          height="100%"
          readOnly={readOnly}
          fontSize={14}
          showPrintMargin={false}
          showGutter={true}
          highlightActiveLine={true}
          annotations={annotations}
          markers={markers}
          setOptions={{
            enableBasicAutocompletion: true,
            enableLiveAutocompletion: true,
            enableSnippets: true,
            showLineNumbers: true,
            tabSize: 2,
            fontFamily: "'Fira Code', monospace",
          }}
          style={{
            fontFamily: "'Fira Code', 'Roboto Mono', monospace",
            opacity: readOnly ? 0.6 : 1,
            ...scrollBarSx,
          }}
        />

        {suggestion && popupPos && (
          <Paper
            elevation={4}
            sx={{
              position: "fixed",
              top: popupPos.top,
              left: popupPos.left,
              zIndex: 1300,
              p: 1,
              maxWidth: 400,
              bgcolor: "#fffde7",
              borderLeftWidth: 4,
              borderLeftStyle: "solid",
              borderLeftColor:
                suggestion.type === "CREATE"
                  ? "success.main"
                  : suggestion.type === "DELETE"
                    ? "error.main"
                    : "warning.main",
              color: "text.primary",
              borderRadius: "0 4px 4px 4px",
            }}
          >
            {(suggestion.type === "UPDATE" || suggestion.type === "CREATE") && (
              <Typography
                variant="body1"
                fontWeight="bold"
                sx={{
                  fontFamily: "monospace",
                  whiteSpace: "pre-wrap",
                  color: "#000",
                  mb: 1,
                }}
              >
                {suggestion.newContent}
              </Typography>
            )}
              {suggestion.explanation && (
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: "monospace",
                    whiteSpace: "pre-wrap",
                    color: "#000",
                  }}
                >
                  {t("reason")}: {suggestion.explanation}
                </Typography>
              )}
            <Typography
              variant="caption"
              display="block"
              sx={{ mt: 1, fontStyle: "italic" }}
            >
              {t("usageTip")}
            </Typography>
          </Paper>
        )}
      </Box>

      <ACChatPopover
        open={chatOpen}
        sending={sendingFeedback}
        anchorEl={chatButtonRef.current}
        onClose={() => setChatOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        onSendMessage={handleSendFeedback}
        title={t("regenerateAC")}
      />
    </Box>
  );
};

export default GherkinEditorWrapper;
