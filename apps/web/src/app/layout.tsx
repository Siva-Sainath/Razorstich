import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RazorStitch API",
  description: "Payment recovery policy + Razorpay webhooks",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
