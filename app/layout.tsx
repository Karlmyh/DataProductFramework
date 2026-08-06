import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const incomingHeaders = await headers();
  const host = incomingHeaders.get("x-forwarded-host") ?? incomingHeaders.get("host") ?? "localhost:3000";
  const protocol = incomingHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = protocol + "://" + host;
  const image = origin + "/og.png";

  return {
    metadataBase: new URL(origin),
    title: {
      default: "专业数据产品安全衡量框架",
      template: "%s｜专业数据产品安全衡量框架",
    },
    description: "以专业数据产品三级分类为入口，连接各类产品的攻击方法、实验系列与统一风险衡量。",
    openGraph: {
      title: "专业数据产品安全衡量框架",
      description: "分类 · 攻击 · 衡量",
      images: [{ url: image, width: 1536, height: 1024, alt: "专业数据产品安全衡量框架" }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "专业数据产品安全衡量框架",
      description: "分类 · 攻击 · 衡量",
      images: [image],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
