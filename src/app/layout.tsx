import "./globals.css"
import { Suspense } from "react"
import { AuthProvider } from "@/components/AuthProvider"
import { NdkProvider } from "@/components/NdkProvider";
import NavigationWrapper from "@/components/NavigationWrapper"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="preload"
          href="/hero-library.webp"
          as="image"
          type="image/webp"
        />
      </head>
      <body>
        <AuthProvider>
          <NdkProvider>
            <Suspense fallback={<div style={{ height: 64 }} />} >
              <NavigationWrapper />
            </Suspense>
            <main className="bg-[#E8D9C3] text-[#444444] font-sans min-h-screen mx-auto">{children}</main>
          </NdkProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
