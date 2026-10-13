import type {Metadata} from 'next'
import {Be_Vietnam_Pro, JetBrains_Mono} from 'next/font/google'
import './globals.css'
import {BIDA_DESCRIPTION, BIDA_TITLE, BIDA_URL, bidaOgImage} from '@/lib/bida'

// Be Vietnam Pro: font vẽ riêng cho tiếng Việt, dấu thanh rõ và không dính
// vào chữ ở cỡ đọc bài. JetBrains Mono cho công thức — có đủ chữ tiếng Việt,
// không bị nhảy sang font dự phòng giữa chừng.
const sans = Be_Vietnam_Pro({
  variable: '--font-text',
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
})

const mono = JetBrains_Mono({
  variable: '--font-code',
  subsets: ['latin', 'vietnamese'],
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
    <html lang="vi" className={`${sans.variable} ${mono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  )
}
