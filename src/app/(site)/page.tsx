import Link from 'next/link'
import {client} from '@/sanity/lib/client'
import type {Metadata} from 'next'
import {BIDA_CATEGORIES, BIDA_TITLE, bidaCategoryTitle} from '@/lib/bida'

export const revalidate = 60

// Tiêu đề, mô tả và ảnh chia sẻ lấy từ layout gốc.
export const metadata: Metadata = {alternates: {canonical: '/'}}

const NOTES_QUERY = `*[_type == "bidaNote" && defined(slug.current)] | order(publishedAt desc) {
  _id,
  title,
  "slug": slug.current,
  category,
  excerpt,
  formula,
  "videos": count(body[_type == "youtube"]),
  "diagrams": count(body[_type == "bidaDiagram"])
}`

type Note = {
  _id: string
  title: string
  slug: string
  category?: string
  excerpt?: string
  formula?: string
  videos: number
  diagrams: number
}

const chipClass = (active: boolean) =>
  `flex min-h-11 shrink-0 items-center rounded-full border px-4 text-sm font-medium transition ${
    active
      ? 'border-neutral-900 bg-neutral-900 text-white'
      : 'border-neutral-200 text-neutral-600 hover:border-neutral-400'
  }`

export default async function BidaPage({searchParams}: {searchParams: Promise<{nhom?: string}>}) {
  const {nhom} = await searchParams
  const notes = await client.fetch<Note[]>(NOTES_QUERY, {}, {next: {revalidate}})

  // Chỉ hiện chip của nhóm đã có bài — nhóm trống bấm vào chỉ thấy trang rỗng.
  const categories = BIDA_CATEGORIES.filter((category) =>
    notes.some((note) => note.category === category.value),
  )
  const active = categories.find((category) => category.value === nhom)?.value
  const shown = active ? notes.filter((note) => note.category === active) : notes

  return (
    <div className="min-h-screen bg-white text-neutral-900 antialiased">
      <header className="border-b border-neutral-200">
        <div className="mx-auto max-w-6xl px-6 py-10 sm:px-8">
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">{BIDA_TITLE}</h1>
          <p className="mt-2 text-neutral-500">
            Hệ thống, công thức và thế bóng mình sưu tầm trong lúc tập — có sơ đồ bàn và video để xem ngay bên bàn.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10 sm:px-8 sm:py-16">
        {categories.length >= 2 && (
          // Điện thoại: 1 hàng chip vuốt ngang, tràn sát mép màn hình
          <nav
            aria-label="Nhóm bài"
            className="-mx-6 mb-8 flex gap-2 overflow-x-auto px-6 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
          >
            <Link href="/" className={chipClass(!active)}>
              Tất cả
            </Link>
            {categories.map((category) => (
              <Link
                key={category.value}
                href={`/?nhom=${category.value}`}
                className={chipClass(active === category.value)}
              >
                {category.title}
              </Link>
            ))}
          </nav>
        )}

        {shown.length === 0 ? (
          <p className="py-16 text-center text-neutral-400">Chưa có bài nào — mình đang chép dần lên đây.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((note) => {
              const extras = [
                note.diagrams > 0 && `${note.diagrams} sơ đồ`,
                note.videos > 0 && `${note.videos} video`,
              ].filter(Boolean)

              return (
                <li key={note._id}>
                  <Link
                    href={`/${note.slug}`}
                    className="group flex h-full flex-col rounded-xl border border-neutral-200 p-5 transition hover:border-neutral-400"
                  >
                    <p className="text-xs font-semibold uppercase tracking-widest text-brand">
                      {bidaCategoryTitle(note.category)}
                    </p>
                    <h2 className="mt-2 text-xl font-semibold leading-snug text-neutral-900 transition-colors group-hover:text-neutral-600">
                      {note.title}
                    </h2>
                    {note.excerpt && (
                      <p className="mt-2 line-clamp-3 text-[15px] leading-relaxed text-neutral-600">
                        {note.excerpt}
                      </p>
                    )}
                    {note.formula && (
                      <p className="mt-4 rounded-md bg-neutral-100 px-3 py-2 font-mono text-sm font-medium text-neutral-800 [overflow-wrap:anywhere]">
                        {note.formula}
                      </p>
                    )}
                    {extras.length > 0 && (
                      <p className="mt-auto pt-4 text-sm text-neutral-400">{extras.join(' · ')}</p>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </main>
    </div>
  )
}
