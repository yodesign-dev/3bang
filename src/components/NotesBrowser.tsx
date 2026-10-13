'use client'

import Link from 'next/link'
import {usePathname} from 'next/navigation'
import {useState} from 'react'
import {BIDA_CATEGORIES, bidaCategoryTitle, foldText} from '@/lib/bida'

export type BrowserNote = {
  _id: string
  title: string
  slug: string
  category?: string
  excerpt?: string
  formula?: string
  videos: number
  diagrams: number
  // Chữ của từng phần trong bài, để tìm trong nội dung
  sections: {id: string; title: string; text: string}[]
}

type Hit = {note: BrowserNote; matcher: Matcher; snippets: {sectionId: string; sectionTitle: string; text: string}[]; points: number}

const chipClass = (active: boolean) =>
  `flex min-h-11 shrink-0 cursor-pointer items-center rounded-full border px-4 text-sm font-medium transition ${
    active
      ? 'border-neutral-900 bg-neutral-900 text-white'
      : 'border-neutral-200 text-neutral-600 hover:border-neutral-400'
  }`

type Matcher = {phrase: RegExp; words: RegExp[]}

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Khớp theo từ chứ không theo chuỗi con: gõ "da" không được ra "dài".
// `prefix`: từ cuối đang gõ dở thì khớp theo phần đầu của từ ("cong th" ra
// "công thức") — chỉ dùng khi khớp nguyên từ không ra bài nào.
function buildMatcher(query: string, prefix: boolean): Matcher | null {
  // Tách theo mọi ký tự không phải chữ/số: "50 - 30" thành 2 từ "50" và "30"
  const tokens = foldText(query).split(/[^a-z0-9]+/).filter(Boolean)
  if (tokens.length === 0) return null
  const tail = prefix ? '' : '(?![a-z0-9])'
  const words = tokens.map(
    (token, index) =>
      new RegExp(`(?<![a-z0-9])${escapeRegExp(token)}${index < tokens.length - 1 ? '(?![a-z0-9])' : tail}`, 'g'),
  )
  const phrase = new RegExp(`(?<![a-z0-9])${tokens.map(escapeRegExp).join('[^a-z0-9]+')}${tail}`, 'g')
  return {phrase, words}
}

const firstIndex = (pattern: RegExp, folded: string) => {
  pattern.lastIndex = 0
  return pattern.exec(folded)?.index ?? -1
}

// Chấm điểm 1 đoạn chữ: có nguyên cụm từ là cao nhất, rồi tới số từ khớp.
function score(text: string, matcher: Matcher) {
  const folded = foldText(text)
  const phraseAt = firstIndex(matcher.phrase, folded)
  const wordAt = matcher.words.map((word) => firstIndex(word, folded)).filter((index) => index >= 0)
  return {
    points: (phraseAt >= 0 ? 100 : 0) + wordAt.length,
    all: wordAt.length === matcher.words.length,
    at: phraseAt >= 0 ? phraseAt : Math.min(...wordAt),
  }
}

function snippetAt(text: string, at: number): string {
  const source = text.normalize('NFC')
  const start = Math.max(0, at - 40)
  const end = Math.min(source.length, at + 100)
  return `${start > 0 ? '…' : ''}${source.slice(start, end).trim()}${end < source.length ? '…' : ''}`
}

function search(notes: BrowserNote[], matcher: Matcher): Hit[] {
  return notes
    .flatMap((note) => {
      const head = [note.title, note.excerpt, note.formula, bidaCategoryTitle(note.category)].filter(Boolean).join(' ')
      const whole = score([head, ...note.sections.map((section) => `${section.title} ${section.text}`)].join(' '), matcher)
      // Mọi từ gõ vào đều phải có trong bài (không cần đứng cạnh nhau).
      if (!whole.all) return []

      const scored = note.sections
        .map((section) => ({section, body: score(section.text, matcher), title: score(section.title, matcher)}))
        .filter(({body, title}) => body.points > 0 || title.points > 0)
        .sort((a, b) => b.body.points + b.title.points - (a.body.points + a.title.points))
      // Ưu tiên mục có nguyên cụm từ, rồi tới mục chứa đủ mọi từ; mục chỉ
      // khớp lẻ tẻ chỉ hiện khi không còn gì tốt hơn.
      const exact = scored.filter(({body, title}) => body.points >= 100 || title.points >= 100)
      const complete = scored.filter(({body}) => body.all)
      const best = exact.length > 0 ? exact : complete.length > 0 ? complete : scored
      const snippets = best.slice(0, 3).map(({section, body}) => ({
        sectionId: section.id,
        sectionTitle: section.title,
        text: body.points > 0 ? snippetAt(section.text, body.at) : '',
      }))
      return [{note, matcher, snippets, points: score(head, matcher).points * 2 + whole.points}]
    })
    .sort((a, b) => b.points - a.points)
}

// Tô đậm chỗ khớp. Tìm trên chuỗi đã bỏ dấu, cắt trên chuỗi gốc — hai chuỗi
// dài bằng nhau (xem foldText).
function Highlight({text, matcher}: {text: string; matcher: Matcher}) {
  const source = text.normalize('NFC')
  const folded = foldText(source)
  const marks: [number, number][] = []
  for (const pattern of [matcher.phrase, ...matcher.words]) {
    pattern.lastIndex = 0
    for (let match = pattern.exec(folded); match; match = pattern.exec(folded)) {
      marks.push([match.index, match.index + match[0].length])
      if (match[0].length === 0) pattern.lastIndex++
    }
  }
  marks.sort((a, b) => a[0] - b[0] || b[1] - a[1])

  const parts: React.ReactNode[] = []
  let cursor = 0
  for (const [start, end] of marks) {
    if (start < cursor) continue
    parts.push(source.slice(cursor, start))
    parts.push(
      <mark key={start} className="rounded bg-yellow-200 px-0.5 text-neutral-900">
        {source.slice(start, end)}
      </mark>,
    )
    cursor = end
  }
  parts.push(source.slice(cursor))
  return <>{parts}</>
}

