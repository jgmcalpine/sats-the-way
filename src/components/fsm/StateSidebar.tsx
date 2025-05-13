import { FsmState } from '@/types/fsm';
import {
  AddCircleOutline,
  CurrencyBitcoin,
  DeleteOutline,
  PlayCircleOutline,
  StopCircleOutlined,
} from '@mui/icons-material';
import {
  Box,
  Button,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Tooltip,
} from '@mui/material';
import React from 'react';

interface Props {
  states: Record<string, FsmState>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
}

export const StateSidebar: React.FC<Props> = ({
  states,
  selectedId,
  onSelect,
  onAdd,
  onDelete,
}) => (
  <Paper elevation={2} className="p-2 h-full flex flex-col">
    <Button
      startIcon={<AddCircleOutline />}
      size="small"
      variant="contained"
      onClick={onAdd}
      className="mb-2"
    >
      Add Step
    </Button>
    <List dense className="flex-grow overflow-y-auto">
      {Object.values(states).map(s => (
        <ListItemButton key={s.id} selected={s.id === selectedId} onClick={() => onSelect(s.id)}>
          <ListItemText
            primary={
              <Box className="flex items-center gap-1">
                {s.isStartState && (
                  <PlayCircleOutline fontSize="inherit" className="text-green-500" />
                )}
                {s.isEndState && <StopCircleOutlined fontSize="inherit" className="text-red-500" />}
                {s.name}
              </Box>
            }
            secondary={`${s.transitions.length} choices`}
          />
          {s.transitions.some(t => (t.price ?? 0) > 0) && (
            <CurrencyBitcoin fontSize="small" className="text-amber-600" />
          )}
          <Tooltip title="Delete step">
            <IconButton
              size="small"
              onClick={e => {
                e.stopPropagation();
                onDelete(s.id);
              }}
            >
              <DeleteOutline fontSize="small" />
            </IconButton>
          </Tooltip>
        </ListItemButton>
      ))}
    </List>
  </Paper>
);
