import type { Metadata, Viewport } from "next";
import { Schibsted_Grotesk, Source_Serif_4 } from "next/font/google";
import { AppShell } from "@/components/AppShell";
import { DataProvider } from "@/components/providers/DataProvider";
import "./globals.css";

const ui = Schibsted_Grotesk({ subsets: ["latin", "latin-ext"], variable: "--font-ui", display: "swap" });
const de = Source_Serif_4({ subsets: ["latin", "latin-ext"], variable: "--font-de", display: "swap" });

export const metadata: Metadata = {
  title: "Deutsch Mentor",
  description: "Personal AI German mentor — speaking, grammar, vocabulary and call-center training.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

const themeScript = `try{var t=localStorage.getItem("german-mentor:theme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sq" className={`${ui.variable} ${de.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <DataProvider>
          <AppShell>{children}</AppShell>
        </DataProvider>
      </body>
    </html>
  );
}
