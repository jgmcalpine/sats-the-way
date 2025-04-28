import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Grid,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  Divider,
  SelectChangeEvent,
  InputAdornment, // For currency symbol
  Chip, // To display counts/fees nicely
  CircularProgress, // For loading state on buttons
} from '@mui/material';
import {
  AddCircleOutline,
  DeleteOutline,
  EditNote,
  PlayCircleOutline,
  StopCircleOutlined,
  AccountTree,
  Description,
  Save, // Icon for Save
  Publish, // Icon for Publish
  CurrencyBitcoin,
  SaveAlt, // Specific icon for saving just the chapter
} from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';

// --- Type Definitions (Self-Contained) ---

interface Transition {
  id: string;
  choiceText: string;
  targetStateId: string;
  price?: number; // Optional: Cost to take this transition (defaults to free if undefined/0)
}

export interface State {
  id: string;
  name: string;
  content: string;
  isStartState: boolean;
  isEndState: boolean;
  transitions: Transition[];
  entryFee?: number; // Optional: Cost to enter/view this state (defaults to free if undefined/0)
}

export interface FsmData {
  states: Record<string, State>;
  startStateId: string | null;
}

interface FsmBuilderProps {
    initialData?: FsmData;
    bookId: string; // Explicitly require bookId for linking chapters
    authorPubkey: string; // Explicitly require authorPubkey for linking chapters
    onSaveProgress?: (data: FsmData) => Promise<void> | void;
    onPublish?: (data: FsmData) => Promise<void> | void;
    onSaveChapter?: (chapterData: State) => Promise<void> | void; // New callback
}

const createNewState = (isStart = false): State => ({
  id: uuidv4(),
  name: 'Next Step',
  content: '',
  isStartState: isStart,
  isEndState: false,
  transitions: [],
  entryFee: 0
});

// --- The Component ---

