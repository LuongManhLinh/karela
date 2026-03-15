"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Box,
  Typography,
  Select,
  MenuItem,
  InputLabel,
  Divider,
  IconButton,
  Tooltip,
} from "@mui/material";
import { RestartAlt } from "@mui/icons-material";
import { useTranslations } from "next-intl";
import {
  useWorkspaceLayoutStore,
  LayoutType,
} from "@/store/useWorkspaceLayoutStore";
import type { PanelConfig } from "./ResizablePanel";

interface LayoutSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  panelConfigs: PanelConfig[];
}

export const LayoutSettingsDialog: React.FC<LayoutSettingsDialogProps> = ({
  open,
  onClose,
  panelConfigs,
}) => {
  const t = useTranslations("workspace.WorkspacePage");
  const { layoutType, panelOrder, setLayoutType, setPanelOrder, reset } =
    useWorkspaceLayoutStore();

  // Local draft state so changes are applied on Save
  const [draftLayout, setDraftLayout] = useState<LayoutType>(layoutType);
  const [draftOrder, setDraftOrder] = useState<string[]>([...panelOrder]);

  // Reset draft when dialog opens
  React.useEffect(() => {
    if (open) {
      setDraftLayout(layoutType);
      setDraftOrder([...panelOrder]);
    }
  }, [open, layoutType, panelOrder]);

  const tabsLabels = [
    t("layoutSettings.tab", { n: 1 }),
    t("layoutSettings.tab", { n: 2 }),
    t("layoutSettings.tab", { n: 3 }),
    t("layoutSettings.tab", { n: 4 }),
  ];

  const handlePositionChange = (position: number, panelId: string) => {
    const newOrder = [...draftOrder];
    // Find where this panel currently is and swap
    const currentPos = newOrder.indexOf(panelId);
    if (currentPos !== -1 && currentPos !== position) {
      [newOrder[currentPos], newOrder[position]] = [
        newOrder[position],
        newOrder[currentPos],
      ];
    }
    setDraftOrder(newOrder);
  };

  const handleSave = () => {
    setLayoutType(draftLayout);
    setPanelOrder(draftOrder);
    onClose();
  };

  const handleReset = () => {
    reset();
    onClose();
  };

  const getPanelLabel = (panelId: string): string => {
    const cfg = panelConfigs.find((p) => p.id === panelId);
    return cfg?.title ?? panelId;
  };

  // Grid position labels
  const gridLabels = [
    t("layoutSettings.topLeft"),
    t("layoutSettings.topRight"),
    t("layoutSettings.bottomLeft"),
    t("layoutSettings.bottomRight"),
  ];

  const stackedLabels = [
    t("layoutSettings.position", { n: 1 }),
    t("layoutSettings.position", { n: 2 }),
    t("layoutSettings.position", { n: 3 }),
    t("layoutSettings.position", { n: 4 }),
  ];

  const positionLabels =
    draftLayout === "grid"
      ? gridLabels
      : draftLayout === "tabs"
        ? tabsLabels
        : stackedLabels;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {t("layoutSettings.title")}
        <Box sx={{ flexGrow: 1 }} />
        <Tooltip title={t("layoutSettings.resetToDefault")}>
          <IconButton size="small" onClick={handleReset}>
            <RestartAlt fontSize="small" />
          </IconButton>
        </Tooltip>
      </DialogTitle>

      <DialogContent dividers>
        {/* Layout type selector */}
        <FormControl component="fieldset" sx={{ mb: 3 }}>
          <FormLabel component="legend">
            {t("layoutSettings.layoutType")}
          </FormLabel>
          <RadioGroup
            row
            value={draftLayout}
            onChange={(e) => setDraftLayout(e.target.value as LayoutType)}
          >
            <FormControlLabel
              value="tabs"
              control={<Radio size="small" />}
              label={t("layoutSettings.tabs")}
            />
            <FormControlLabel
              value="stacked"
              control={<Radio size="small" />}
              label={t("layoutSettings.stacked")}
            />
            <FormControlLabel
              value="grid"
              control={<Radio size="small" />}
              label={t("layoutSettings.grid")}
            />
          </RadioGroup>
        </FormControl>

        {/* Layout preview */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="caption" color="text.secondary" gutterBottom>
            {t("layoutSettings.preview")}
          </Typography>
          {draftLayout === "stacked" ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 0.5,
                mt: 1,
              }}
            >
              {draftOrder.map((id, i) => (
                <Box
                  key={id}
                  sx={{
                    bgcolor: "action.hover",
                    borderRadius: 1,
                    px: 1.5,
                    py: 0.75,
                    textAlign: "center",
                    border: 1,
                    borderColor: "divider",
                  }}
                >
                  <Typography variant="caption">{getPanelLabel(id)}</Typography>
                </Box>
              ))}
            </Box>
          ) : draftLayout === "grid" ? (
            <Box sx={{ mt: 1 }}>
              {[0, 1].map((row) => (
                <Box
                  key={row}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 0.5,
                    mb: 0.5,
                  }}
                >
                  {[0, 1].map((col) => {
                    const idx = row * 2 + col;
                    const id = draftOrder[idx];
                    return (
                      <Box
                        key={id}
                        sx={{
                          bgcolor: "action.hover",
                          borderRadius: 1,
                          px: 1.5,
                          py: 1.5,
                          textAlign: "center",
                          border: 1,
                          borderColor: "divider",
                        }}
                      >
                        <Typography variant="caption">
                          {getPanelLabel(id)}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              ))}
            </Box>
          ) : (
            <Box
              sx={{
                display: "flex",
                gap: 0.5,
                mt: 1,
                overflowX: "auto",
              }}
            >
              {draftOrder.map((id) => (
                <Box
                  key={id}
                  sx={{
                    bgcolor: "action.hover",
                    borderRadius: 1,
                    px: 1.5,
                    py: 0.75,
                    textAlign: "center",
                    border: 1,
                    borderColor: "divider",
                    whiteSpace: "nowrap",
                  }}
                >
                  <Typography variant="caption">{getPanelLabel(id)}</Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Position assignments */}
        <Typography variant="subtitle2" sx={{ mb: 2 }}>
          {t("layoutSettings.panelPositions")}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t("layoutSettings.panelPositionsHint")}
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {positionLabels.map((label, idx) => (
            <FormControl key={idx} size="small" fullWidth>
              <InputLabel>{label}</InputLabel>
              <Select
                label={label}
                value={draftOrder[idx] || ""}
                onChange={(e) =>
                  handlePositionChange(idx, e.target.value as string)
                }
              >
                {panelConfigs.map((cfg) => (
                  <MenuItem key={cfg.id} value={cfg.id}>
                    {cfg.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ))}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>{t("layoutSettings.cancel")}</Button>
        <Button variant="contained" onClick={handleSave}>
          {t("layoutSettings.apply")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LayoutSettingsDialog;
