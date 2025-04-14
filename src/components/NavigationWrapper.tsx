'use client';

import { useAuth } from "@/components/AuthProvider";
import TopNav from "@/components/TopNav";

export default function NavigationWrapper() {
  const { currentUser, connect, loading, disconnect } = useAuth();

  if (loading) {
    console.log("show loading");
    return null;
  }
  return <TopNav onDisconnect={disconnect} currentUser={currentUser} onConnect={connect} loading={loading} />
}
