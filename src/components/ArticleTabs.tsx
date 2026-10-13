'use client'

import {useEffect, useRef, useSyncExternalStore} from 'react'

// Bài dài được chia thành tab theo tiêu đề lớn. Tab đang mở nằm trong phần
// # của địa chỉ (vd. /he-50#cong-thuc) để chia sẻ link hoặc mở từ ô tìm kiếm
// là vào đúng tab. Mọi tab đều có sẵn trong HTML, tab không mở chỉ bị ẩn.

const HASH_EVENT = 'hashchange'

function subscribe(onChange: () => void) {
  window.addEventListener(HASH_EVENT, onChange)
  return () => window.removeEventListener(HASH_EVENT, onChange)
}

const readHash = () => decodeURIComponent(window.location.hash.slice(1))

export function ArticleTabs({
  tabs,
  panels,
}: {
  tabs: {id: string; label: string}[]
  panels: React.ReactNode[]
}) {
  const hash = useSyncExternalStore(subscribe, readHash, () => '')
  const active = Math.max(
    0,
    tabs.findIndex((tab) => tab.id === hash),
  )
  const wrapperRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLDivElement>(null)

  // Mở bài từ link có # bằng điều hướng trong trang (vd. từ kết quả tìm kiếm):
  // lúc vẽ lần đầu địa chỉ có thể chưa kịp đổi, nên đọc lại # sau khi vẽ xong.
  useEffect(() => {
    const recheck = () => window.dispatchEvent(new HashChangeEvent(HASH_EVENT))
    const timers = [window.setTimeout(recheck, 0), window.setTimeout(recheck, 200)]
    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [])

  // Giữ tab đang mở nằm giữa thanh tab khi thanh phải vuốt ngang.
  useEffect(() => {
    const bar = barRef.current
    const button = bar?.querySelector<HTMLElement>('[aria-selected="true"]')
    if (!bar || !button) return
    bar.scrollTo({left: button.offsetLeft - (bar.clientWidth - button.clientWidth) / 2, behavior: 'smooth'})
  }, [active])

  const select = (index: number) => {
    const tab = tabs[index]
    if (!tab) return
    window.history.replaceState(null, '', `#${tab.id}`)
    window.dispatchEvent(new HashChangeEvent(HASH_EVENT))
    // Đang đọc dở giữa tab cũ thì đưa về đầu tab mới.
    const top = (wrapperRef.current?.getBoundingClientRect().top ?? 0) + window.scrollY
    if (window.scrollY > top) window.scrollTo({top})
  }

  const onKeyDown = (event: React.KeyboardEvent) => {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
    if (!step) return
    event.preventDefault()
    const next = (active + step + tabs.length) % tabs.length
    select(next)
    barRef.current?.querySelectorAll<HTMLElement>('[role="tab"]')[next]?.focus()
  }

  return (
    <div ref={wrapperRef}>
      <div
        ref={barRef}
        role="tablist"
        aria-label="Các phần của bài"
        onKeyDown={onKeyDown}
        className="sticky top-0 z-10 -mx-6 flex gap-1 overflow-x-auto border-b border-neutral-200 bg-white px-6 [scrollbar-width:none] sm:mx-0 sm:px-0"
      >
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={index === active}
            aria-controls={`panel-${tab.id}`}
            tabIndex={index === active ? 0 : -1}
            onClick={() => select(index)}
            className={`min-h-12 shrink-0 cursor-pointer border-b-2 px-3 text-[15px] font-semibold transition ${
              index === active
                ? 'border-brand text-brand'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {panels.map((panel, index) => {
        const tab = tabs[index]
        const prev = tabs[index - 1]
        const next = tabs[index + 1]
        return (
          <div
            key={tab.id}
            role="tabpanel"
            id={`panel-${tab.id}`}
            aria-labelledby={`tab-${tab.id}`}
            hidden={index !== active}
            className="pt-2"
          >
            {panel}
            <div className="mt-10 flex justify-between gap-3 border-t border-neutral-200 pt-6">
              {prev ? (
                <button
                  type="button"
                  onClick={() => select(index - 1)}
                  className="min-h-12 cursor-pointer rounded-lg border border-neutral-200 px-4 text-left text-sm font-semibold text-neutral-700 transition hover:border-neutral-400"
                >
                  ← {prev.label}
                </button>
              ) : (
                <span />
              )}
              {next && (
                <button
                  type="button"
                  onClick={() => select(index + 1)}
                  className="min-h-12 cursor-pointer rounded-lg bg-brand px-4 text-right text-sm font-semibold text-white transition hover:opacity-90"
                >
                  Tiếp: {next.label} →
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
