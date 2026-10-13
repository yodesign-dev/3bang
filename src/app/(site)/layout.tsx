import Link from 'next/link'
import {client} from '@/sanity/lib/client'
import {BIDA_TITLE, splitSections} from '@/lib/bida'
import {NotesBrowser, type BrowserNote} from '@/components/NotesBrowser'
import {SiteShell} from '@/components/SiteShell'

const revalidate = 60

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

// Danh sách bài + ô tìm kiếm nằm ở layout để dùng chung cho trang chủ và mọi
// trang bài: trên màn hình lớn nó là cột trái đứng yên khi chuyển bài. Studio
// (/studio) nằm ngoài nhóm này vì nó tự chiếm trọn màn hình.
export default async function SiteLayout({children}: {children: React.ReactNode}) {
  const fetched = await client.fetch<Note[]>(NOTES_QUERY, {}, {next: {revalidate}})

  // Trình duyệt chỉ nhận phần chữ của từng mục để tìm kiếm, không nhận cả nội dung bài.
  const notes: BrowserNote[] = fetched.map(({body, ...note}) => ({
    ...note,
    sections: splitSections(body).map(({id, title, text}) => ({id, title, text})),
  }))

  return (
    <SiteShell
      sidebar={
        <>
          <header className="border-b border-neutral-200 px-6 py-10 lg:px-5 lg:py-6">
            <Link href="/" className="text-3xl font-semibold tracking-tight text-neutral-900 lg:text-2xl">
              {BIDA_TITLE}
            </Link>
            <p className="mt-2 text-neutral-500 lg:text-sm">
              Hệ thống, công thức và thế bóng mình sưu tầm trong lúc tập — có sơ đồ bàn và video để xem ngay bên bàn.
            </p>
          </header>
          <div className="px-6 py-8 lg:px-5 lg:py-5">
            {notes.length === 0 ? (
              <p className="py-16 text-center text-neutral-400">Chưa có bài nào — mình đang chép dần lên đây.</p>
            ) : (
              <NotesBrowser notes={notes} />
            )}
          </div>
        </>
      }
    >
      <div className="flex-1">{children}</div>
      <footer className="border-t border-neutral-200 bg-white">
        <p className="mx-auto max-w-3xl px-6 py-6 text-sm text-neutral-400 sm:px-8">
          {BIDA_TITLE} — ghi chép sưu tầm để tra cứu lúc tập.
        </p>
      </footer>
    </SiteShell>
  )
}
