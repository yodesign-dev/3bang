import Link from 'next/link'
import {BIDA_TITLE} from '@/lib/bida'

export default function BidaNotFound() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-24 text-center sm:px-8">
      <h1 className="text-2xl font-semibold text-neutral-900">Không tìm thấy bài này</h1>
      <p className="mt-3 text-neutral-500">Có thể bài đã đổi đường dẫn hoặc đã được gỡ.</p>
      <Link href="/" className="mt-8 inline-flex min-h-11 items-center text-sm font-semibold text-brand">
        ← Về {BIDA_TITLE}
      </Link>
    </main>
  )
}
