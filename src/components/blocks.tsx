import Image from 'next/image'
import type {PortableTextComponents} from '@portabletext/react'
import {getImageDimensions, urlFor} from '@/sanity/lib/image'
import {LABEL_COLORS, parseLegend} from '@/lib/bida'
import {BidaTable} from './BidaTable'
import {CueBall} from './CueBall'
import {YouTubeEmbed} from './YouTubeEmbed'

// Ô ghi chú nổi bật. Không cần khối riêng trong Studio: đoạn trích dẫn hoặc
// đoạn văn mở đầu bằng chữ in đậm quen thuộc ("LƯU Ý:", "Cách đơn giản…",
// "Nói gọn:") tự thành ô ghi chú, chữ in đậm đó thành nhãn của ô.
const CALLOUTS = {
  danger: {
    box: 'border-red-500 bg-red-50',
    label: '[&>strong:first-child]:text-red-700',
    icon: 'text-red-600',
    path: 'M12 9v4m0 4h.01M10.3 3.9 2.6 17.2A2 2 0 0 0 4.3 20.2h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z',
  },
  warn: {
    box: 'border-amber-500 bg-amber-50',
    label: '[&>strong:first-child]:text-amber-800',
    icon: 'text-amber-600',
    path: 'M12 9v4m0 4h.01M10.3 3.9 2.6 17.2A2 2 0 0 0 4.3 20.2h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z',
  },
  info: {
    box: 'border-brand bg-brand/5',
    label: '[&>strong:first-child]:text-brand',
    icon: 'text-brand',
    path: 'M12 16v-4m0-4h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
  },
  tip: {
    box: 'border-emerald-500 bg-emerald-50',
    label: '[&>strong:first-child]:text-emerald-800',
    icon: 'text-emerald-600',
    path: 'M9 18h6m-5 3h4M12 3a6 6 0 0 0-4 10.5c.6.6 1 1.3 1 2.1V16h6v-.4c0-.8.4-1.5 1-2.1A6 6 0 0 0 12 3Z',
  },
} as const

type CalloutKind = keyof typeof CALLOUTS

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function leadText(value: any): string {
  const first = value?.children?.[0]
  return first?.marks?.includes('strong') ? String(first.text ?? '').trim() : ''
}

// `label`: chữ in đậm mở đầu thành nhãn nhỏ phía trên (mặc định). Tắt đi khi
// đoạn không mở đầu bằng chữ in đậm, không thì câu in đậm ở giữa bị biến
// thành nhãn.
function Callout({kind, label = true, children}: {kind: CalloutKind; label?: boolean; children: React.ReactNode}) {
  const style = CALLOUTS[kind]
  return (
    <aside className={`my-8 flex gap-3 rounded-xl border-l-4 px-4 py-4 sm:px-5 ${style.box}`}>
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className={`mt-0.5 h-5 w-5 shrink-0 fill-none stroke-current stroke-2 ${style.icon}`}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={style.path} />
      </svg>
      <p
        className={`text-[16px] leading-relaxed text-neutral-800 ${
          label
            ? `[&>strong:first-child]:mb-1 [&>strong:first-child]:block [&>strong:first-child]:text-[13px] [&>strong:first-child]:uppercase [&>strong:first-child]:tracking-wider ${style.label}`
            : ''
        }`}
      >
        {children}
      </p>
    </aside>
  )
}

