import { AuthProvider } from '@/components/AuthProvider';
import ClientNav from '@/components/ClientNav';
import Footer from '@/components/Footer';
import NavigationWrapper from '@/components/NavigationWrapper';
import { NdkProvider } from '@/components/NdkProvider';
import TopNavSkeleton from '@/components/TopNavSkeleton';

import ThemeProvider from '@/app/ThemeProvider';
import { Suspense } from 'react';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>SatsTheWay</title>
        <link rel="preload" href="/hero-library.webp" as="image" type="image/webp" />
      </head>
      <body>
        <AuthProvider>
          <ThemeProvider>
            <NdkProvider>
              <Suspense fallback={<TopNavSkeleton />}>
                <NavigationWrapper />
              </Suspense>
              <TopNavSkeleton />
              <ClientNav />
              <main
                id="main-container"
                className="bg-[#E8D9C3] text-[#8B6914] font-sans min-h-screen mx-auto"
              >
                {children}
              </main>
            </NdkProvider>
          </ThemeProvider>
        </AuthProvider>
        <Footer />
      </body>
    </html>
  );
}
