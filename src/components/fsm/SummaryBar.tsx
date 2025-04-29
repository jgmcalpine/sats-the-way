import { Box, Paper, Tooltip, Typography, Chip } from "@mui/material";
import {
  AccountTree,
  Description as IconDesc,
  PlayCircleOutline,
  CurrencyBitcoin,
} from "@mui/icons-material";

interface Props {
  stats: {
    totalStates: number;
    totalTransitions: number;
    cheapest: { cost: number } | null;
  };
  startName: string | null;
}

export const SummaryBar: React.FC<Props> = ({ stats, startName }) => {
  const { totalStates, totalTransitions, cheapest } = stats;
  return (
    <Paper
      elevation={2}
      className="p-3 mb-6 flex flex-wrap justify-center items-center gap-5 bg-white/80 backdrop-blur-sm rounded shadow text-xs md:text-sm"
    >
      <Tooltip title="Total chapters">
        <Box className="flex items-center gap-1 text-gray-600">
          <IconDesc fontSize="inherit" />
          <Typography variant="body2">Steps: {totalStates}</Typography>
        </Box>
      </Tooltip>
      <Tooltip title="Total choices">
        <Box className="flex items-center gap-1 text-gray-600">
          <AccountTree fontSize="inherit" />
          <Typography variant="body2">Forks: {totalTransitions}</Typography>
        </Box>
      </Tooltip>
      <Tooltip title="Start chapter">
        <Box className="flex items-center gap-1 text-gray-600">
          <PlayCircleOutline fontSize="inherit" color={startName ? "success" : "disabled"} />
          <Typography variant="body2" className={!startName ? "italic" : ""}>
            Start: {startName ?? "Not Set"}
          </Typography>
        </Box>
      </Tooltip>
      <Tooltip title="Cheapest cost from start to an end chapter">
        <Chip
          icon={<CurrencyBitcoin sx={{ fontSize: 16, ml: "4px" }} />}
          size="small"
          label={cheapest ? `${cheapest.cost} sats` : "No start ➜ end"}
          variant="outlined"
          className="text-xs h-5"
        />
      </Tooltip>
    </Paper>
  );
};