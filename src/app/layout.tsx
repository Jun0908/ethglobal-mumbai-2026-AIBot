import type { Metadata } from "next";
import "lism-css/main.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Secret Tender — 会う前に、ふたりの時間を。",
  description: "気になる人のAIの分身と、話したり、小さなデートを楽しんだり。一緒に笑えた話題から、本人に会ってみたい気持ちへ。",
  openGraph: {
    title: "Secret Tender — 会う前に、ふたりの時間を。",
    description: "AIの分身との会話と小さなデートから、ふたりの時間を感じてみよう。",
    siteName: "Secret Tender",
    type: "website",
  },
};
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ja"><body>{children}</body></html>;
}