export function NotesBrowser({notes}: {notes: BrowserNote[]}) {
  const pathname = usePathname()
  const [query, setQuery] = useState('')
  // Chỉ hiện chip của nhóm đã có bài — nhóm trống bấm vào chỉ thấy trang rỗng.
  const categories = BIDA_CATEGORIES.filter((category) => notes.some((note) => note.category === category.value))
  const [category, setCategory] = useState<string>()
  const pickCategory = setCategory

  // Bấm kết quả thuộc bài đang mở: chỉ đổi tab, không tải lại gì. Dùng đúng
  // cách ArticleTabs đổi tab (ghi # vào địa chỉ rồi báo hashchange).
  const openSection = (event: React.MouseEvent, slug: string, sectionId: string) => {
    if (pathname !== `/${slug}` || !sectionId) return
    event.preventDefault()
    window.history.replaceState(null, '', `#${sectionId}`)
    window.dispatchEvent(new HashChangeEvent('hashchange'))
    window.scrollTo({top: 0})
  }

  const strict = buildMatcher(query, false)
  const loose = buildMatcher(query, true)
  const strictHits = strict ? search(notes, strict) : []
  const hits = strictHits.length > 0 || !loose ? strictHits : search(notes, loose)
  const matcher = strict
  const shown = category ? notes.filter((note) => note.category === category) : notes

  return (
    <>
      <div className="relative mb-6">
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 fill-none stroke-neutral-400 stroke-2"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Tìm bài, công thức, từ khoá…"
          aria-label="Tìm trong các bài"
          enterKeyHint="search"
          autoComplete="off"
          // 16px: nhỏ hơn thì iPhone tự phóng to trang khi chạm vào ô
          className="h-12 w-full rounded-xl border border-neutral-300 bg-white pl-12 pr-20 text-base text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-brand focus:ring-2 focus:ring-brand/20 [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-2 top-1/2 flex h-9 -translate-y-1/2 cursor-pointer items-center rounded-lg px-3 text-sm font-semibold text-neutral-500 hover:text-neutral-900"
          >
            Xoá
          </button>
        )}
      </div>

      <p aria-live="polite" className="sr-only">
        {matcher ? `${hits.length} bài khớp` : ''}
      </p>

      {matcher ? (
        hits.length === 0 ? (
          <p className="py-16 text-center text-neutral-400">
            Không thấy bài nào có “{query.trim()}”. Thử từ ngắn hơn hoặc gõ không dấu.
          </p>
        ) : (
          <ul className="space-y-4">
            {hits.map(({note, snippets, matcher}) => (
              <li key={note._id} className="rounded-xl border border-neutral-200 p-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-brand">
                  {bidaCategoryTitle(note.category)}
                </p>
                <Link
                  href={`/${note.slug}`}
                  className="mt-2 block text-xl font-semibold leading-snug text-neutral-900 hover:text-neutral-600"
                >
                  <Highlight text={note.title} matcher={matcher} />
                </Link>
                {snippets.length > 0 && (
                  <ul className="mt-3 divide-y divide-neutral-100">
                    {snippets.map((snippet) => (
                      <li key={snippet.sectionId || 'intro'}>
                        <Link
                          href={`/${note.slug}${snippet.sectionId ? `#${snippet.sectionId}` : ''}`}
                          onClick={(event) => openSection(event, note.slug, snippet.sectionId)}
                          className="block py-3 hover:bg-neutral-50"
                        >
                          {snippet.sectionTitle && (
                            <span className="block text-sm font-semibold text-neutral-900">
                              <Highlight text={snippet.sectionTitle} matcher={matcher} /> →
                            </span>
                          )}
                          {snippet.text && (
                            <span className="mt-1 block text-[15px] leading-relaxed text-neutral-600">
                              <Highlight text={snippet.text} matcher={matcher} />
                            </span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )
      ) : (
        <>
          {categories.length >= 2 && (
            // Điện thoại: 1 hàng chip vuốt ngang, tràn sát mép màn hình
            <nav
              aria-label="Nhóm bài"
              className="-mx-6 mb-8 flex gap-2 overflow-x-auto px-6 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
            >
              <button type="button" onClick={() => pickCategory(undefined)} className={chipClass(!category)}>
                Tất cả
              </button>
              {categories.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => pickCategory(item.value)}
                  className={chipClass(category === item.value)}
                >
                  {item.title}
                </button>
              ))}
            </nav>
          )}

          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1 lg:gap-3">
            {shown.map((note) => {
              const extras = [
                note.diagrams > 0 && `${note.diagrams} sơ đồ`,
                note.videos > 0 && `${note.videos} video`,
              ].filter(Boolean)

              return (
                <li key={note._id}>
                  <Link
                    href={`/${note.slug}`}
                    aria-current={pathname === `/${note.slug}` ? 'page' : undefined}
                    className="group flex h-full flex-col rounded-xl border border-neutral-200 p-5 transition hover:border-neutral-400 aria-[current=page]:border-brand aria-[current=page]:bg-brand/5 lg:p-4"
                  >
                    <p className="text-xs font-semibold uppercase tracking-widest text-brand">
                      {bidaCategoryTitle(note.category)}
                    </p>
                    <h2 className="mt-2 text-xl font-semibold leading-snug text-neutral-900 transition-colors group-hover:text-neutral-600 lg:text-lg">
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
        </>
      )}
    </>
  )
}
