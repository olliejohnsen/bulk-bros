import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Navbar } from "@/components/Navbar";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://bulk-bros.app";

export const metadata: Metadata = {
  title: {
    default: "Bulk Bros — Community Pokémon Bulk Gallery",
    template: "%s | Bulk Bros",
  },
  description:
    "The community gallery for Pokémon bulk card only pullers. Share yours and discover others — become a Bulk Bro today!",
  metadataBase: new URL(APP_URL),
  openGraph: {
    type: "website",
    siteName: "Bulk Bros",
    title: "Bulk Bros — Community Pokémon Bulk Gallery",
    description:
      "The community gallery for Pokémon bulk card only pullers. Share yours and discover others — become a Bulk Bro today!",
    url: APP_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "Bulk Bros — Community Pokémon Bulk Gallery",
    description:
      "The community gallery for Pokémon bulk card only pullers. Share yours and discover others — become a Bulk Bro today!",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Bulk Bros",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} antialiased min-h-screen bg-mesh bg-grain`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <footer className="border-t border-border/40 py-12">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col items-center text-center gap-6">
                  <div className="font-black text-xl tracking-tighter">
                    BULK<span className="text-primary">BROS</span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground/60 max-w-3xl leading-relaxed font-medium">
                    &copy; 2026 bulk-bros is not affiliated with, endorsed by, or connected to Nintendo, Creatures Inc., Game Freak, or The Pokémon Company. All Pokémon characters, names, and related indicia are &copy; Nintendo, Creatures Inc., Game Freak, The Pokémon Company.
                  </p>
                </div>
              </div>
            </footer>
          </div>
          <Toaster richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
