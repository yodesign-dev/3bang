// Dùng chung cho schema trong Studio, trang danh sách, trang bài và khối sơ
// đồ bàn. Không import gì của Next/Sanity để Studio (client) và trang
// (server) cùng dùng được.

export const BIDA_TITLE = 'Bida 3 băng'

// Domain chính thức — dùng cho canonical, sitemap, ảnh chia sẻ.
export const BIDA_URL = 'https://3bang.applebin.me'
export const BIDA_DESCRIPTION =
  'Tổng hợp hệ thống, công thức, kỹ thuật và thế bóng mẫu của bida carom 3 băng — có sơ đồ bàn và video minh hoạ.'

export const BIDA_CATEGORIES = [
  {title: 'Hệ thống & công thức', value: 'system'},
  {title: 'Kỹ thuật', value: 'technique'},
  {title: 'Thế bóng mẫu', value: 'position'},
  {title: 'Bài tập', value: 'drill'},
  {title: 'Luật & kiến thức chung', value: 'basics'},
] as const

// Ảnh chia sẻ tạo động (src/app/og/route.tsx).
export function bidaOgImage(title?: string, kind?: string) {
  const params = new URLSearchParams()
  if (title) params.set('title', title)
  if (kind) params.set('kind', kind)
  const query = params.toString()
  return `/og${query ? `?${query}` : ''}`
}

export function bidaCategoryTitle(value?: string) {
  return BIDA_CATEGORIES.find((category) => category.value === value)?.title ?? 'Khác'
}

// --- Sơ đồ bàn -------------------------------------------------------------
// Toạ độ tính bằng kim cương: gốc 0,0 ở góc dưới trái, x chạy 0–8 theo băng
// dài, y chạy 0–4 theo băng ngắn. Điểm nằm trên băng là x = 0/8 hoặc y = 0/4.

export const TABLE_X = 8
export const TABLE_Y = 4

export type Pt = {x: number; y: number}

export type BidaDiagramPath = {
  _key?: string
  points?: string
  from?: string
  color?: string
  dashed?: boolean
}

export type BidaDiagramValue = {
  white?: string
  yellow?: string
  red?: string
  paths?: BidaDiagramPath[]
  labels?: string
  showAxis?: boolean
  numberHits?: boolean
  caption?: string
}

const POINT = /(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)/

function inTable(point: Pt) {
  return point.x >= 0 && point.x <= TABLE_X && point.y >= 0 && point.y <= TABLE_Y
}

// "2,1.5" → {x: 2, y: 1.5}; sai dạng hoặc nằm ngoài bàn → null.
export function parsePoint(input?: string): Pt | null {
  const match = input?.trim().match(new RegExp(`^${POINT.source}$`))
  if (!match) return null
  const point = {x: Number(match[1]), y: Number(match[2])}
  return inTable(point) ? point : null
}

// "1,1 > 8,2.5 > 5,4" → 3 điểm. Ngăn cách bằng gì cũng được (dấu cách, >, →),
// chỉ cần mỗi điểm đúng dạng x,y.
export function parsePoints(input?: string): Pt[] {
  return [...(input ?? '').matchAll(new RegExp(POINT.source, 'g'))]
    .map((match) => ({x: Number(match[1]), y: Number(match[2])}))
    .filter(inTable)
}

// Mỗi dòng 1 nhãn: "0,3 30" → chữ "30" đặt tại điểm 0,3.
export function parseLabels(input?: string): {point: Pt; text: string}[] {
  return (input ?? '')
    .split('\n')
    .map((line) => {
      const match = line.trim().match(new RegExp(`^${POINT.source}\\s+(.+)$`))
      if (!match) return null
      const point = {x: Number(match[1]), y: Number(match[2])}
      return inTable(point) ? {point, text: match[3].trim()} : null
    })
    .filter((label) => label !== null)
}

// --- YouTube ---------------------------------------------------------------

// "90", "1m30s", "1h2m3s" → số giây.
function parseSeconds(value: string | null): number {
  if (!value) return 0
  if (/^\d+$/.test(value)) return Number(value)
  const match = value.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/)
  if (!match) return 0
  return Number(match[1] ?? 0) * 3600 + Number(match[2] ?? 0) * 60 + Number(match[3] ?? 0)
}

