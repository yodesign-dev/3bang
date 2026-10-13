import {BIDA_TITLE} from '@/lib/bida'

// Chân trang cho các trang đọc. Studio (/studio) nằm ngoài nhóm này vì nó
// tự chiếm trọn màn hình.
export default function SiteLayout({children}: {children: React.ReactNode}) {
  return (
    <>
      <div className="flex-1">{children}</div>
      <footer className="border-t border-neutral-200 bg-white">
        <p className="mx-auto max-w-6xl px-6 py-6 text-sm text-neutral-400 sm:px-8">
          {BIDA_TITLE} — ghi chép sưu tầm để tra cứu lúc tập.
        </p>
      </footer>
    </>
  )
}
