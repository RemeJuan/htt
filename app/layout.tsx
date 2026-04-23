import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import { AppShell } from "@/components/app-shell";
import { ThemeProvider } from "@/components/theme-provider";
import { withBasePath } from "@/lib/site-path";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Habit Tracker Tracker",
    template: "%s | Habit Tracker Tracker",
  },
  icons: {
    icon: withBasePath("/logo.png"),
    apple: withBasePath("/logo.png"),
  },
  description:
    "Responsive habit tracker foundation with theme support, Supabase auth, and public listings.",
  openGraph: {
    title: "Habit Tracker Tracker",
    description:
      "Responsive habit tracker foundation with theme support, Supabase auth, and public listings.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Habit Tracker Tracker",
    description:
      "Responsive habit tracker foundation with theme support, Supabase auth, and public listings.",
  },
};

const themeScript = `
(() => {
  const storageKey = "habit-tracker-theme";
  const root = document.documentElement;
  const storedTheme = window.localStorage.getItem(storageKey);
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const resolvedTheme = storedTheme === "light" || storedTheme === "dark"
    ? storedTheme
    : systemDark
      ? "dark"
      : "light";

  root.dataset.theme = resolvedTheme;
  root.dataset.themeMode = storedTheme === "light" || storedTheme === "dark" ? storedTheme : "system";
  root.style.colorScheme = resolvedTheme;
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full scroll-smooth antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background text-foreground font-sans transition-colors duration-200">
        <Script id="theme-script" strategy="beforeInteractive">
          {themeScript}
        </Script>
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
