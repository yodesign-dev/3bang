'use client'

import Image from 'next/image'
import {useState} from 'react'
import {parseYouTube} from '@/lib/bida'

// Chỉ hiện ảnh bìa + nút play; bấm mới tải player của YouTube. Một bài có
// 3–4 video mà nhúng thẳng iframe thì trang nặng thêm vài MB — quá tệ trên 4G.
export function YouTubeEmbed({url, start, caption}: {url?: string; start?: number; caption?: string}) {
  const [playing, setPlaying] = useState(false)
  const video = parseYouTube(url)
  if (!video) return null

  const startAt = start ?? video.start
  const params = new URLSearchParams({autoplay: '1', playsinline: '1', rel: '0'})
  if (startAt > 0) params.set('start', String(startAt))
  const watchUrl = `https://www.youtube.com/watch?v=${video.id}${startAt > 0 ? `&t=${startAt}s` : ''}`

  return (
    <figure className="my-8">
      <div
        className={`relative overflow-hidden rounded-lg bg-neutral-900 ${
          video.vertical ? 'mx-auto aspect-[9/16] max-w-[260px]' : 'aspect-video'
        }`}
      >
        {playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video.id}?${params}`}
            title={caption || 'Video YouTube'}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={`Phát video${caption ? `: ${caption}` : ''}`}
            className="group absolute inset-0 h-full w-full cursor-pointer"
          >
            <Image
              src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`}
              alt=""
              fill
              sizes="(min-width: 768px) 704px, 100vw"
              className="object-cover opacity-90 transition group-hover:opacity-100"
            />
            <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/70 transition group-hover:bg-brand">
              <svg viewBox="0 0 24 24" className="ml-1 h-7 w-7 fill-white" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </button>
        )}
      </div>
      <figcaption className="mt-3 text-center text-sm text-neutral-500">
        {caption && <span className="italic">{caption} · </span>}
        <a
          href={watchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-neutral-300 underline-offset-4 hover:decoration-neutral-900"
        >
          Mở trên YouTube ↗
        </a>
      </figcaption>
    </figure>
  )
}
