'use client';

import React, { useEffect, useState } from 'react';
import {
  AppBar,
  Toolbar,
  Button,
  IconButton,
  Typography,
  Box,
  Avatar,
  Popover
} from '@mui/material';
import { AccountCircle } from '@mui/icons-material';

// Types
interface User {
  pubkey: string;
  name?: string;
  picture?: string;
}

interface TopNavProps {
  currentUser?: User | null;
  activePage?: 'read' | 'write';
  onConnect?: () => void;
  onDisconnect?: () => void;
  loading?: boolean;
  onNavigate?: (page: 'read' | 'write') => void;
}

const TopNav: React.FC<TopNavProps> = ({
  currentUser,
  activePage,
  onConnect,
  onDisconnect,
  onNavigate,
  loading
}) => {
  const [hasMounted, setHasMounted] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  useEffect(() => {
    setHasMounted(true)
  }, [])

  if (!hasMounted) return null;

  const onProfileClick = (event: React.MouseEvent<HTMLElement>) => {
		setAnchorEl(anchorEl ? null : event.currentTarget);
  }

  const isProfileOpen = Boolean(anchorEl);
	const id = isProfileOpen ? 'profile-popover' : undefined;

  return (
    <AppBar position="static" color="transparent" elevation={0}>
      <Toolbar>
        {/* Left side - Navigation */}
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ mr: 4 }}
          >
            SatsTheWay
          </Typography>
          
          <Button
            variant={activePage === 'read' ? 'contained' : 'text'}
            onClick={() => onNavigate?.('read')}
          >
            Read
          </Button>
          <Button
            variant={activePage === 'read' ? 'contained' : 'text'}
            onClick={() => onNavigate?.('write')}
          >
            Write
          </Button>
        </Box>
        {/* Right side - Connect/Profile */}
        <Box>
          {currentUser ? (
            <Box>
              <IconButton 
                onClick={onProfileClick}
                color='primary'
                size="large"
                sx={{ padding: 0.5 }}
              >
                {currentUser.picture ? (
                  <Avatar 
                    src={currentUser.picture} 
                    alt={currentUser.name || 'Profile'}
                  />
                ) : (
                  <AccountCircle fontSize="large" />
                )}
              </IconButton>
              <Popover
                id={id}
                open={isProfileOpen}
                anchorEl={anchorEl}
                onClose={() => setAnchorEl(null)}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
              >
                <Box sx={{ p: 2, minWidth: 200 }}>
                  <Button fullWidth variant="text" onClick={onDisconnect}>Logout</Button>
                </Box>
              </Popover>
            </Box>
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={onConnect}
              disabled={loading}
              sx={{ 
                minWidth: 120,
                fontWeight: 'bold'
              }}
            >
                {loading ? "Connecting..." : "Connect"}
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default TopNav;