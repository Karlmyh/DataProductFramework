import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const incomingHeaders = await headers();
  const rawHost = incomingHeaders.get("x-forwarded-host") ?? incomingHeaders.get("host") ?? "localhost:3000";
  const candidateHost = rawHost.split(",", 1)[0].trim().toLowerCase();
  const hostMatch = candidateHost.match(/^([a-z0-9](?:[a-z0-9.-]*))(?::(\d{1,5}))?$/);
  const candidatePort = hostMatch?.[2] ? Number(hostMatch[2]) : undefined;
  const host = hostMatch && (candidatePort === undefined || candidatePort <= 65535)
    ? candidateHost
    : "localhost:3000";
  const rawProtocol = incomingHeaders.get("x-forwarded-proto")?.split(",", 1)[0].trim().toLowerCase();
  const protocol = rawProtocol === "http" || rawProtocol === "https"
    ? rawProtocol
    : host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
  const origin = protocol + "://" + host;
  const image = origin + "/og-privacy-lab.png";

  return {
    metadataBase: new URL(origin),
    title: {
      default: "数据产品安全衡量框架",
      template: "%s｜数据产品安全衡量框架",
    },
    description: "覆盖行业基础数据库、核验、指标、模型与梯度产品的互动式隐私攻击演示和统一风险衡量。",
    openGraph: {
      title: "数据产品安全衡量框架",
      description: "五类数据产品 · 互动调用演示 · 多攻击结果聚合",
      images: [{ url: image, width: 1536, height: 1024, alt: "数据产品安全衡量框架" }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "数据产品安全衡量框架",
      description: "五类数据产品 · 互动调用演示 · 多攻击结果聚合",
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
