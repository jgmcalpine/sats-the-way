import React, { useState } from "react";
import { Box, Grid, Paper, CircularProgress, Button, Tooltip } from "@mui/material";
import { SaveAlt } from "@mui/icons-material";
import { useFsm, FsmData, State } from "@/hooks/useFsm";
import { HeaderBar } from "@/components/fsm/HeaderBar";
import { SummaryBar } from "@/components/fsm/SummaryBar";
import { StateSidebar } from "@/components/fsm/StateSidebar";
import { StateEditor } from "@/components/fsm/StateEditor";
import { ChoicesEditor } from "@/components/fsm/ChoicesEditor";

interface Props {
  initialData: FsmData;
  onSaveProgress?: (d: FsmData) => Promise<void>;
  onPublish?: (d: FsmData) => Promise<void>;
  onSaveChapter?: (s: State) => Promise<void>;
}

export const FsmBuilder: React.FC<Props> = ({ initialData, onSaveProgress, onPublish, onSaveChapter }) => {
  const fsm = useFsm(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSavingChapter, setIsSavingChapter] = useState(false);

  const handleSave = async () => {
    if (!onSaveProgress) return;
    setIsSaving(true);
    try {
      await onSaveProgress(fsm.data);
    } finally {
      setIsSaving(false);
    }
  };
  const handlePublish = async () => {
    if (!onPublish) return;
    setIsPublishing(true);
    try {
      await onPublish(fsm.data);
    } finally {
      setIsPublishing(false);
    }
  };
  const handleSaveChapter = async () => {
    if (!fsm.selectedId || !onSaveChapter) return;
    setIsSavingChapter(true);
    try {
      await onSaveChapter(fsm.data.states[fsm.selectedId]);
    } finally {
      setIsSavingChapter(false);
    }
  };

  return (
    <Box className="p-4">
      <HeaderBar
        title={fsm.data.title}
        lnurl={fsm.data.lnurl || ''}
        description={fsm.data.description || ''}
        isSaving={isSaving}
        isPublishing={isPublishing}
        onSave={handleSave}
        onPublish={handlePublish}
        setTitle={(t) => fsm.actions.updateMeta({ title: t })}
        setLNUrl={(t) => fsm.actions.updateMeta({ lnurl: t })}
        setDescription={(d) => fsm.actions.updateMeta({ description: d })}
      />
      <SummaryBar
        stats={{totalStates: fsm.totalStates, totalTransitions: fsm.totalTransitions, cheapest: fsm.cheapest}}
        startName={fsm.data.startStateId ? fsm.data.states[fsm.data.startStateId]?.name : null}
      />
      <Grid container spacing={2} className="h-[70vh]">
        <Grid size={{xs: 12, md: 4}} className="h-full">
          <StateSidebar
            states={fsm.data.states}
            selectedId={fsm.selectedId}
            onSelect={fsm.actions.selectState}
            onAdd={fsm.actions.addState}
            onDelete={fsm.actions.deleteState}
          />
        </Grid>
        <Grid size={{xs: 12, md: 8}} className="h-full">
          {fsm.selected ? (
            <Paper className="p-4 h-full overflow-y-auto" elevation={2}>
              <StateEditor
                state={fsm.selected}
                onChange={(u) => fsm.actions.updateState(fsm.selected!.id, u)}
              />
              <ChoicesEditor
                state={fsm.selected}
                states={fsm.data.states}
                onAdd={() => fsm.actions.addTransition(fsm.selected!.id)}
                onUpdate={(tid, u) => fsm.actions.updateTransition(fsm.selected!.id, tid, u)}
                onUpdateChapter={(targetId, u) => fsm.actions.updateState(targetId, u)}
                onDelete={(tid) => fsm.actions.deleteTransition(fsm.selected!.id, tid)}
              />
              {onSaveChapter && (
                <Box className="mt-4 text-right">
                  <Tooltip title="Save chapter only">
                    <span>
                      <Button
                        size="small"
                        variant="text"
                        startIcon={isSavingChapter ? <CircularProgress size={16} /> : <SaveAlt />}
                        onClick={handleSaveChapter}
                        disabled={isSavingChapter}
                      >
                        Save Chapter
                      </Button>
                    </span>
                  </Tooltip>
                </Box>
              )}
            </Paper>
          ) : (
            <Paper className="h-full flex items-center justify-center" elevation={1}>
              Select a step to edit…
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default FsmBuilder;