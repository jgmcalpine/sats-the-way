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
  loading?: boolean;
  onProfileClick?: () => void;
  onNavigate?: (page: 'read' | 'write') => void;
}

const TopNav: React.FC<TopNavProps> = ({
  currentUser,
  activePage,
  onConnect,
  onProfileClick,
  onNavigate,
  loading
}) => {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true)
  }, [])

  if (!hasMounted) return null;

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
            <IconButton 
              onClick={onProfileClick}
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