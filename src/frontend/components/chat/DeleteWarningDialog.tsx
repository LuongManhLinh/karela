import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button
} from '@mui/material';
import { useTranslations } from "next-intl";

interface DeleteWarningDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteWarningDialog: React.FC<DeleteWarningDialogProps> = ({
  open,
  onClose,
  onConfirm
}) => {
  const t = useTranslations("chat.DeleteWarningDialog");

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{t("title")}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {t("message")}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          {t("cancel")}
        </Button>
        <Button onClick={onConfirm} color="error" variant="contained" autoFocus>
          {t("confirm")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteWarningDialog;
