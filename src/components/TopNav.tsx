'use client';

import {
  AccountCircle as AccountCircleIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
} from '@mui/icons-material';
import {
  AppBar,
  Avatar,
  Button,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

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
    { href: '/read', label: 'Read' },
    { href: '/write', label: 'Write' },
    { href: '/about', label: 'About' },
  ];
  const isActive = (href: string) => pathname?.startsWith(href);

  if (!isMounted) {
    return null;
  }

  /* ---- JSX ---- */
  return (
    <>
      <AppBar
        position="fixed"
        color="default"
        className="top-0 left-0 right-0 h-16 bg-white shadow-sm z-50"
        elevation={0}
      >
        <Toolbar className="px-4 md:px-8">
          {/* mobile burger */}
          <IconButton
            edge="start"
            aria-label="menu"
            className="flex md:hidden! mr-2"
            onClick={() => setDrawer(true)}
          >
            <MenuIcon />
          </IconButton>

          {/* logo / brand */}
          <Link
            href="/"
            className="font-semibold text-lg md:text-xl flex justify-center items-center"
          >
            <Image
              src="/logo.webp"
              alt="Open Path"
              width={40}
              height={40}
              className="h-10 w-10"
              priority
            />
            <Typography color="#714F09">SatsTheWay</Typography>
          </Link>

          {/* desktop nav */}
          <nav className="ml-6 gap-6 hidden md:flex">
            {navItems.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`relative transition
                  ${isActive(href) ? 'text-primary border-b-2 border-[#714F09]' : 'text-gray-600'}
                  hover:text-primary
                `}
              >
                {label}
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
                  alt="User profile"
                  src={profile?.picture}
                  sx={{ width: 32, height: 32, cursor: 'pointer' }}
                  onClick={e => setAnchorEl(e.currentTarget)}
                >
                  {!profile?.picture && <AccountCircleIcon />}
                </Avatar>
              </Tooltip>

              <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                <MenuItem
                  onClick={() => {
                    setAnchorEl(null);
                    disconnect(); // <- from useNip07()
                  }}
                >
                  <LogoutIcon fontSize="small" className="mr-2" />
                  Disconnect
                </MenuItem>
              </Menu>
            </>
          ) : isAvailable ? (
            <Button className="rounded-md text-white px-3 py-1.5 text-sm" onClick={connect}>
              Connect
            </Button>
          ) : null}
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
                <Avatar alt="User profile" src={profile?.picture} />
                <span className="truncate">{profile?.name ?? 'Anon'}</span>
              </div>

              <Button
                className="flex w-full items-center justify-center gap-1 rounded-md py-2 text-sm"
                onClick={() => {
                  setDrawer(false);
                  disconnect();
                }}
              >
                <LogoutIcon fontSize="small" />
                Disconnect
              </Button>
            </>
          ) : isAvailable ? (
            <Button
              className="rounded-md w-full py-2"
              onClick={() => {
                setDrawer(false);
                connect();
              }}
            >
              Connect
            </Button>
          ) : null}
        </div>
      </Drawer>
    </>
  );
}
