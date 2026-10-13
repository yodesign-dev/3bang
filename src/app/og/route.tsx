import {ImageResponse} from 'next/og'
import {BIDA_TITLE, BIDA_URL} from '@/lib/bida'

// Ảnh Open Graph 1200×630 cho link chia sẻ (Zalo, Facebook…):
// /og                        → ảnh mặc định của trang
// /og?title=...&kind=Kỹ thuật → ảnh cho từng bài
export function GET(request: Request) {
  const {searchParams} = new URL(request.url)
  const title = searchParams.get('title')?.slice(0, 140) ?? 'Hệ thống, công thức và thế bóng mẫu'
  const kind = searchParams.get('kind')?.slice(0, 40)

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          backgroundColor: '#1f5a94',
          color: 'white',
        }}
      >
        <div style={{display: 'flex', fontSize: 28, letterSpacing: 4, opacity: 0.8}}>
          {BIDA_TITLE.toUpperCase()}
        </div>

        <div style={{display: 'flex', flexDirection: 'column'}}>
          {kind && (
            <div style={{display: 'flex', fontSize: 30, color: '#ffd84d', marginBottom: 20}}>{kind}</div>
          )}
          <div style={{display: 'flex', fontSize: title.length > 70 ? 56 : 72, lineHeight: 1.1, letterSpacing: -2}}>
            {title}
          </div>
        </div>

        <div style={{display: 'flex', fontSize: 28, opacity: 0.8}}>{new URL(BIDA_URL).host}</div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {'Cache-Control': 'public, max-age=86400, s-maxage=31536000, immutable'},
    }
  )
}
