import type { Metadata } from "next";
import localFont from "next/font/local";
import { Syne } from 'next/font/google';
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

export const metadata: Metadata = {
  title: "Juan Gravano — QA Engineer & Creative Technologist",
  description: "Explorando la intersección entre tecnología y creatividad. QA Engineer y Creative Technologist basado en Buenos Aires, especializado en automatización y proyectos creativos.",
  keywords: [
    "Juan Gravano",
    "QA Engineer",
    "Creative Technologist",
    "Buenos Aires",
    "Quality Engineering",
    "Creative Technology",
    "Test Automation",
    "Digital Art",
    "Software Engineering"
  ],
  authors: [{ name: "Juan Gravano" }],
  creator: "Juan Gravano",
  publisher: "Juan Gravano",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "https://juan.software",
    title: "Juan Gravano — QA Engineer & Creative Technologist",
    description: "Explorando la intersección entre tecnología y creatividad. QA Engineer y Creative Technologist basado en Buenos Aires.",
    siteName: "Juan Gravano",
  },
  twitter: {
    card: "summary_large_image",
    title: "Juan Gravano — QA Engineer & Creative Technologist",
    description: "Explorando la intersección entre tecnología y creatividad. QA Engineer y Creative Technologist basado en Buenos Aires.",
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
        className={`${syne.variable} ${geistMono.variable} font-sans antialiased bg-black`}
      >
        {children}
        
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
