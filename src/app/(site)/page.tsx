import type {Metadata} from 'next'
import {client} from '@/sanity/lib/client'
import {BIDA_TITLE, splitSections} from '@/lib/bida'
import {NotesBrowser, type BrowserNote} from '@/components/NotesBrowser'

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
  body,
  "videos": count(body[_type == "youtube"]),
  "diagrams": count(body[_type == "bidaDiagram"])
}`

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Note = Omit<BrowserNote, 'sections'> & {body?: any[]}

export default async function BidaPage({searchParams}: {searchParams: Promise<{nhom?: string}>}) {
  const {nhom} = await searchParams
  const fetched = await client.fetch<Note[]>(NOTES_QUERY, {}, {next: {revalidate}})

  // Trình duyệt chỉ nhận phần chữ của từng mục để tìm kiếm, không nhận cả nội dung bài.
  const notes: BrowserNote[] = fetched.map(({body, ...note}) => ({
    ...note,
    sections: splitSections(body).map(({id, title, text}) => ({id, title, text})),
  }))

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

      <main className="mx-auto max-w-6xl px-6 py-8 sm:px-8 sm:py-12">
        {notes.length === 0 ? (
          <p className="py-16 text-center text-neutral-400">Chưa có bài nào — mình đang chép dần lên đây.</p>
        ) : (
          <NotesBrowser notes={notes} initialCategory={nhom} />
        )}
      </main>
    </div>
  )
}
