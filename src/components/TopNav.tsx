'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItemButton,
  Avatar,
  Tooltip,
  Menu, 
  MenuItem 
} from '@mui/material';
import { Logout as LogoutIcon, AccountCircle as AccountCircleIcon, Menu as MenuIcon } from '@mui/icons-material';

import { useNdk } from '@/components/NdkProvider';
import { useNip07 } from '@/hooks/nostr/useNip07';

type Profile = { picture?: string; name?: string };

export default function TopNav() {
  const pathname = usePathname();
  const [drawer, setDrawer] = useState(false);
  const [anchorEl, setAnchorEl] = useState<Element | null>(null);

  /* nostr */
  const { ndk } = useNdk();
  const { pubkey, isAvailable, connect, disconnect } = useNip07();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  /* fetch Kind-0 metadata when connected */
  useEffect(() => {
    if (!pubkey) return;

    const user = ndk.getUser({ pubkey });
    user.fetchProfile().then(() => {
      const { image, picture, name } = user.profile || {};
      setProfile({ picture: image || picture, name });
    });
  }, [ndk, pubkey]);

  /* helpers */
  const navItems = [
    { href: '/write', label: 'Write' },
  ];
  const isActive = (href: string) => pathname?.startsWith(href);

  if (!isMounted) {
    return null;
  }

  /* ---- JSX ---- */
  return (
    <>
      <AppBar position="static" color="default" className="shadow-none">
        <Toolbar className="px-4 md:px-8">
          {/* mobile burger */}
          <IconButton
            edge="start"
            aria-label="menu"
            sx={{ mr: 2, display: { md: 'none' } }}
            onClick={() => setDrawer(true)}
          >
            <MenuIcon />
          </IconButton>

          {/* logo / brand */}
          <Link href="/" className="font-semibold text-lg md:text-xl">
            SatsTheWay
          </Link>

          {/* desktop nav */}
          <nav className="ml-6 gap-6 hidden md:flex">
            {navItems.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`relative transition
                  ${isActive(href) ? 'text-primary' : 'text-gray-600'}
                  hover:text-primary
                `}
              >
                {label}
                {/* glow highlight */}
                {isActive(href) && (
                  <span className="absolute -inset-1 rounded-lg shadow-[0_0_8px_theme(colors.blue.500)] pointer-events-none" />
                )}
              </Link>
            ))}
          </nav>

          {/* spacer */}
          <div className="flex-1" />

          {/* connect / avatar */}
          {pubkey ? (
            <>
              <Tooltip title={profile?.name || 'Profile'}>
                <Avatar
                  src={profile?.picture}
                  sx={{ width: 32, height: 32, cursor: 'pointer' }}
                  onClick={e => setAnchorEl(e.currentTarget)}
                >
                  {!profile?.picture && <AccountCircleIcon />}
                </Avatar>
              </Tooltip>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
              >
                <MenuItem
                  onClick={() => {
                    setAnchorEl(null);
                    disconnect();        // <- from useNip07()
                  }}
                >
                  <LogoutIcon fontSize="small" className="mr-2" />
                  Disconnect
                </MenuItem>
              </Menu>
            </>
          ) : (
            <button
              className="rounded-md bg-blue-600 text-white px-3 py-1.5 text-sm hover:bg-blue-700"
              onClick={connect}
            >
              {isAvailable ? 'Connect' : 'Install Wallet'}
            </button>
          )}
        </Toolbar>
      </AppBar>

      {/* mobile drawer */}
      <Drawer
        anchor="left"
        open={drawer}
        onClose={() => setDrawer(false)}
        PaperProps={{ className: 'w-64 p-4' }}
      >
        <List>
          {navItems.map(({ href, label }) => (
            <ListItemButton
              key={href}
              component={Link}
              href={href}
              selected={isActive(href)}
              onClick={() => setDrawer(false)}
            >
              {label}
            </ListItemButton>
          ))}
        </List>

        <div className="mt-auto px-4 pb-4">
        {pubkey ? (
          <>
            <div className="flex items-center gap-2">
              <Avatar src={profile?.picture} />
              <span className="truncate">{profile?.name ?? 'Anon'}</span>
            </div>

            <button
              className="flex w-full items-center justify-center gap-1 rounded-md bg-gray-200 py-2 text-sm text-gray-700 hover:bg-gray-300"
              onClick={() => {
                setDrawer(false);
                disconnect();
              }}
            >
              <LogoutIcon fontSize="small" />
              Disconnect
            </button>
          </>
        ) : (
          <button
            className="rounded-md w-full bg-blue-600 text-white py-2 hover:bg-blue-700"
            onClick={() => {
              setDrawer(false);
              connect();
            }}
          >
            {isAvailable ? 'Connect Wallet' : 'Install Wallet'}
          </button>
        )}
        </div>
      </Drawer>
    </>
  );
}
