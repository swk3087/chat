import "@/styles/globals.css";
import { ThemeProvider } from "next-themes";
import { Inter } from "next/font/google";
import AuthSessionProvider from "@/components/SessionProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import AuthButton from "@/components/AuthButton";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-background text-foreground`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthSessionProvider>
            <div className="mx-auto max-w-screen-sm p-3 sm:p-4">
              {/* 전역 헤더 */}
              <!--div className="mb-4 flex items-center justify-between">
                <h1 className="text-lg font-semibold">Chat</h1>
                <div className="flex items-center gap-2">
                  <ThemeToggle />
                  <AuthButton />
                </div>
              </div-->

              {children}
            </div>
          </AuthSessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

