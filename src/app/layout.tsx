import "./globals.css"
import { Suspense } from "react"
import { AuthProvider } from "@/components/AuthProvider"
import { NDKProvider } from "@/components/NdkProvider";
import NavigationWrapper from "@/components/NavigationWrapper"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <NDKProvider>
            <Suspense fallback={<div style={{ height: 64 }} />} >
              <NavigationWrapper />
            </Suspense>
            <main>{children}</main>
          </NDKProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
