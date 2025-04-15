import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';

export interface ChapterSwitchModalProps {
	open: boolean;
	onConfirm: () => void;
	onCancel: () => void;
}

const ChapterSwitchModal: React.FC<ChapterSwitchModalProps> = ({ open, onConfirm, onCancel }) => {
	return (
		<Dialog open={open} onClose={onCancel}>
			<DialogTitle>Switch Chapter</DialogTitle>
			<DialogContent>
				<Typography>
					Do you want to save your current chapter draft before switching?
				</Typography>
			</DialogContent>
			<DialogActions>
				<Button onClick={onCancel}>Cancel</Button>
				<Button onClick={onConfirm} color="primary">Save & Switch</Button>
			</DialogActions>
		</Dialog>
	);
};

export default ChapterSwitchModal;
