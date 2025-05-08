import React from "react";
import { Grid, TextField, Checkbox, FormControlLabel } from "@mui/material";
import { PlayCircleOutline, StopCircleOutlined } from "@mui/icons-material";
import { FsmState } from "@/types/fsm";

interface Props {
  state: FsmState;
  onChange: (updates: Partial<FsmState>) => void;
}

export const StateEditor: React.FC<Props> = ({ state, onChange }) => (
  <Grid container spacing={2} className="mb-4">
    <Grid size={{xs: 12, md: 6}}>
      <TextField
        label="Chapter title"
        value={state.name}
        onChange={(e) => onChange({ name: e.target.value })}
        fullWidth
      />
    </Grid>
    <Grid size={{xs: 12, md: 6}} className="flex items-center gap-4">
      <FormControlLabel
        control={<Checkbox checked={state.isStartState} icon={<PlayCircleOutline />} checkedIcon={<PlayCircleOutline className="text-green-500" />} onChange={(e) => onChange({ isStartState: e.target.checked })} />}
        label="Start"
      />
      <FormControlLabel
        control={<Checkbox checked={state.isEndState} icon={<StopCircleOutlined />} checkedIcon={<StopCircleOutlined className="text-red-500" />} onChange={(e) => onChange({ isEndState: e.target.checked })} />}
        label="End"
      />
    </Grid>
    <Grid size={{xs: 12}}>
      <TextField
        multiline
        minRows={6}
        label="Content"
        value={state.content}
        onChange={(e) => onChange({ content: e.target.value })}
        fullWidth
      />
    </Grid>
  </Grid>
);