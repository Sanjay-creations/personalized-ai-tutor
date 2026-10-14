import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EDUQUEST",
  description: "AI-powered gamified learning platform",
};

const themeScript = `
(function () {
  try {
    const savedTheme = localStorage.getItem("eduquest-theme");

    if (savedTheme === "light" || savedTheme === "dark") {
      document.documentElement.setAttribute(
        "data-theme",
        savedTheme
      );
    }
  } catch (error) {
    console.error("Could not restore EDUQUEST theme:", error);
  }
})();
`;

export default function RootLayout({
  children,
}: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: themeScript,
          }}
        />
      </head>

      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}