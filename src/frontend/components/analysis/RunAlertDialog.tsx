import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";
import { useTranslations } from "next-intl";

interface RunAlertDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

/**
 * Dialog shown when the user attempts to run an `ALL` analysis that already exists.
 */
export const RunAlertDialog: React.FC<RunAlertDialogProps> = ({
  open,
  onClose,
  onConfirm,
}) => {
  const t = useTranslations("analysis.AnalysisItemPage");
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t("runAlertTitle") || "Run analysis"}</DialogTitle>
      <DialogContent dividers>
        <Typography>
          {t("runAlertMessage") ||
            "An 'ALL' analysis already exists for this project. Running again will create a new analysis and may duplicate results. Do you want to continue?"}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          {t("cancel") || "Cancel"}
        </Button>
        <Button color="primary" onClick={onConfirm} autoFocus>
          {t("confirm") || "Run anyway"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
