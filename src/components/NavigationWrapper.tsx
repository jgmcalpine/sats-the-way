'use client';

import { useAuth } from "@/components/AuthProvider";
import TopNav from "@/components/TopNav";

export default function NavigationWrapper() {
  const { currentUser, connect, loading } = useAuth();

  // You may show a loading indicator here if needed
  if (loading) {
    console.log("show loading");
  }
  return <TopNav currentUser={currentUser} onConnect={connect} loading={loading} />
}
