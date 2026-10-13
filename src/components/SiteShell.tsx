'use client'

import {useSelectedLayoutSegment} from 'next/navigation'

// Khung 2 cột trên màn hình lớn: danh sách bài đứng yên bên trái, bài đang
// đọc bên phải. Trên điện thoại chỉ hiện 1 trong 2: trang chủ là danh sách,
// trang bài là bài.
export function SiteShell({sidebar, children}: {sidebar: React.ReactNode; children: React.ReactNode}) {
  // null = trang chủ; còn lại là slug của bài đang mở
  const isHome = useSelectedLayoutSegment() === null

  return (
    <div className="lg:grid lg:grid-cols-[380px_minmax(0,1fr)]">
      <aside
        className={`bg-white lg:sticky lg:top-0 lg:block lg:h-screen lg:overflow-y-auto lg:border-r lg:border-neutral-200 ${
          isHome ? '' : 'hidden'
        }`}
      >
        {sidebar}
      </aside>
      <div className={`min-w-0 flex-col lg:flex lg:min-h-screen ${isHome ? 'hidden' : 'flex min-h-screen'}`}>
        {children}
      </div>
    </div>
  )
}
