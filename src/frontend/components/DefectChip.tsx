import FmdBadOutlinedIcon from "@mui/icons-material/FmdBadOutlined";
import { Chip } from "@mui/material";
import { useTranslations } from "next-intl";

interface DefectChipProps {
  defectKey: string;
  showKeyText?: boolean;
}

const DefectChip: React.FC<DefectChipProps> = ({
  defectKey,
  showKeyText = true,
}) => {
  const t = useTranslations("analysis.DefectChip");
  return (
    <Chip
      label={showKeyText ? `${t("key")}: ${defectKey}` : defectKey}
      size="small"
      icon={<FmdBadOutlinedIcon color="warning" />}
    />
  );
};

export default DefectChip;
