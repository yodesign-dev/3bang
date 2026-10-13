import Link from 'next/link'
import type {Metadata} from 'next'
import {notFound} from 'next/navigation'
import {PortableText} from '@portabletext/react'
import {client} from '@/sanity/lib/client'
import {BIDA_TITLE, bidaCategoryTitle, bidaOgImage} from '@/lib/bida'
import {portableTextComponents} from '@/components/blocks'

export const revalidate = 60

const NOTE_QUERY = `*[_type == "bidaNote" && slug.current == $slug][0]{
  _id,
  title,
  "slug": slug.current,
  category,
  excerpt,
  sourceName,
  sourceUrl,
  body,
  "more": *[_type == "bidaNote" && _id != ^._id && category == ^.category && defined(slug.current)]
    | order(publishedAt desc)[0...4]{_id, title, "slug": slug.current, excerpt}
}`

type Note = {
  _id: string
  title: string
  slug: string
  category?: string
  excerpt?: string
  sourceName?: string
  sourceUrl?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: any
  more?: {_id: string; title: string; slug: string; excerpt?: string}[]
}

async function getNote(slug: string) {
  return client.fetch<Note | null>(NOTE_QUERY, {slug}, {next: {revalidate}})
}

export async function generateMetadata({params}: {params: Promise<{slug: string}>}): Promise<Metadata> {
  const {slug} = await params
  const note = await getNote(slug)
  if (!note) return {title: 'Không tìm thấy bài'}

  const path = `/${note.slug}`
  const image = {url: bidaOgImage(note.title, bidaCategoryTitle(note.category)), width: 1200, height: 630}
  return {
    title: note.title,
    description: note.excerpt,
    alternates: {canonical: path},
    openGraph: {
      title: note.title,
      description: note.excerpt,
      url: path,
      siteName: BIDA_TITLE,
      type: 'article',
      images: [image],
    },
    twitter: {card: 'summary_large_image', title: note.title, description: note.excerpt, images: [image.url]},
  }
}

function Source({note}: {note: Note}) {
  if (!note.sourceName && !note.sourceUrl) return null
  const name = note.sourceName || note.sourceUrl
  return (
    <>
      Nguồn:{' '}
      {note.sourceUrl ? (
        <a
          href={note.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-neutral-300 underline-offset-4 [overflow-wrap:anywhere] hover:decoration-neutral-900"
        >
          {name} ↗
        </a>
      ) : (
        name
      )}
    </>
  )
}

export default async function BidaNotePage({params}: {params: Promise<{slug: string}>}) {
  const {slug} = await params
  const note = await getNote(slug)
  if (!note) notFound()

  const hasSource = Boolean(note.sourceName || note.sourceUrl)

  return (
    <div className="min-h-screen bg-white text-neutral-900 antialiased">
      <header className="border-b border-neutral-200">
        <div className="mx-auto max-w-3xl px-6 py-6 sm:px-8">
          <Link href="/" className="text-sm text-neutral-500 transition-colors hover:text-neutral-900">
            ← {BIDA_TITLE}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10 sm:px-8 sm:py-16">
        <article>
          <Link
            href={`/?nhom=${note.category}`}
            className="text-xs font-semibold uppercase tracking-widest text-brand"
          >
            {bidaCategoryTitle(note.category)}
          </Link>
          <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-neutral-900 sm:text-4xl">
            {note.title}
          </h1>
          {note.excerpt && <p className="mt-4 text-lg leading-relaxed text-neutral-600">{note.excerpt}</p>}
          {hasSource && (
            <p className="mt-4 text-sm text-neutral-400">
              <Source note={note} />
            </p>
          )}

          <div className="mt-8">
            <PortableText value={note.body ?? []} components={portableTextComponents} />
          </div>

          {hasSource && (
            <p className="mt-12 border-t border-neutral-200 pt-6 text-sm leading-relaxed text-neutral-500">
              Bài này mình chép và tổng hợp lại để tiện tra cứu. <Source note={note} />
            </p>
          )}
        </article>

        {note.more && note.more.length > 0 && (
          <aside className="mt-16 border-t border-neutral-200 pt-10">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
              Cùng nhóm {bidaCategoryTitle(note.category)}
            </h2>
            <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {note.more.map((item) => (
                <li key={item._id}>
                  <Link
                    href={`/${item.slug}`}
                    className="group block h-full rounded-xl border border-neutral-200 p-5 transition hover:border-neutral-400"
                  >
                    <p className="font-semibold leading-snug text-neutral-900 transition-colors group-hover:text-brand">
                      {item.title}
                    </p>
                    {item.excerpt && (
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-neutral-500">{item.excerpt}</p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </main>
    </div>
  )
}
