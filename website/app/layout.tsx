import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import { SITE_NAME, SITE_DESC } from '@/lib/config'

const geist = Inter({ subsets: ['latin'], variable: '--font-geist-sans' })

export const metadata: Metadata = {
  title:       { default: SITE_NAME, template: `%s — ${SITE_NAME}` },
  description: SITE_DESC,
  openGraph: {
    siteName: SITE_NAME,
    type:     'website',
    locale:   'en_US',
  },
  twitter: { card: 'summary_large_image' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geist.variable}>
      <body className="min-h-screen bg-vctr-surface">
        <Header />
        <main className="max-w-6xl mx-auto px-4 py-8">
          {children}
        </main>
        <footer className="mt-16 bg-vctr-black-2 text-white/60 text-xs text-center py-6 px-4">
          <p>© {new Date().getFullYear()} Vctr — AI & SaaS tool reviews for global builders.</p>
          <p className="mt-1">
            Images via{' '}
            <a href="https://unsplash.com" className="underline hover:text-white">Unsplash</a>
            {' '}·{' '}
            <a href="mailto:dmca@vctr.io" className="underline hover:text-white">DMCA</a>
          </p>
        </footer>
      </body>
    </html>
  )
}