const FsmBuilder: React.FC<FsmBuilderProps> = ({
    initialData,
    bookId,
    authorPubkey,
    onSaveProgress,
    onPublish,
    onSaveChapter,
}) => {
  const [fsmData, setFsmData] = useState<FsmData>(
    initialData || { states: {}, startStateId: null }
  );
  const [selectedStateId, setSelectedStateId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingChapter, setIsSavingChapter] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    if (initialData) {
        setFsmData(initialData);
        // Reset selection or try to maintain it if possible
        if (selectedStateId && !initialData.states[selectedStateId]) {
             setSelectedStateId(null);
        } else if (!selectedStateId && initialData.startStateId) {
             // Optionally select start state if nothing is selected
             // setSelectedStateId(initialData.startStateId);
        }
    }
}, [initialData]); 

  // Memoized calculations for display
  const totalStates = useMemo(() => Object.keys(fsmData.states).length, [fsmData.states]);
  const totalTransitions = useMemo(
    () => Object.values(fsmData.states).reduce((sum, state) => sum + state.transitions.length, 0),
    [fsmData.states]
  );

  const selectedState: State | null = useMemo(() => {
    if (!selectedStateId || !fsmData.states[selectedStateId]) {
      return null;
    }
    return fsmData.states[selectedStateId];
  }, [selectedStateId, fsmData.states]);

  // --- State Management Functions ---

  const handleAddState = useCallback(() => {
    const newState = createNewState(totalStates === 0);
    setFsmData((prev) => {
      const newStates = { ...prev.states, [newState.id]: newState };
      const newStartStateId = newState.isStartState ? newState.id : prev.startStateId;
      return { states: newStates, startStateId: newStartStateId };
    });
    setSelectedStateId(newState.id);
  }, [totalStates]);

  const handleSelectState = useCallback((id: string) => {
    setSelectedStateId(id);
  }, []);

  const handleDeleteState = useCallback((idToDelete: string) => {
    if (!fsmData.states[idToDelete]) return;

    setFsmData((prev) => {
      const newStates = { ...prev.states };
      delete newStates[idToDelete];

      Object.keys(newStates).forEach((key) => {
        const state = newStates[key];
        state.transitions = state.transitions.filter(
          (transition) => transition.targetStateId !== idToDelete
        );
      });

      let newStartStateId = prev.startStateId;
      if (prev.startStateId === idToDelete) {
         newStartStateId = null;
      }

      return { states: newStates, startStateId: newStartStateId };
    });

    if (selectedStateId === idToDelete) {
      setSelectedStateId(null);
    }
  }, [fsmData.states, selectedStateId]);

  const handleUpdateState = useCallback((idToUpdate: string, updates: Partial<Omit<State, 'id'>>) => {
      setFsmData(prev => {
        if (!prev.states[idToUpdate]) return prev;

        const newStates = { ...prev.states };
        const currentState = newStates[idToUpdate];
        // Ensure fee/price are numbers or undefined
        const safeUpdates = { ...updates };
        if (safeUpdates.entryFee !== undefined) {
          safeUpdates.entryFee = Number(safeUpdates.entryFee) || 0;
        }
        if (safeUpdates.transitions) {
            safeUpdates.transitions = safeUpdates.transitions.map(t => ({
                ...t,
                price: Number(t.price) || 0
            }))
        }

        const newStateData: State = {
            ...currentState,
            ...safeUpdates,
            id: idToUpdate,
        };

        let newStartStateId = prev.startStateId;

        if (updates.isStartState === true && idToUpdate !== prev.startStateId) {
            if (prev.startStateId && newStates[prev.startStateId]) {
                newStates[prev.startStateId] = { ...newStates[prev.startStateId], isStartState: false };
            }
            newStartStateId = idToUpdate;
            newStateData.isStartState = true;
        } else if (updates.isStartState === false && idToUpdate === prev.startStateId) {
            newStartStateId = null;
            newStateData.isStartState = false;
        } else {
             newStateData.isStartState = (newStartStateId === idToUpdate);
        }

        if (updates.isEndState === true && newStateData.transitions.length > 0) {
            newStateData.transitions = [];
        }

        newStates[idToUpdate] = newStateData;
        return { states: newStates, startStateId: newStartStateId };
      });

  }, []);

  // --- Transition Management Functions ---

  const handleAddTransition = useCallback(() => {
    if (!selectedState) return;
    const newTransition: Transition = {
      id: uuidv4(),
      choiceText: 'New Choice',
      targetStateId: '',
      price: 0, // Default price to 0 (free)
    };
    handleUpdateState(selectedState.id, {
        transitions: [...selectedState.transitions, newTransition]
    });
  }, [selectedState, handleUpdateState]);

  const handleUpdateTransition = useCallback((transitionId: string, updatedTransitionData: Partial<Transition>) => {
      if (!selectedState) return;
      // Ensure price is handled correctly
      const safeUpdate = { ...updatedTransitionData };
       if (safeUpdate.price !== undefined) {
            safeUpdate.price = Number(safeUpdate.price) || 0;
            if (safeUpdate.price < 0) safeUpdate.price = 0; // Prevent negative prices
        }

      const updatedTransitions = selectedState.transitions.map((t) =>
        t.id === transitionId ? { ...t, ...safeUpdate } : t
      );
      handleUpdateState(selectedState.id, { transitions: updatedTransitions });
    },
    [selectedState, handleUpdateState]
  );

  const handleDeleteTransition = useCallback((transitionId: string) => {
    if (!selectedState) return;
    const updatedTransitions = selectedState.transitions.filter(
      (t) => t.id !== transitionId
    );
    handleUpdateState(selectedState.id, { transitions: updatedTransitions });
  }, [selectedState, handleUpdateState]);

  // --- Event Handlers with Explicit Types ---
  const handleStateNameChange = useCallback((event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (!selectedStateId) return;
      handleUpdateState(selectedStateId, { name: event.target.value });
  }, [selectedStateId, handleUpdateState]);

  const handleStateContentChange = useCallback((event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (!selectedStateId) return;
       handleUpdateState(selectedStateId, { content: event.target.value });
  }, [selectedStateId, handleUpdateState]);

  const handleStateEntryFeeChange = useCallback((event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!selectedStateId) return;
    const fee = parseFloat(event.target.value);
    handleUpdateState(selectedStateId, { entryFee: isNaN(fee) || fee < 0 ? 0 : fee });
  }, [selectedStateId, handleUpdateState]);

  const handleStartStateChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
      if (!selectedStateId) return;
       handleUpdateState(selectedStateId, { isStartState: event.target.checked });
  }, [selectedStateId, handleUpdateState]);

   const handleEndStateChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
      if (!selectedStateId) return;
       handleUpdateState(selectedStateId, { isEndState: event.target.checked });
  }, [selectedStateId, handleUpdateState]);

   const handleTransitionTextChange = useCallback((transitionId: string, event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
       handleUpdateTransition(transitionId, { choiceText: event.target.value });
   }, [handleUpdateTransition]);

    const handleTransitionPriceChange = useCallback((transitionId: string, event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const price = parseFloat(event.target.value);
        handleUpdateTransition(transitionId, { price: isNaN(price) || price < 0 ? 0 : price });
    }, [handleUpdateTransition]);

    const handleTransitionTargetChange = useCallback((transitionId: string, event: SelectChangeEvent<string>) => {
        handleUpdateTransition(transitionId, { targetStateId: event.target.value });
    }, [handleUpdateTransition]);


  // --- Save/Publish Handlers ---
  const triggerSave = useCallback(async () => {
    if (!onSaveProgress) return;
    setIsSaving(true);
    try {
        await onSaveProgress(fsmData);
        // Optionally add success feedback (e.g., snackbar)
    } catch (error) {
        console.error("Failed to save progress:", error);
        // Optionally add error feedback
    } finally {
        setIsSaving(false);
    }
  }, [onSaveProgress, fsmData]);

  const triggerPublish = useCallback(async () => {
      if (!onPublish) return;
      setIsPublishing(true);
      try {
        // Add validation checks here before publishing if needed
        // e.g., ensure there's a start state, no dangling transitions
        await onPublish(fsmData);
         // Optionally add success feedback
      } catch (error) {
          console.error("Failed to publish:", error);
           // Optionally add error feedback
      } finally {
          setIsPublishing(false);
      }
  }, [onPublish, fsmData]);

  const triggerSaveChapter = useCallback(async () => {
    if (!onSaveChapter || !selectedState) return;
    setIsSavingChapter(true);
    try {
        // Add bookId just before sending, ensuring it's up-to-date
        // Although the component doesn't *use* bookId internally for its logic,
        // the callback likely needs it associated with the State data.
        // We pass the core State object; the parent adds necessary context for Nostr.
        await onSaveChapter(selectedState);
        // Optional success feedback (e.g., snackbar)
    } catch (error) {
        console.error("Failed to save chapter:", error);
        // Optional error feedback
    } finally {
        setIsSavingChapter(false);
    }
  }, [onSaveChapter, selectedState]); 


  // Available states for transition targets
  const availableTargetStates = useMemo(() => {
    return Object.values(fsmData.states).filter(state => state.id !== selectedStateId);
  }, [fsmData.states, selectedStateId]);


  // --- Rendering ---

  return (
    <Box className="p-4 md:p-8 bg-yellow-50 text-gray-800 font-serif min-h-screen flex flex-col w-full">
        {/* Header Area */}
       <Box className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
           <Typography variant="h4" component="h1" className="font-bold tracking-wider text-gray-700 text-center sm:text-left">
              Adventure Weaver
           </Typography>
           {/* Action Buttons */}
           <Box className="flex gap-2">
               {onSaveProgress && (
                   <Tooltip title="Save current progress">
                       {/* Span needed for tooltip when button is loading/disabled */}
                       <span>
                           <Button
                               variant="outlined"
                               startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : <Save />}
                               onClick={triggerSave}
                               disabled={isSaving || isPublishing}
                               className="font-sans normal-case border-gray-400 text-gray-600 hover:bg-gray-100 disabled:opacity-70"
                               size="small"
                           >
                               Save Progress
                           </Button>
                        </span>
                   </Tooltip>
               )}
               {onPublish && (
                    <Tooltip title="Publish the completed story">
                         <span>
                            <Button
                                variant="contained"
                                startIcon={isPublishing ? <CircularProgress size={20} color="inherit" /> : <Publish />}
                                onClick={triggerPublish}
                                disabled={isSaving || isPublishing || !fsmData.startStateId} // Basic validation: need a start state
                                className="font-sans normal-case bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400"
                                size="small"
                            >
                                Publish Book
                            </Button>
                         </span>
                    </Tooltip>
               )}
           </Box>
       </Box>

      {/* Summary Bar */}
      <Paper elevation={2} className="p-3 mb-6 flex flex-wrap justify-center items-center gap-3 md:gap-5 bg-white/80 backdrop-blur-sm rounded shadow text-xs md:text-sm">
         <Tooltip title="Total number of steps/pages.">
           <Box className="flex items-center gap-1 text-gray-600">
             <Description fontSize="inherit" />
             <Typography variant="body2" component="span">Steps: {totalStates}</Typography>
           </Box>
         </Tooltip>
         <Tooltip title="Total number of choices/forks.">
          <Box className="flex items-center gap-1 text-gray-600">
            <AccountTree fontSize="inherit" />
            <Typography variant="body2" component="span">Forks: {totalTransitions}</Typography>
          </Box>
         </Tooltip>
         <Tooltip title="Designated start point.">
           <Box className="flex items-center gap-1 text-gray-600">
             <PlayCircleOutline fontSize="inherit" color={fsmData.startStateId ? 'success' : 'disabled'} />
             <Typography variant="body2" component="span" className={!fsmData.startStateId ? 'italic' : ''}>
               Start: {fsmData.startStateId ? (fsmData.states[fsmData.startStateId]?.name || 'Unnamed') : 'Not Set'}
             </Typography>
           </Box>
         </Tooltip>
         {/* Can add more summary stats here - e.g., total potential revenue */}
      </Paper>

      {/* Main Content Area */}
      <Grid container spacing={4} className="flex-grow"> {/* Allow grid to grow */}
        {/* State List / Sidebar */}
        <Grid size={{xs: 12, md: 4}}>
          <Paper elevation={3} className="p-4 h-full bg-stone-50 rounded shadow-md flex flex-col"> {/* Flex column */}
            <Box className="flex justify-between items-center mb-3 pb-2 border-b border-gray-200">
              <Tooltip title="Add a new step/page">
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AddCircleOutline />}
                  onClick={handleAddState}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-sans normal-case px-2 py-1"
                >
                  Add Step
                </Button>
              </Tooltip>
            </Box>

            {totalStates === 0 ? (
                 <Typography variant="body2" className="text-gray-500 italic text-center mt-4 px-2 flex-grow flex items-center justify-center">
                   Your story awaits! Click "Add Step" to begin.
                 </Typography>
             ) : (
              <List dense className="flex-grow overflow-y-auto pr-1 -mr-1"> {/* Take remaining space and scroll */}
                {Object.values(fsmData.states).map((state) => (
                  <ListItem
                    key={state.id}
                    disablePadding
                    className="mb-1 group" // Add group for hover effects on children
                  >
                    <Box
                         onClick={() => handleSelectState(state.id)}
                         className={`w-full flex flex-col p-2 rounded transition-colors duration-150 cursor-pointer ${
                           selectedStateId === state.id
                             ? 'bg-blue-100 shadow-inner' // Highlight selected
                             : 'hover:bg-gray-200'
                         }`}
                       >
                         {/* Top Row: Name and Delete */}
                         <Box className="flex items-center justify-between w-full mb-1">
                            <ListItemText
                              primary={
                                <Box component="span" className="flex items-center gap-1 text-sm font-medium">
                                  {state.isStartState && <PlayCircleOutline fontSize="inherit" className="text-green-600" />}
                                  {state.isEndState && <StopCircleOutlined fontSize='inherit' className="text-red-500"/>}
                                  <span className={`truncate ${selectedStateId === state.id ? 'text-blue-800 font-semibold' : 'text-gray-800'}`}>
                                      {state.name || '(Untitled Step)'}
                                  </span>
                                </Box>
                              }
                              className="font-serif flex-grow min-w-0 pr-2" // Allow text to truncate
                            />
                            <Tooltip title="Delete this step">
                                <IconButton
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteState(state.id);
                                }}
                                // Show delete more easily on hover of the list item itself
                                className={`ml-1 text-gray-400 opacity-0 group-hover:opacity-100 hover:!opacity-100 hover:text-red-500 transition-opacity ${selectedStateId === state.id ? '!opacity-100' : ''}`}
                                >
                                <DeleteOutline fontSize="small" />
                                </IconButton>
                            </Tooltip>
                         </Box>
                         {/* Bottom Row: Badges/Info */}
                         <Box className="flex items-center gap-1.5 flex-wrap">
                             {state.transitions.length > 0 && !state.isEndState && (
                                <Tooltip title={`${state.transitions.length} choice(s) from this step`}>
                                  <Chip
                                    icon={<AccountTree sx={{ fontSize: 14, marginLeft: '4px' }} />}
                                    label={state.transitions.length}
                                    size="small"
                                    variant="outlined"
                                    className="text-xs h-5 bg-gray-100 border-gray-300"
                                  />
                                </Tooltip>
                              )}
                              {(state.entryFee ?? 0) > 0 && (
                                 <Tooltip title={`Cost to enter: ₿${state.entryFee?.toFixed(2)}`}>
                                      <Chip
                                         icon={<CurrencyBitcoin sx={{ fontSize: 14, marginLeft: '4px' }}/>}
                                         label={`${state.entryFee?.toFixed(2)}`}
                                         size="small"
                                         color="success"
                                         variant="outlined"
                                         className="text-xs h-5"
                                      />
                                 </Tooltip>
                               )}
                               {state.isEndState && (
                                    <Chip label="End" size="small" color="error" variant="outlined" className="text-xs h-5" />
                               )}
                         </Box>
                    </Box>
                  </ListItem>
                ))}
              </List>
             )}
          </Paper>
        </Grid>

        {/* State Editor / Main Area */}
        <Grid size={{xs: 12, md: 8}}>
          {selectedState ? (
            <Paper elevation={3} className="p-5 md:p-6 bg-white rounded shadow-md relative h-full overflow-y-auto">
                {/* Editor Header: Title and Chapter Save Button */}
                <Box className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 pb-2 border-b border-gray-200 gap-2">
                    <Typography variant="h5" component="h3" className="font-semibold text-gray-700">
                        Editing Step: <span className="font-bold">{selectedState.name || '(Untitled Step)'}</span>
                    </Typography>
                    {onSaveChapter && ( // Only show if callback is provided
                        <Tooltip title="Save changes to just this chapter">
                            <span>
                                <Button
                                    variant="text" // Subtle button
                                    size="small"
                                    startIcon={isSavingChapter ? <CircularProgress size={16} color="inherit" /> : <SaveAlt sx={{fontSize: 18}}/>}
                                    onClick={triggerSaveChapter}
                                    disabled={isSavingChapter || isSaving || isPublishing}
                                    className="font-sans normal-case text-blue-600 hover:bg-blue-50 disabled:opacity-70 px-2 py-1"
                                >
                                    Save Chapter
                                </Button>
                            </span>
                        </Tooltip>
                    )}
                </Box>
                {/* Decorative Icon */}
                <EditNote className="absolute top-3 right-4 text-gray-300 text-4xl hidden lg:block pointer-events-none" />

              {/* Basic State Properties */}
              <Grid container spacing={3} className="mb-6">
                {/* Name and Fee */}
                <Grid size={{xs: 12, md: 7}}>
                    <TextField
                        label="Chapter title" variant="outlined" size="small" fullWidth
                        value={selectedState.name} onChange={handleStateNameChange}
                        className="font-serif"
                    />
                </Grid>
                <Grid size={{xs: 12, md: 5}}>
                  <Tooltip title="Optional cost ($) required for the user to view this step's content. Leave as 0 for free access.">
                      <TextField
                        label="Step Entry Fee (₿)" variant="outlined" size="small" fullWidth
                        type="number"
                        value={selectedState.entryFee ?? 0}
                        onChange={handleStateEntryFeeChange}
                        className="font-sans" InputLabelProps={{ className: "font-sans text-sm" }}
                      />
                  </Tooltip>
                 </Grid>
                {/* Flags */}
                <Grid size={{xs: 12}} className="flex items-center gap-2 sm:gap-4 -mt-2">
                    <Tooltip title="Mark as the starting point of the story. Only one allowed.">
                       <FormControlLabel control={ <Checkbox checked={selectedState.isStartState} onChange={handleStartStateChange} icon={<PlayCircleOutline />} checkedIcon={<PlayCircleOutline className="text-green-600"/>} size="small" /> } label={<Typography variant="body2" className="font-sans text-sm">Starting chapter</Typography>} />
                    </Tooltip>
                     <Tooltip title="Mark as a possible end point (cannot have choices).">
                       <FormControlLabel control={ <Checkbox checked={selectedState.isEndState} onChange={handleEndStateChange} icon={<StopCircleOutlined />} checkedIcon={<StopCircleOutlined className="text-red-500"/>} size="small" /> } label={<Typography variant="body2" className="font-sans text-sm">Ending chapter</Typography>} />
                    </Tooltip>
                </Grid>
                 {/* Content */}
                <Grid size={{xs: 12}}>
                  <Tooltip title="The main story text or description for this step. Write your narrative here.">
                    <TextField
                      label="Step Content / Story Text" variant="outlined" fullWidth multiline rows={8}
                      value={selectedState.content} onChange={handleStateContentChange}
                      className="font-serif bg-stone-50" InputLabelProps={{ className: "font-sans text-sm" }}
                      inputProps={{ className: 'text-base leading-relaxed tracking-wide p-3'}}
                    />
                  </Tooltip>
                </Grid>
              </Grid>

              <Divider className="my-6 border-gray-300" />

              {/* Transitions / Forks Editor */}
              <Box>
                <Box className="flex justify-between items-center mb-3 pb-2 border-b border-gray-200">
                    <Typography variant="h6" component="h4" className="font-semibold text-gray-700">
                     Choices from this Step
                    </Typography>
                     <Tooltip title={selectedState.isEndState ? "End steps cannot have choices" : "Add a new choice"}>
                       <span>
                         <Button variant="outlined" size="small" startIcon={<AddCircleOutline />} onClick={handleAddTransition} disabled={selectedState.isEndState} className="border-blue-500 text-blue-600 hover:bg-blue-50 font-sans text-xs normal-case px-2 py-1 disabled:border-gray-300 disabled:text-gray-400">
                           Add Choice
                         </Button>
                       </span>
                    </Tooltip>
                </Box>

                {selectedState.isEndState && ( <Typography variant="body2" className="text-orange-700 italic mb-4 px-1 text-sm">This is an End Step, no choices allowed.</Typography> )}
                {!selectedState.isEndState && selectedState.transitions.length === 0 && ( <Typography variant="body2" className="text-gray-500 italic mb-4 px-1 text-sm">No choices defined yet.</Typography> )}

                {!selectedState.isEndState && selectedState.transitions.map((transition, index) => (
                  <Paper key={transition.id} variant="outlined" className="p-3 mb-3 border-gray-200 bg-gray-50/50 rounded">
                    <Grid container spacing={2} alignItems="flex-start"> {/* Align items start */}
                      {/* Choice Text */}
                      <Grid size={{xs: 12, sm: 6, md: 4}}>
                         <Tooltip title="Text shown for this choice">
                           <TextField label={`Choice ${index + 1} Text`} variant="standard" fullWidth value={transition.choiceText} onChange={(e) => handleTransitionTextChange(transition.id, e)} className="font-serif" InputLabelProps={{ className: "font-sans text-sm" }} inputProps={{ className: 'text-base'}}/>
                         </Tooltip>
                      </Grid>
                      {/* Target State */}
                      <Grid size={{xs: 12, sm: 6, md: 4}}>
                        <FormControl fullWidth variant="standard" size="small">
                          <InputLabel id={`target-state-label-${transition.id}`} className='font-sans text-sm'>Leads To Step</InputLabel>
                          <Tooltip title="Select the step this choice leads to">
                             <Select labelId={`target-state-label-${transition.id}`} value={transition.targetStateId} onChange={(e) => handleTransitionTargetChange(transition.id, e)} label="Leads To Step" className="font-serif" MenuProps={{ PaperProps: { className: 'font-serif max-h-60' } }} >
                               <MenuItem value="" disabled className="italic text-gray-400"><em>Select target...</em></MenuItem>
                               {availableTargetStates.length === 0 && ( <MenuItem value="" disabled className="italic text-gray-400"><em>No other steps available</em></MenuItem> )}
                               {availableTargetStates.map(state => ( <MenuItem key={state.id} value={state.id} className="font-serif text-sm"> {state.name || '(Untitled Step)'} {state.isEndState ? '(End)' : ''} {(state.entryFee ?? 0) > 0 ? ` ($${state.entryFee?.toFixed(2)})` : ''} </MenuItem> ))}
                             </Select>
                           </Tooltip>
                        </FormControl>
                      </Grid>
                      {/* Price & Delete */}
                       <Grid size={{xs: 12, md: 4}}>
                         <Box className="flex items-start justify-between gap-2 pt-1">
                            <Tooltip title="Cost ($) for the user to select this specific choice. Leave as 0 for free.">
                                <TextField
                                    label="Choice Price" variant="standard" size="small"
                                    type="number"
                                    value={transition.price ?? 0}
                                    onChange={(e) => handleTransitionPriceChange(transition.id, e)}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start"><span className='text-sm text-gray-500'>$</span></InputAdornment>,
                                        inputProps: { min: 0, step: 0.01, className: 'text-sm py-1' }
                                    }}
                                    className="font-sans w-24" // Limit width
                                    InputLabelProps={{ className: "font-sans text-sm" }}
                                />
                            </Tooltip>
                            <Tooltip title="Delete this choice">
                               <IconButton aria-label="delete transition" size="small" onClick={() => handleDeleteTransition(transition.id)} className="text-red-400 hover:text-red-600 mt-1">
                                 <DeleteOutline fontSize="small" />
                               </IconButton>
                            </Tooltip>
                         </Box>
                       </Grid>
                    </Grid>
                  </Paper>
                ))}
              </Box>

            </Paper>
          ) : (
            <Paper elevation={3} className="p-10 h-full flex flex-col items-center justify-center text-center bg-white rounded shadow-md min-h-[300px]">
                <EditNote sx={{ fontSize: 50 }} className="text-gray-300 mb-3"/>
              <Typography variant="h6" className="text-gray-500 mb-2 font-sans">Select a step to edit</Typography>
              {totalStates === 0 && (
                <Box>
                  <Typography variant="body1" className="text-gray-400 font-sans mb-4">or</Typography>
                  <Button variant="contained" startIcon={<AddCircleOutline />} onClick={handleAddState} className="bg-blue-600 hover:bg-blue-700 text-white font-sans normal-case px-4 py-2">
                    Add Your First Step
                  </Button>
                </Box>
                )}
            </Paper>
          )}
        </Grid>
      </Grid>

        {/* Optional Debug Output */}
        <Paper elevation={1} className="mt-8 p-4 bg-gray-800 text-gray-200 rounded max-h-60 overflow-auto"> <Typography variant="caption" component="pre" className="text-xs whitespace-pre-wrap break-all font-mono"> {JSON.stringify(fsmData, null, 2)} </Typography> </Paper>

    </Box>
  );
};

export default FsmBuilder;