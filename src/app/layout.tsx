import type { Metadata } from "next";
import { fontClasses } from "@/lib/fonts";
import { ThemeProvider, themeInitScript } from "@/components/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "SCOPEFORGE — Quote-to-scope operating system for agencies",
    template: "%s · SCOPEFORGE",
  },
  description:
    "Turn messy client requests into profitable scopes, proposals, and onboarding flows. The commercial operating layer for agencies and service businesses.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${fontClasses} font-body antialiased`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
