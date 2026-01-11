"use client";
import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import {
  Box,
  Paper,
  CircularProgress,
  useTheme,
  Typography,
} from "@mui/material";
import { useACStore } from "@/store/useACStore";
import { defineGherkinMode } from "@/utils/ace-gherkin-mode";
import { defineCustomThemes } from "@/utils/ace-themes";

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
  }
) as any;

interface GherkinEditorWrapperProps {
  initialValue: string;
  readOnly?: boolean;
  onChange?: (value: string) => void;
}

const GherkinEditorWrapper: React.FC<GherkinEditorWrapperProps> = ({
  initialValue,
  readOnly = false,
  onChange,
}) => {
  const [value, setValue] = useState(initialValue);
  const {
    fetchSuggestions,
    clearSuggestions,
    lintContent,
    annotations,
    suggestions,
  } = useACStore();
  const theme = useTheme();
  const editorInstanceRef = useRef<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [activeSuggestion, setActiveSuggestion] = useState<any>(null);
  const [popupPos, setPopupPos] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [editorTheme, setEditorTheme] = useState("jira"); // Default theme

  // We need to track if a CREATE suggestion was just inserted to handle Dismiss
  const insertedSuggestionRef = useRef<{ range: any; text: string } | null>(
    null
  );
  // Track if change is internal to avoid clearing suggestions on AI insertion
  const isInternalChangeRef = useRef(false);

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
    if (onChange) onChange(newValue);

    // Only dismiss if the change wasn't caused by accepting/inserting a suggestion
    if (!isInternalChangeRef.current) {
      clearSuggestions();
    }
    isInternalChangeRef.current = false;
  };

  // Custom command handling
  useEffect(() => {
    if (editorInstanceRef.current && suggestions.length > 0) {
      const editor = editorInstanceRef.current;

      const applySuggestion = () => {
        isInternalChangeRef.current = true; // Mark as internal
        const s = suggestions[0];
        if (!s) return;

        if (s.type === "UPDATE") {
          const range = {
            start: {
              row: s.position.start_row - 1,
              column: s.position.start_column - 1,
            },
            end: {
              row: s.position.end_row - 1,
              column: s.position.end_column - 1,
            },
          };
          editor.session.replace(range, s.new_content);
        } else if (s.type === "DELETE") {
          const range = {
            start: {
              row: s.position.start_row - 1,
              column: s.position.start_column - 1,
            },
            end: {
              row: s.position.end_row - 1,
              column: s.position.end_column - 1,
            },
          };
          editor.session.replace(range, "");
        } else if (s.type === "CREATE") {
          insertedSuggestionRef.current = null;
        }

        clearSuggestions();
        setMarkers([]);
        setPopupPos(null);
      };

      const dismissSuggestion = () => {
        const s = suggestions[0];
        if (!s) return;

        if (s.type === "CREATE" && insertedSuggestionRef.current) {
          isInternalChangeRef.current = true;
          const range = {
            start: {
              row: s.position.start_row - 1,
              column: s.position.start_column - 1,
            },
            end: {
              row: s.position.end_row - 1,
              column: s.position.end_column - 1,
            },
          };
          if (insertedSuggestionRef.current.range) {
            editor.session.replace(namespacedRange(s), "");
          }
        }

        clearSuggestions();
        insertedSuggestionRef.current = null;
        setMarkers([]);
        setPopupPos(null);
      };

      const namespacedRange = (s: any) => ({
        start: {
          row: s.position.start_row - 1,
          column: s.position.start_column - 1,
        },
        end: { row: s.position.end_row - 1, column: s.position.end_column - 1 },
      });

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
    }
  }, [suggestions, clearSuggestions]);

  // Process Suggestions & Visuals
  useEffect(() => {
    if (!suggestions || suggestions.length === 0) {
      setMarkers([]);
      setPopupPos(null);
      setActiveSuggestion(null);
      return;
    }

    const s = suggestions[0];
    if (!s) return;
    setActiveSuggestion(s);

    const newMarkers: any[] = [];

    if (s.type === "CREATE") {
      if (!insertedSuggestionRef.current) {
        if (editorInstanceRef.current) {
          isInternalChangeRef.current = true; // Prevents clearing on insertion
          const editor = editorInstanceRef.current;
          const doc = editor.getSession().getDocument();
          const pos = {
            row: s.position.start_row - 1,
            column: s.position.start_column - 1,
          };
          doc.insert(pos, s.new_content);

          const lines = s.new_content.split("\n");
          const endRow = pos.row + lines.length - 1;
          const endCol =
            (lines.length === 1 ? pos.column : 0) +
            lines[lines.length - 1].length;

          insertedSuggestionRef.current = {
            text: s.new_content,
            range: { start: pos, end: { row: endRow, column: endCol } },
          };
        }
      }
      newMarkers.push({
        startRow: s.position.start_row - 1,
        startCol: s.position.start_column - 1,
        endRow: s.position.end_row - 1,
        endCol: s.position.end_column - 1 + s.new_content.length,
        className: "marker-create",
        type: "text",
        inFront: false,
      });
    } else if (s.type === "UPDATE") {
      newMarkers.push({
        startRow: s.position.start_row - 1,
        startCol: s.position.start_column - 1,
        endRow: s.position.end_row - 1,
        endCol: s.position.end_column - 1,
        className: "marker-update",
        type: "text",
        inFront: false,
      });

      if (editorInstanceRef.current) {
        const editor = editorInstanceRef.current;
        const coords = editor.renderer.textToScreenCoordinates(
          s.position.start_row - 1,
          s.position.start_column - 1
        );
        setPopupPos({ top: coords.pageY + 20, left: coords.pageX });
      }
    } else if (s.type === "DELETE") {
      newMarkers.push({
        startRow: s.position.start_row - 1,
        startCol: s.position.start_column - 1,
        endRow: s.position.end_row - 1,
        endCol: s.position.end_column - 1,
        className: "marker-delete",
        type: "text",
        inFront: false,
      });
    }

    setMarkers(newMarkers);
  }, [suggestions]);

  // AI Trigger
  useEffect(() => {
    const handler = setTimeout(() => {
      if (editorInstanceRef.current) {
        const editor = editorInstanceRef.current;
        if (editor && editor.getCursorPosition && !suggestions.length) {
          const cursor = editor.getCursorPosition();
          if (value.trim().length > 0) {
            fetchSuggestions(value, cursor.row + 1, cursor.column + 1);
          }
        }
      }
    }, 1500); // 1.5s pause to trigger AI
    return () => clearTimeout(handler);
  }, [value, fetchSuggestions, suggestions.length]);

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
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="body2" sx={{ fontWeight: "bold" }}>
            Theme:
          </Typography>
          <select
            value={editorTheme}
            onChange={(e) => setEditorTheme(e.target.value)}
            style={{
              padding: "4px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          >
            <option value="jira">Jira (Light)</option>
            <option value="cucumber">Cucumber (Dark)</option>
            <option value="github">GitHub</option>
            <option value="monokai">Monokai</option>
            <option value="twilight">Twilight</option>
            <option value="solarized_light">Solarized Light</option>
            <option value="solarized_dark">Solarized Dark</option>
          </select>
        </Box>

        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="body2" sx={{ fontWeight: "bold" }}>
            Errors:
          </Typography>
          <Box
            sx={{
              bgcolor: annotations.length > 0 ? "error.main" : "success.main",
              color: "white",
              borderRadius: "12px",
              px: 1,
              fontSize: "0.75rem",
              fontWeight: "bold",
              minWidth: "24px",
              textAlign: "center",
            }}
          >
            {annotations.length}
          </Box>
        </Box>

        <Box flexGrow={1} />

        <Typography variant="caption" color="text.secondary">
          Tab to Accept AI | Shift + Tab to Dismiss
        </Typography>
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
          }}
        />
        {/* Update Popup */}
        {activeSuggestion && activeSuggestion.type === "UPDATE" && popupPos && (
          <Paper
            elevation={4}
            sx={{
              position: "fixed",
              top: popupPos.top,
              left: popupPos.left,
              zIndex: 1300,
              p: 1.5,
              maxWidth: 400,
              bgcolor: "#fffde7",
              borderLeft: "4px solid #fbc02d",
              color: "text.primary",
            }}
          >
            <Typography
              variant="caption"
              sx={{ fontWeight: "bold", display: "block", color: "#f57f17" }}
            >
              SUGGESTION (Tab to Apply)
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontFamily: "monospace",
                whiteSpace: "pre-wrap",
                color: "#000",
              }}
            >
              {activeSuggestion.new_content}
            </Typography>
          </Paper>
        )}
      </Box>
    </Box>
  );
};

export default GherkinEditorWrapper;
