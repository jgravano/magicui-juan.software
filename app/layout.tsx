import CursorEffects from "@/components/magicui/cursor-effects";
import type { Metadata } from "next";
import { ThemeProvider } from 'next-themes';
import { Courier_Prime, JetBrains_Mono, Playfair_Display, Poppins, Space_Grotesk, Syne } from 'next/font/google';
import localFont from "next/font/local";
import Script from 'next/script';
import "./globals.css";

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const courierPrime = Courier_Prime({
  subsets: ['latin'],
  weight: ["400", "700"],
  display: "swap",
  variable: '--font-courier-prime',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: "swap",
  variable: '--font-jetbrains-mono',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: "swap",
  variable: '--font-space-grotesk',
});

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  display: "swap",
  variable: '--font-playfair-display',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: "juan.software",
  description: "Experiencia digital interactiva",
  icons: {
    icon: [
      {
        url: '/favicon.svg',
        type: 'image/svg+xml',
      }
    ],
  },
  keywords: [
    "Diseño Experimental",
    "Minimalismo",
    "Experiencia Digital",
    "Interacción",
    "Arte Digital"
  ],
  authors: [{ name: "Juan Gravano" }],
  creator: "Juan Gravano",
  publisher: "juan.software",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "https://juan.software",
    title: "juan.software",
    description: "Experiencia digital interactiva",
    siteName: "juan.software",
  },
  twitter: {
    card: "summary_large_image",
    title: "juan.software",
    description: "Experiencia digital interactiva",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="scroll-smooth">
      <body
        className={`${syne.variable} ${geistMono.variable} ${courierPrime.variable} ${jetbrainsMono.variable} ${spaceGrotesk.variable} ${playfairDisplay.variable} ${poppins.variable} font-sans antialiased bg-black`}
      >
        <ThemeProvider attribute="data-theme" defaultTheme="default" enableColorScheme={false}>
          <CursorEffects>
            {children}
          </CursorEffects>
        </ThemeProvider>
        
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-XXXXXXXXXX');
          `}
        </Script>

        {/* Plausible Analytics (Privacy-focused alternative) */}
        <Script 
          data-domain="juan.software" 
          src="https://plausible.io/js/script.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
