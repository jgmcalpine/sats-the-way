'use client';

import { useAuth } from "@/components/AuthProvider";
import TopNav from "@/components/TopNav";

export default function NavigationWrapper() {
  const {  loading } = useAuth();

  if (loading) {
    console.log("show loading");
    return null;
  }
  return <TopNav  />
}
