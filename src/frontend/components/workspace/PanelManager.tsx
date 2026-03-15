"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Box, Tab, Tabs } from "@mui/material";

import { scrollBarSx } from "@/constants/scrollBarSx";

export interface PanelConfig {
  id: string;
  title: string;
  icon: React.ReactElement;
  defaultOpen?: boolean;
}

interface PanelManagerProps {
  panels: {
    config: PanelConfig;
    content: React.ReactNode;
  }[];
}

export const PanelManager: React.FC<PanelManagerProps> = ({ panels }) => {
  const visiblePanels = useMemo(
    () => panels.filter((p) => p.config.defaultOpen ?? true),
    [panels],
  );

  const [activeTabPanelId, setActiveTabPanelId] = useState<string | null>(
    visiblePanels[0]?.config.id ?? null,
  );

  useEffect(() => {
    if (visiblePanels.length === 0) {
      setActiveTabPanelId(null);
      return;
    }

    const hasActive = visiblePanels.some(
      (panel) => panel.config.id === activeTabPanelId,
    );

    if (!hasActive) {
      setActiveTabPanelId(visiblePanels[0].config.id);
    }
  }, [visiblePanels, activeTabPanelId]);

  const activePanel = useMemo(
    () =>
      visiblePanels.find((panel) => panel.config.id === activeTabPanelId) ??
      null,
    [visiblePanels, activeTabPanelId],
  );

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
      }}
    >
      <Tabs
        value={activeTabPanelId ?? false}
        onChange={(_e, newValue) => setActiveTabPanelId(newValue)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ borderBottom: 1, borderColor: "divider", flexShrink: 0 }}
      >
        {visiblePanels.map((panel) => (
          <Tab
            key={panel.config.id}
            value={panel.config.id}
            icon={panel.config.icon}
            iconPosition="start"
            label={panel.config.title}
          />
        ))}
      </Tabs>

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: "auto",
          p: 2,
          ...scrollBarSx,
        }}
      >
        {activePanel?.content ?? null}
      </Box>
    </Box>
  );
};

export default PanelManager;
