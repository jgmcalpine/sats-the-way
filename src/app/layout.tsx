import { AuthProvider } from '@/components/AuthProvider';
import ClientNav from '@/components/ClientNav';
import NavigationWrapper from '@/components/NavigationWrapper';
import { NdkProvider } from '@/components/NdkProvider';
import TopNavSkeleton from '@/components/TopNavSkeleton';

import { Suspense } from 'react';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>SatsTheWay - Decentralized Storytelling Platform</title>
        <link rel="preload" href="/hero-library.webp" as="image" type="image/webp" />
      </head>
      <body>
        <AuthProvider>
          <NdkProvider>
            <Suspense fallback={<TopNavSkeleton />}>
              <NavigationWrapper />
            </Suspense>
            <TopNavSkeleton />
            <ClientNav />
            <main className="bg-[#E8D9C3] text-[#8B6914] font-sans min-h-screen mx-auto">
              {children}
            </main>
          </NdkProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
