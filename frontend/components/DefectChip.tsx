import FmdBadOutlinedIcon from "@mui/icons-material/FmdBadOutlined";
import { Chip } from "@mui/material";

interface DefectChipProps {
  defectKey: string;
}

const DefectChip: React.FC<DefectChipProps> = ({ defectKey }) => {
  return (
    <Chip
      label={defectKey}
      size="small"
      icon={<FmdBadOutlinedIcon color="warning" />}
    />
  );
};

export default DefectChip;
