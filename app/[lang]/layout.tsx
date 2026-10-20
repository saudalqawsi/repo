import '@fontsource/ibm-plex-sans-arabic/400.css'
import '@fontsource/ibm-plex-sans-arabic/500.css'
import '@fontsource/ibm-plex-sans-arabic/600.css'
import '@fontsource/ibm-plex-sans-arabic/700.css'
import '../globals.css'
import type { Metadata, Viewport } from 'next'
import { notFound } from 'next/navigation'
import { dirOf, isLocale, LOCALES, t } from '@/lib/i18n'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }))
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params
  if (!isLocale(lang)) return {}
  const d = t(lang)
  return {
    title: { default: d.meta.title, template: `%s · ${lang === 'ar' ? 'شيول' : 'Shayul'}` },
    description: d.meta.description,
    icons: { icon: '/icon.svg' },
    alternates: { languages: { ar: '/ar', en: '/en' } },
  }
}

export const viewport: Viewport = { themeColor: '#f3f5f6', width: 'device-width', initialScale: 1 }

export default async function RootLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  return (
    <html lang={lang} dir={dirOf(lang)}>
      <body>
        <a className="skip" href="#main">{lang === 'ar' ? 'انتقل إلى المحتوى' : 'Skip to content'}</a>
        <Header locale={lang} />
        <main id="main">{children}</main>
        <Footer locale={lang} />
      </body>
    </html>
  )
}