// Cách hiển thị từng khối trong nội dung bài: chữ, ảnh, bảng và 4 khối
// riêng của bida — video YouTube, sơ đồ bàn, điểm chạm cơ, công thức.
export const portableTextComponents: PortableTextComponents = {
  types: {
    image: ({value}) => {
      const imageUrl = urlFor(value)?.width(1200).fit('max').url()
      if (!imageUrl) return null
      // Kích thước thật của ảnh — trình duyệt giữ chỗ đúng tỉ lệ trong lúc lazy-load.
      const dims = getImageDimensions(value) ?? {width: 1200, height: 800}
      return (
        <figure className="my-8">
          <div className="overflow-hidden rounded-lg bg-neutral-100">
            <Image
              src={imageUrl}
              alt={value.alt || ''}
              width={dims.width}
              height={dims.height}
              sizes="(min-width: 768px) 704px, 100vw"
              className="h-auto w-full"
            />
          </div>
          {value.caption && (
            <figcaption className="mt-3 text-center text-sm italic text-neutral-500">{value.caption}</figcaption>
          )}
        </figure>
      )
    },
    // Hàng đầu của bảng là tiêu đề cột; cột đầu là tên dòng.
    table: ({value}) => {
      const rows: {_key?: string; cells?: string[]}[] = value?.rows ?? []
      if (rows.length === 0) return null
      const [head, ...body] = rows
      return (
        <div className="my-8 overflow-x-auto rounded-xl border border-neutral-200">
          <table className="w-full border-collapse text-left text-[15px] leading-snug">
            <thead>
              <tr className="bg-neutral-100">
                {head.cells?.map((cell, index) => (
                  <th key={index} className="px-4 py-3 text-[13px] font-bold uppercase tracking-wide text-neutral-600">
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((row, rowIndex) => (
                <tr key={row._key ?? rowIndex} className="border-t border-neutral-200 even:bg-neutral-50/60">
                  {row.cells?.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className={`px-4 py-3 align-top ${cellIndex === 0 ? 'font-semibold text-neutral-900' : 'text-neutral-700'}`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    },
    youtube: ({value}) => <YouTubeEmbed url={value?.url} start={value?.start} caption={value?.caption} />,
    // Tràn hết bề ngang màn hình điện thoại (-mx-6 bù padding của trang) —
    // mỗi pixel bề ngang đều quý. Bàn xoay dọc thì giới hạn bề ngang trên
    // màn hình lớn, không thì hình cao hơn cả màn hình.
    bidaDiagram: ({value}) => {
      const legend = parseLegend(value?.legend)
      return (
        <figure className={`-mx-6 my-8 ${value?.portrait ? 'sm:mx-auto sm:max-w-[440px]' : 'sm:mx-0'}`}>
          <BidaTable value={value} />
          {legend.length > 0 && (
            <ul className="mt-4 space-y-1.5 px-6 text-[15px] leading-snug text-gray-800 sm:px-0">
              {legend.map((item) => (
                <li key={item.text} className="flex items-start gap-2.5">
                  <span
                    className="mt-1 h-3.5 w-3.5 shrink-0 rounded-sm"
                    style={{backgroundColor: LABEL_COLORS[item.color]}}
                  />
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          )}
          {value?.caption && (
            <figcaption className="mt-3 px-6 text-center text-sm italic text-neutral-500 sm:px-0">
              {value.caption}
            </figcaption>
          )}
        </figure>
      )
    },
    cueBall: ({value}) => (
      <figure className="my-8">
        <div className="mx-auto max-w-[320px]">
          <CueBall value={value} />
        </div>
        {value?.caption && (
          <figcaption className="mt-3 text-center text-sm italic text-neutral-500">{value.caption}</figcaption>
        )}
      </figure>
    ),
    formula: ({value}) => {
      if (!value?.expression) return null
      return (
        <div className="my-8 rounded-xl border border-brand/25 bg-brand/5 p-5 sm:p-6">
          <p className="mb-3 inline-block rounded-full bg-brand px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest text-white">
            {value.title ? `Công thức · ${value.title}` : 'Công thức'}
          </p>
          <p className="whitespace-pre-line font-mono text-lg font-bold leading-relaxed text-neutral-950 [overflow-wrap:anywhere] [text-wrap:balance] sm:text-2xl">
            {value.expression}
          </p>
          {value.note && (
            <p className="mt-3 whitespace-pre-line text-base leading-relaxed text-neutral-600">{value.note}</p>
          )}
        </div>
      )
    },
  },
  block: {
    h2: ({children}) => (
      <h2 className="mb-5 mt-10 text-[26px] font-bold leading-tight tracking-tight text-neutral-950 sm:text-[32px]">
        {children}
      </h2>
    ),
    h3: ({children}) => (
      <h3 className="mb-3 mt-9 border-l-4 border-brand pl-3 text-xl font-bold leading-snug text-neutral-950 sm:text-[22px]">
        {children}
      </h3>
    ),
    normal: ({children, value}) => {
      const lead = leadText(value)
      if (/^(cách đơn giản|mẹo|ghi nhớ)/i.test(lead)) return <Callout kind="tip">{children}</Callout>
      // "Nói gọn: …" thường viết chữ thường rồi mới in đậm phần kết luận
      const opening = String(value?.children?.[0]?.text ?? '').trim()
      if (/^(nói gọn|tóm lại)/i.test(opening)) {
        return (
          <Callout kind="info" label={false}>
            {children}
          </Callout>
        )
      }
      return <p className="mb-5 text-[17px] leading-[1.75] text-neutral-800">{children}</p>
    },
    blockquote: ({children, value}) => {
      const lead = leadText(value)
      const kind: CalloutKind = /quan trọng/i.test(lead) ? 'danger' : /^lưu ý/i.test(lead) ? 'warn' : 'info'
      return <Callout kind={kind}>{children}</Callout>
    },
  },
  list: {
    bullet: ({children}) => (
      <ul className="mb-6 list-disc space-y-2 pl-6 text-[17px] leading-[1.7] text-neutral-800 marker:text-brand">{children}</ul>
    ),
    number: ({children}) => (
      <ol className="mb-6 list-decimal space-y-2 pl-6 text-[17px] leading-[1.7] text-neutral-800 marker:font-bold marker:text-brand">{children}</ol>
    ),
  },
  marks: {
    strong: ({children}) => <strong className="font-bold text-neutral-950">{children}</strong>,
    em: ({children}) => <em className="italic">{children}</em>,
    underline: ({children}) => <span className="underline">{children}</span>,
    code: ({children}) => (
      <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-base text-neutral-800">{children}</code>
    ),
    link: ({children, value}) => (
      <a
        href={value?.href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-neutral-900 underline decoration-neutral-300 underline-offset-4 [overflow-wrap:anywhere] transition-colors hover:decoration-neutral-900"
      >
        {children}
      </a>
    ),
  },
}
