import Image from 'next/image'
import type {PortableTextComponents} from '@portabletext/react'
import {getImageDimensions, urlFor} from '@/sanity/lib/image'
import {BidaTable} from './BidaTable'
import {YouTubeEmbed} from './YouTubeEmbed'

// Cách hiển thị từng khối trong nội dung bài: chữ, ảnh, bảng và 3 khối
// riêng của bida — video YouTube, sơ đồ bàn, công thức.
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
    table: ({value}) => {
      if (!value?.rows?.length) return null
      return (
        <div className="my-8 overflow-x-auto">
          <table className="w-full border-collapse border border-neutral-200 text-left text-base">
            <tbody>
              {value.rows.map((row: {_key?: string; cells?: string[]}, rowIndex: number) => (
                <tr key={row._key ?? rowIndex}>
                  {row.cells?.map((cell: string, cellIndex: number) => (
                    <td key={cellIndex} className="border border-neutral-200 px-4 py-2 text-gray-800">
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
    // bàn tỉ lệ 2:1 nên mỗi pixel bề ngang đều quý.
    bidaDiagram: ({value}) => (
      <figure className="-mx-6 my-8 sm:mx-0">
        <BidaTable value={value} />
        {value?.caption && (
          <figcaption className="mt-3 px-6 text-center text-sm italic text-neutral-500 sm:px-0">
            {value.caption}
          </figcaption>
        )}
      </figure>
    ),
    formula: ({value}) => {
      if (!value?.expression) return null
      return (
        <div className="my-8 rounded-lg border border-neutral-200 bg-neutral-50 p-5">
          {value.title && (
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-neutral-400">{value.title}</p>
          )}
          <p className="whitespace-pre-line font-mono text-lg font-semibold leading-relaxed text-neutral-900 [overflow-wrap:anywhere] sm:text-xl">
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
      <h2 className="mb-4 mt-10 text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">{children}</h2>
    ),
    h3: ({children}) => (
      <h3 className="mb-3 mt-8 text-xl font-semibold text-neutral-900 sm:text-2xl">{children}</h3>
    ),
    normal: ({children}) => <p className="mb-6 text-lg leading-relaxed text-gray-800">{children}</p>,
    blockquote: ({children}) => (
      <blockquote className="my-10 border-l-4 border-neutral-900 pl-6 text-xl italic leading-relaxed text-neutral-700">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({children}) => (
      <ul className="mb-6 list-disc space-y-2 pl-6 text-lg leading-relaxed text-gray-800">{children}</ul>
    ),
    number: ({children}) => (
      <ol className="mb-6 list-decimal space-y-2 pl-6 text-lg leading-relaxed text-gray-800">{children}</ol>
    ),
  },
  marks: {
    strong: ({children}) => <strong className="font-semibold text-neutral-900">{children}</strong>,
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