// Nhận mọi dạng link YouTube hay gặp (watch, youtu.be, shorts, live, embed).
// `vertical` = Shorts, khung dọc 9:16.
export function parseYouTube(url?: string): {id: string; start: number; vertical: boolean} | null {
  if (!url) return null
  let parsed: URL
  try {
    parsed = new URL(url.trim())
  } catch {
    return null
  }

  const host = parsed.hostname.replace(/^(www|m)\./, '')
  const segments = parsed.pathname.split('/').filter(Boolean)
  let id: string | null = null
  let vertical = false

  if (host === 'youtu.be') {
    id = segments[0] ?? null
  } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (segments[0] === 'watch') id = parsed.searchParams.get('v')
    else if (['shorts', 'embed', 'live'].includes(segments[0])) {
      id = segments[1] ?? null
      vertical = segments[0] === 'shorts'
    }
  }

  if (!id || !/^[\w-]{11}$/.test(id)) return null
  const start = parseSeconds(parsed.searchParams.get('t') ?? parsed.searchParams.get('start'))
  return {id, start, vertical}
}

// --- Điểm chạm cơ (phê) ----------------------------------------------------
// Nhìn trái bi cái từ phía sau cơ như mặt đồng hồ. Mỗi dòng 1 điểm chạm:
// "giờ độ-lệch nhãn", vd. "3 1 Phê phải". Giờ từ 0 đến 12 (2.5 = 2 giờ rưỡi);
// độ lệch tính bằng số đầu cơ kể từ tâm (0 = đúng tâm, tối đa 1.4 — xa hơn
// là trượt cơ).

export const MAX_TIP_OFFSET = 1.4

export type CueTip = {clock: number; offset: number; label: string}

export function parseCueTips(input?: string): CueTip[] {
  return (input ?? '')
    .split('\n')
    .map((line) => {
      const match = line.trim().match(/^(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)(?:\s+(.*))?$/)
      if (!match) return null
      const clock = Number(match[1])
      const offset = Number(match[2])
      if (clock > 12 || offset > MAX_TIP_OFFSET) return null
      return {clock, offset, label: (match[3] ?? '').trim()}
    })
    .filter((tip) => tip !== null)
}

// --- Tab trong bài và tìm kiếm ---------------------------------------------

// Bỏ dấu tiếng Việt và viết thường, GIỮ NGUYÊN độ dài chuỗi (mỗi ký tự ra đúng
// 1 ký tự) để vị trí tìm thấy trên chuỗi đã bỏ dấu dùng được trên chuỗi gốc.
// Nhờ vậy gõ "ep phe" vẫn ra "ép phê".
export function foldText(input: string): string {
  let out = ''
  for (const char of input.normalize('NFC')) {
    const base = char === 'đ' || char === 'Đ' ? 'd' : char.normalize('NFD')[0]
    out += char.length === 1 ? base.toLowerCase() : char
  }
  return out
}

export function slugify(input: string): string {
  return foldText(input)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Block = any

// Chữ đọc được của 1 khối nội dung, để tìm kiếm.
function blockText(block: Block): string {
  switch (block?._type) {
    case 'block':
      return (block.children ?? []).map((child: {text?: string}) => child.text ?? '').join('')
    case 'formula':
      return [block.title, block.expression, block.note].filter(Boolean).join('. ')
    case 'table':
      return (block.rows ?? []).map((row: {cells?: string[]}) => (row.cells ?? []).join(' · ')).join('. ')
    case 'cueBall':
      return [...parseCueTips(block.tips).map((tip) => tip.label), block.caption].filter(Boolean).join('. ')
    default:
      return block?.caption ?? ''
  }
}

export type NoteSection = {id: string; title: string; label: string; text: string; blocks: Block[]}

// Cắt nội dung bài thành từng phần theo tiêu đề lớn (H2). Mỗi phần là 1 tab
// ở trang bài và 1 đơn vị kết quả ở ô tìm kiếm. Chữ đứng trước tiêu đề đầu
// tiên (nếu có) thành phần mở đầu, id rỗng.
export function splitSections(body: Block[] | undefined): NoteSection[] {
  const sections: NoteSection[] = []
  for (const block of body ?? []) {
    const isHeading = block?._type === 'block' && block.style === 'h2'
    if (isHeading || sections.length === 0) {
      const title = isHeading ? blockText(block).trim() : ''
      // Nhãn tab lấy phần trước dấu hai chấm: "Ép phê: chạm cơ vào đâu…" → "Ép phê"
      const label = title.split(':')[0].trim()
      let id = slugify(label)
      while (id && sections.some((section) => section.id === id)) id += '-2'
      sections.push({id, title, label, text: '', blocks: []})
    }
    const section = sections[sections.length - 1]
    section.blocks.push(block)
    if (!isHeading) section.text += `${blockText(block)} `
  }
  return sections.map((section) => ({...section, text: section.text.replace(/\s+/g, ' ').trim()}))
}
