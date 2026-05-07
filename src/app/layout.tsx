import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Retail CRM Analytics Demo",
  description: "RetailCRM order analytics, sync monitoring, and Telegram alerts.",
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
