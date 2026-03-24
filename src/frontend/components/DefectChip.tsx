import FmdBadOutlinedIcon from "@mui/icons-material/FmdBadOutlined";
import { Chip } from "@mui/material";
import { useTranslations } from "next-intl";
import type { MouseEventHandler } from "react";

interface DefectChipProps {
  defectKey: string;
  showKeyText?: boolean;
  onClick?: MouseEventHandler<HTMLDivElement>;
}

const DefectChip: React.FC<DefectChipProps> = ({
  defectKey,
  showKeyText = true,
  onClick,
}) => {
  const t = useTranslations("analysis.DefectChip");
  return (
    <Chip
      label={showKeyText ? `${t("key")}: ${defectKey}` : defectKey}
      size="small"
      icon={<FmdBadOutlinedIcon color="warning" />}
      onClick={onClick}
      clickable={Boolean(onClick)}
    />
  );
};

export default DefectChip;
