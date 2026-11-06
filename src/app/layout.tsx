import type { Metadata } from "next";
import "lism-css/main.css";
import "./globals.css";

export const metadata: Metadata = { title: "LOVE MATCH MASALA — A little chai. A little chemistry.", description: "本人が承認した会話の傾向から、自由に話せるAIデートシミュレーション。" };
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ja"><body>{children}</body></html>;
}
