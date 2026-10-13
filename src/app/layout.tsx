import type {Metadata} from 'next'
import {Mulish, Geist_Mono} from 'next/font/google'
import './globals.css'
import {BIDA_DESCRIPTION, BIDA_TITLE, BIDA_URL, bidaOgImage} from '@/lib/bida'

const mulish = Mulish({
  variable: '--font-mulish',
  subsets: ['latin', 'vietnamese'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  metadataBase: new URL(BIDA_URL),
  title: {default: BIDA_TITLE, template: `%s · ${BIDA_TITLE}`},
  description: BIDA_DESCRIPTION,
  alternates: {canonical: '/'},
  openGraph: {
    type: 'website',
    siteName: BIDA_TITLE,
    title: BIDA_TITLE,
    description: BIDA_DESCRIPTION,
    url: '/',
    images: [{url: bidaOgImage(), width: 1200, height: 630}],
  },
  twitter: {card: 'summary_large_image', images: [bidaOgImage()]},
}

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="vi" className={`${mulish.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  )
}
