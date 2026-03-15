"use client";

import React, {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { Box, Chip, Tooltip, IconButton, Tabs, Tab } from "@mui/material";
import { Settings } from "@mui/icons-material";
import { ResizableBox } from "react-resizable";

import { scrollBarSx } from "@/constants/scrollBarSx";
import { ResizablePanel, PanelConfig } from "./ResizablePanel";
import { LayoutSettingsDialog } from "./LayoutSettingsDialog";
import { useWorkspaceLayoutStore } from "@/store/useWorkspaceLayoutStore";

interface PanelState {
  isOpen: boolean;
  height: number;
}

interface PanelManagerProps {
  panels: {
    config: PanelConfig;
    content: React.ReactNode;
  }[];
}

export const PanelManager: React.FC<PanelManagerProps> = ({ panels }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(800);

  // Measure available width so ResizableBox can work in px
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Layout store
  const {
    layoutType,
    panelOrder,
    rowHeights,
    columnRatios,
    setRowHeight,
    setColumnRatio,
  } = useWorkspaceLayoutStore();

  const [settingsOpen, setSettingsOpen] = useState(false);

  // Panel open / maximized states
  const [panelStates, setPanelStates] = useState<Record<string, PanelState>>(
    () => {
      const initial: Record<string, PanelState> = {};
      panels.forEach((panel) => {
        initial[panel.config.id] = {
          isOpen: panel.config.defaultOpen ?? true,
          height: panel.config.defaultHeight ?? 250,
        };
      });
      return initial;
    },
  );

  const [maximizedPanelId, setMaximizedPanelId] = useState<string | null>(null);
  const [activeTabPanelId, setActiveTabPanelId] = useState<string | null>(null);

  const handleTogglePanel = useCallback(
    (panelId: string) => {
      setPanelStates((prev) => ({
        ...prev,
        [panelId]: { ...prev[panelId], isOpen: !prev[panelId].isOpen },
      }));
      if (maximizedPanelId === panelId) setMaximizedPanelId(null);
    },
    [maximizedPanelId],
  );

  const handleToggleMaximize = useCallback((panelId: string) => {
    setMaximizedPanelId((prev) => (prev === panelId ? null : panelId));
  }, []);

  // Build ordered panel list
  const orderedPanels = useMemo(() => {
    const map = new Map(panels.map((p) => [p.config.id, p]));
    return panelOrder.map((id) => map.get(id)).filter(Boolean) as typeof panels;
  }, [panels, panelOrder]);

  const openPanels = useMemo(
    () => orderedPanels.filter((p) => panelStates[p.config.id]?.isOpen),
    [orderedPanels, panelStates],
  );

  useEffect(() => {
    if (openPanels.length === 0) {
      setActiveTabPanelId(null);
      return;
    }

    const hasActive = openPanels.some((p) => p.config.id === activeTabPanelId);
    if (!hasActive) {
      setActiveTabPanelId(openPanels[0].config.id);
    }
  }, [openPanels, activeTabPanelId]);

  const closedPanels = useMemo(
    () => orderedPanels.filter((p) => !panelStates[p.config.id]?.isOpen),
    [orderedPanels, panelStates],
  );

  const allConfigs = useMemo(() => panels.map((p) => p.config), [panels]);

  const activePanel = useMemo(
    () => openPanels.find((p) => p.config.id === activeTabPanelId) ?? null,
    [openPanels, activeTabPanelId],
  );

  /* ---- helpers to render a single panel ---- */
  const renderPanel = useCallback(
    (panel: (typeof panels)[number], opts?: { height?: number }) => (
      <ResizablePanel
        key={panel.config.id}
        config={panel.config}
        isOpen={panelStates[panel.config.id]?.isOpen ?? true}
        onClose={() => handleTogglePanel(panel.config.id)}
        isMaximized={maximizedPanelId === panel.config.id}
        onToggleMaximize={() => handleToggleMaximize(panel.config.id)}
        height={opts?.height}
      >
        {panel.content}
      </ResizablePanel>
    ),
    [panelStates, maximizedPanelId, handleTogglePanel, handleToggleMaximize],
  );

  /* ================================================================
     STACKED LAYOUT  – each panel is a ResizableBox that can resize
     vertically.
     ================================================================ */
  const renderStackedLayout = () => (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        p: 1,
        height: "100%",
        overflow: "auto",
        pb: 10,
        ...scrollBarSx,
      }}
    >
      {openPanels.map((panel) => {
        const h = panelStates[panel.config.id]?.height ?? 250;
        const minH = panel.config.minHeight || 200;

        return (
          <ResizableBox
            key={panel.config.id}
            width={Infinity}
            height={h}
            axis="y"
            minConstraints={[Infinity, minH]}
            // maxConstraints={[Infinity, 1200]}
            resizeHandles={["s"]}
            onResize={(_e, { size }) => {
              setPanelStates((prev) => ({
                ...prev,
                [panel.config.id]: {
                  ...prev[panel.config.id],
                  height: size.height,
                },
              }));
            }}
            handle={
              <Box
                sx={{
                  height: 6,
                  cursor: "ns-resize",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  "&:hover": { bgcolor: "action.hover" },
                }}
              />
            }
          >
            <Box sx={{ height: "100%" }}>{renderPanel(panel)}</Box>
          </ResizableBox>
        );
      })}
    </Box>
  );

  /* ================================================================
     GRID LAYOUT  –  2 × 2 grid.
     Rows resize vertically (react-resizable on the row container).
     Within each row the left column resizes horizontally.
     ================================================================ */
  const renderGridLayout = () => {
    // Build rows of two
    type PanelItem = (typeof panels)[number];
    const rows: PanelItem[][] = [];
    for (let i = 0; i < openPanels.length; i += 2) {
      rows.push(openPanels.slice(i, i + 2));
    }

    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          p: 1,
          pb: 10,
          height: "100%",
          overflow: "auto",
          ...scrollBarSx,
        }}
      >
        {rows.map((row, rowIdx) => {
          const rh = rowHeights[rowIdx] ?? 300;
          const minH = Math.max(...row.map((p) => p.config.minHeight || 100));

          if (row.length === 1) {
            // Single panel row — full width, resizable vertically
            return (
              <ResizableBox
                key={`row-${rowIdx}`}
                width={Infinity}
                height={rh}
                axis="y"
                minConstraints={[Infinity, minH]}
                maxConstraints={[Infinity, 1200]}
                resizeHandles={["s"]}
                onResize={(_e, { size }) => setRowHeight(rowIdx, size.height)}
                handle={
                  <Box
                    sx={{
                      height: 6,
                      cursor: "ns-resize",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      "&:hover": { bgcolor: "action.hover" },
                    }}
                  />
                }
              >
                <Box sx={{ height: "100%", px: 0.5 }}>
                  {renderPanel(row[0])}
                </Box>
              </ResizableBox>
            );
          }

          // Two-panel row
          const ratio = columnRatios[rowIdx] ?? 0.5;
          const leftW = Math.round(containerWidth * ratio) - 8; // 8 px for gap
          const MIN_COL_W = Math.round(containerWidth * 0.2);
          const MAX_COL_W = Math.round(containerWidth * 0.8);

          return (
            <ResizableBox
              key={`row-${rowIdx}`}
              width={Infinity}
              height={rh}
              axis="y"
              minConstraints={[Infinity, minH]}
              maxConstraints={[Infinity, 1200]}
              resizeHandles={["s"]}
              onResize={(_e, { size }) => setRowHeight(rowIdx, size.height)}
              handle={
                <Box
                  sx={{
                    height: 6,
                    cursor: "ns-resize",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    "&:hover": { bgcolor: "action.hover" },
                  }}
                />
              }
            >
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  height: "100%",
                  overflow: "hidden",
                }}
              >
                {/* Left column — horizontally resizable */}
                <ResizableBox
                  width={leftW}
                  height={Infinity}
                  axis="x"
                  minConstraints={[MIN_COL_W, Infinity]}
                  maxConstraints={[MAX_COL_W, Infinity]}
                  resizeHandles={["e"]}
                  onResize={(_e, { size }) => {
                    const newRatio = (size.width + 4) / containerWidth;
                    setColumnRatio(rowIdx, newRatio);
                  }}
                  handle={
                    <Box
                      sx={{
                        width: 6,
                        cursor: "ew-resize",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        flexShrink: 0,
                        "&:hover": { bgcolor: "action.hover" },
                      }}
                    />
                  }
                >
                  <Box sx={{ height: "100%", overflow: "hidden" }}>
                    {renderPanel(row[0])}
                  </Box>
                </ResizableBox>

                {/* Right column — takes the rest */}
                <Box sx={{ flex: 1, overflow: "hidden", minWidth: 0 }}>
                  {renderPanel(row[1])}
                </Box>
              </Box>
            </ResizableBox>
          );
        })}
      </Box>
    );
  };

  const renderTabsLayout = () => (
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
        sx={{ borderBottom: 1, borderColor: "divider", px: 1, flexShrink: 0 }}
      >
        {openPanels.map((panel) => (
          <Tab
            key={panel.config.id}
            value={panel.config.id}
            label={panel.config.title}
          />
        ))}
      </Tabs>

      <Box sx={{ flex: 1, minHeight: 0, p: 1, overflow: "hidden" }}>
        {activePanel ? renderPanel(activePanel) : null}
      </Box>
    </Box>
  );

  /* ================================================================
     RENDER
     ================================================================ */
  return (
    <Box
      ref={containerRef}
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* Top toolbar: closed panels + settings button */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 1,
          p: 1,
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
          flexShrink: 0,
        }}
      >
        {closedPanels.map((panel) => (
          <Tooltip key={panel.config.id} title={`Open ${panel.config.title}`}>
            <Chip
              icon={<>{panel.config.icon}</>}
              label={panel.config.title}
              onClick={() => {
                handleTogglePanel(panel.config.id);
                setActiveTabPanelId(panel.config.id);
              }}
              variant="outlined"
              size="small"
              sx={{ cursor: "pointer", "&:hover": { bgcolor: "action.hover" } }}
            />
          </Tooltip>
        ))}

        <Box sx={{ flexGrow: 1 }} />

        <Tooltip title="Layout settings">
          <IconButton size="small" onClick={() => setSettingsOpen(true)}>
            <Settings fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Panel area */}
      <Box sx={{ flex: 1, overflow: "hidden" }}>
        {maximizedPanelId
          ? panels
              .filter((p) => p.config.id === maximizedPanelId)
              .map((panel) => (
                <Box key={panel.config.id} sx={{ height: "100%" }}>
                  <ResizablePanel
                    config={panel.config}
                    isOpen
                    onClose={() => handleTogglePanel(panel.config.id)}
                    isMaximized
                    onToggleMaximize={() =>
                      handleToggleMaximize(panel.config.id)
                    }
                  >
                    {panel.content}
                  </ResizablePanel>
                </Box>
              ))
          : layoutType === "grid"
            ? renderGridLayout()
            : layoutType === "stacked"
              ? renderStackedLayout()
              : renderTabsLayout()}
      </Box>

      {/* Settings dialog */}
      <LayoutSettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        panelConfigs={allConfigs}
      />
    </Box>
  );
};

export default PanelManager;
