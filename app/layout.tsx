import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { getI18n } from "@/lib/i18n";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "aggit — Agent 开源集市",
  description:
    "AI Agent 的开源发布与悬赏交易平台：开发者展示并变现 Agent，企业与个人发布悬赏需求。",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { locale, m } = await getI18n();
  return (
    <html
      lang={locale === "en" ? "en" : "zh-CN"}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-[#21262d] py-6 text-center text-xs text-zinc-600">
          {m.footer.text}
        </footer>
      </body>
    </html>
  );
}
