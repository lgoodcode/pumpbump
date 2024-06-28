import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "dark",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#6d28d9e6" },
  ],
};

export const metadata: Metadata = {
  title: {
    default: "PumpBump",
    template: "%s | PumpBump",
  },
  metadataBase: new URL("https://pumpbump.fun"),
  keywords: [
    "pump bump pumpfun pump.fun crypto solana chart meme best coin altcoin altcoins alt altcoins altcoin",
  ],
  description:
    "PumpBump is the best bump bot to put your coin on PumpFun to the top and attract buyers.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/img/icon.png",
    apple: "/img/icon.png",
  },
  openGraph: {
    type: "website",
    url: "https://pumpbump.fun",
    title: "PumpBump",
    description: "PumpBump.",
    siteName: "PumpBump",
    images: [
      {
        url: "/img/logo-318x85.png",
        width: 318,
        height: 85,
        alt: "PumpBump logo with text",
      },
      {
        url: "/img/icon.png",
        width: 64,
        height: 52,
        alt: "logo",
      },
      {
        url: "/img/icon-logo-1231x1049.png",
        width: 1231,
        height: 1049,
        alt: "logo large with text below",
      },
      {
        url: "/img/icon-1024x1024.png",
        width: 1024,
        height: 1024,
        alt: "logo large",
      },
    ],
  },
};
