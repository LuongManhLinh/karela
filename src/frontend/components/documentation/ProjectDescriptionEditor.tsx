import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  CircularProgress,
} from "@mui/material";
import { useTranslations } from "next-intl";
import {
  useProjectDescriptionQuery,
  useUpdateProjectDescriptionMutation,
} from "@/hooks/queries/useConnectionQueries";
import { useNotificationContext } from "@/providers/NotificationProvider";
import { scrollBarSx } from "@/constants/scrollBarSx";

export interface ProjectDescriptionEditorProps {
  projectKey: string;
  showHelperText?: boolean;
}

export const ProjectDescriptionEditor: React.FC<
  ProjectDescriptionEditorProps
> = ({ projectKey, showHelperText = true }) => {
  const t = useTranslations("DocumentationPage");
  const { notify } = useNotificationContext();
  const [description, setDescription] = useState("");

  const { data, isLoading } = useProjectDescriptionQuery(projectKey);
  const { mutateAsync: updateDescription, isPending } =
    useUpdateProjectDescriptionMutation(projectKey);

  useEffect(() => {
    if (data?.data !== undefined) {
      setDescription(data.data || "");
    }
  }, [data?.data]);

  const handleSave = async () => {
    try {
      await updateDescription(description);
      notify(t("projectDescriptionUpdatedSuccess"), { severity: "success" });
    } catch (e: any) {
      notify(e.response?.data?.detail || t("projectDescriptionUpdateFailed"), {
        severity: "error",
      });
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" py={2}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" mb={2}>
        {t("projectDescription")}
      </Typography>
      {showHelperText && (
        <Typography variant="body2" color="text.secondary" mb={2}>
          {t("projectDescriptionHelper")}
        </Typography>
      )}
      <TextField
        fullWidth
        multiline
        minRows={3}
        maxRows={8}
        label={t("projectDescriptionLabel")}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder={t("projectDescriptionPlaceholder")}
        disabled={isPending}
        sx={{ ...scrollBarSx, mb: 2 }}
        required
      />
      <Stack direction="row" justifyContent="flex-end">
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={isPending || description === data?.data}
        >
          {isPending ? <CircularProgress size={20} /> : t("save")}
        </Button>
      </Stack>
    </Box>
  );
};
