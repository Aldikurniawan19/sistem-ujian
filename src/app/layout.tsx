import type { Metadata } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Aksara CBT — Sistem Asesmen Digital SMP & SMA",
  description:
    "Platform Computer-Based Test (CBT) modern untuk evaluasi harian, sumatif, dan simulasi ANBK jenjang SMP dan SMA.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.JSX.Element {
  return (
    <html
      lang="id"
      className={`${plusJakartaSans.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen bg-[#F7F7F5] text-[#141413] antialiased">
        {children}
      </body>
    </html>
  );
}
