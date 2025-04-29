import React from "react";
import { Paper, Grid, TextField, IconButton, FormControl, InputLabel, Select, MenuItem, InputAdornment, Tooltip, Button } from "@mui/material";
import { AddCircleOutline, DeleteOutline } from "@mui/icons-material";
import { Transition, State } from "../../hooks/useFsm";

interface Props {
  state: State;
  states: Record<string, State>;
  onAdd: () => void;
  onUpdate: (tid: string, updates: Partial<Transition>) => void;
  onDelete: (tid: string) => void;
}

export const ChoicesEditor: React.FC<Props> = ({ state, states, onAdd, onUpdate, onDelete }) => (
  <>
    <Button size="small" startIcon={<AddCircleOutline />} disabled={state.isEndState} onClick={onAdd} className="mb-2">
      Add Choice
    </Button>
    {state.isEndState && <p className="italic text-sm text-red-500 mb-2">End chapters cannot have choices</p>}
    {state.transitions.map((t) => (
      <Paper key={t.id} className="p-2 mb-3" variant="outlined">
        <Grid container spacing={2} alignItems="center">
          <Grid size={{xs: 12, md: 4}}>
            <TextField
              label="Choice text"
              value={t.choiceText}
              onChange={(e) => onUpdate(t.id, { choiceText: e.target.value })}
              fullWidth
              variant="standard"
            />
          </Grid>
          <Grid size={{xs: 12, md: 4}}>
            <FormControl fullWidth variant="standard">
              <InputLabel>Target</InputLabel>
              <Select
                value={t.targetStateId}
                onChange={(e) => onUpdate(t.id, { targetStateId: e.target.value })}
              >
                <MenuItem value="" disabled>
                  <em>Select…</em>
                </MenuItem>
                {Object.values(states)
                  .filter((s) => s.id !== state.id)
                  .map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{xs: 10, md: 3}}>
            <TextField
              label="Price (sats)"
              type="number"
              value={t.price ?? 0}
              onChange={(e) => onUpdate(t.id, { price: Number(e.target.value) })}
              variant="standard"
              InputProps={{
                startAdornment: <InputAdornment position="start">₿</InputAdornment>,
              }}
              fullWidth
            />
          </Grid>
          <Grid size={{xs: 2, md: 1}} className="flex justify-end">
            <Tooltip title="Delete choice">
              <IconButton size="small" onClick={() => onDelete(t.id)}>
                <DeleteOutline fontSize="small" />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      </Paper>
    ))}
  </>
);