import {
  LABEL_COLORS,
  parseLabels,
  parseTableTips,
  parseZones,
  parsePoint,
  parsePoints,
  TABLE_X,
  TABLE_Y,
  type BidaDiagramValue,
  type Pt,
} from '@/lib/bida'

// Sơ đồ bàn bida vẽ bằng SVG từ toạ độ kim cương. Không dùng hook nào để
// chạy được cả ở trang (server component) lẫn khung xem trước trong Studio.
//
// Toạ độ nhập luôn là x theo băng dài (0–8), y theo băng ngắn (0–4), gốc ở
// góc dưới trái. Bàn nằm ngang hay xoay dọc chỉ khác ở 2 hàm đổi toạ độ
// `toSvg` và `outward` bên dưới; mọi thứ khác vẽ theo toạ độ bàn.

// 1 kim cương = 100 đơn vị SVG.
const U = 100
const CUSHION = 10
const WOOD = 44
const FRAME = CUSHION + WOOD
const DIAMOND_OFFSET = CUSHION + WOOD / 2
// Lề ngoài khung bàn, cho số toạ độ và các nhãn có màu ghi bên ngoài bàn
const MARGIN = 62
const BALL_R = 15
// Trái bi nhỏ chỉ điểm chạm cơ đặt trên mặt bàn
const TIP_R = 62

const BALL_FILL = {white: '#fafafa', yellow: '#f5c518', red: '#d92b2b'} as const
// Màu tô vùng trên mặt nỉ: nhạt hơn màu nhãn để số và đường bi vẫn nổi
const ZONE_FILL: Record<string, string> = {
  vang: '#c9cf5f',
  lam: '#8ec0ee',
  xanh: '#58a97a',
  do: '#e58a8a',
  den: '#64748b',
}
const PATH_STROKE: Record<string, string> = {
  white: '#ffffff',
  yellow: '#ffd84d',
  red: '#ff8a8a',
  black: '#0b1b2b',
}

type BallName = keyof typeof BALL_FILL
type Xy = {x: number; y: number}

// Bàn dọc: băng dài đứng thẳng, góc 0,0 vẫn ở dưới bên trái.
const toSvg = (point: Pt, portrait: boolean): Xy =>
  portrait ? {x: point.y * U, y: (TABLE_X - point.x) * U} : {x: point.x * U, y: (TABLE_Y - point.y) * U}

// Hướng từ điểm trên băng chỉ ra ngoài bàn (theo trục SVG); 0,0 nếu điểm
// nằm giữa mặt bàn.
function outward(point: Pt, portrait: boolean): Xy {
  const alongLong = point.x <= 0 ? -1 : point.x >= TABLE_X ? 1 : 0
  const alongShort = point.y <= 0 ? -1 : point.y >= TABLE_Y ? 1 : 0
  return portrait ? {x: alongShort, y: -alongLong} : {x: alongLong, y: -alongShort}
}

const pushed = (point: Pt, portrait: boolean, distance: number): Xy => {
  const at = toSvg(point, portrait)
  const out = outward(point, portrait)
  return {x: at.x + out.x * distance, y: at.y + out.y * distance}
}

// Các điểm có kim cương: 7 hạt mỗi băng dài, 3 hạt mỗi băng ngắn.
const DIAMONDS: Pt[] = [
  ...Array.from({length: TABLE_X - 1}, (_, i) => [
    {x: i + 1, y: 0},
    {x: i + 1, y: TABLE_Y},
  ]).flat(),
  ...Array.from({length: TABLE_Y - 1}, (_, i) => [
    {x: 0, y: i + 1},
    {x: TABLE_X, y: i + 1},
  ]).flat(),
]

export function BidaTable({value, axis}: {value?: BidaDiagramValue; axis?: boolean}) {
  const portrait = value?.portrait ?? false
  const W = (portrait ? TABLE_Y : TABLE_X) * U
  const H = (portrait ? TABLE_X : TABLE_Y) * U

  const balls = (['white', 'yellow', 'red'] as BallName[])
    .map((name) => ({name, point: parsePoint(value?.[name])}))
    .filter((ball): ball is {name: BallName; point: Pt} => ball.point !== null)

  const paths = (value?.paths ?? [])
    .map((path, index) => {
      const start = balls.find((ball) => ball.name === path.from)?.point
      const points = [...(start ? [start] : []), ...parsePoints(path.points)]
      return {key: path._key ?? String(index), points, color: path.color, dashed: path.dashed}
    })
    .filter((path) => path.points.length >= 2)

  const labels = parseLabels(value?.labels).map((label) => {
    const out = outward(label.point, portrait)
    return {...label, onRail: out.x !== 0 || out.y !== 0}
  })
  const showAxis = axis ?? value?.showAxis ?? false
  const numberHits = value?.numberHits ?? true
  // Nhãn có màu nằm trên băng được ghi ra ngoài khung bàn → cần chừa lề.
  const margin = showAxis || labels.some((label) => label.onRail && label.color) ? MARGIN : 0
  const edge = FRAME + margin
  const viewBox = `${-edge} ${-edge} ${W + edge * 2} ${H + edge * 2}`

  // Chạm băng thứ mấy — đánh số liên tục qua mọi điểm trên băng của đường đầu tiên.
  const hits = numberHits
    ? (paths[0]?.points ?? []).slice(1).filter((point) => {
        const out = outward(point, portrait)
        return out.x !== 0 || out.y !== 0
      })
    : []

  return (
    <svg
      viewBox={viewBox}
      role="img"
      aria-label={value?.caption || 'Sơ đồ bàn bida 3 băng'}
      className="block h-auto w-full text-neutral-500"
      fontFamily="ui-sans-serif, system-ui, sans-serif"
    >
      <rect x={-FRAME} y={-FRAME} width={W + FRAME * 2} height={H + FRAME * 2} rx={18} fill="#4a2f1d" />
      <rect x={-CUSHION} y={-CUSHION} width={W + CUSHION * 2} height={H + CUSHION * 2} fill="#1f5a94" />
      <rect x={0} y={0} width={W} height={H} fill="#2b74b8" />

      {parseZones(value?.zones).map((zone, index) => (
        <polygon
          key={index}
          points={zone.points
            .map((point) => toSvg(point, portrait))
            .map((at) => `${at.x},${at.y}`)
            .join(' ')}
          fill={ZONE_FILL[zone.color]}
          stroke="#12406b"
          strokeWidth={2}
        />
      ))}

      <g fill="#f3ead8">
        {DIAMONDS.map((point) => {
          const at = pushed(point, portrait, DIAMOND_OFFSET)
          return <circle key={`${point.x}:${point.y}`} cx={at.x} cy={at.y} r={5} />
        })}
      </g>

      {showAxis && (
        <g fill="currentColor" fontSize={24} textAnchor="middle" dominantBaseline="central">
          {Array.from({length: TABLE_X + 1}, (_, i) => {
            const at = toSvg({x: i, y: 0}, portrait)
            const out = outward({x: 1, y: 0}, portrait)
            return (
              <text key={`x${i}`} x={at.x + out.x * (FRAME + MARGIN / 2)} y={at.y + out.y * (FRAME + MARGIN / 2)}>
                {i}
              </text>
            )
          })}
          {Array.from({length: TABLE_Y + 1}, (_, i) => {
            const at = toSvg({x: 0, y: i}, portrait)
            const out = outward({x: 0, y: 1}, portrait)
            return (
              <text key={`y${i}`} x={at.x + out.x * (FRAME + MARGIN / 2)} y={at.y + out.y * (FRAME + MARGIN / 2)}>
                {i}
              </text>
            )
          })}
        </g>
      )}

      {paths.map((path) => {
        const stroke = PATH_STROKE[path.color ?? ''] ?? PATH_STROKE.white
        const svgPoints = path.points.map((point) => toSvg(point, portrait))
        const end = svgPoints[svgPoints.length - 1]
        const prev = svgPoints[svgPoints.length - 2]
        const length = Math.hypot(end.x - prev.x, end.y - prev.y) || 1
        const ux = (end.x - prev.x) / length
        const uy = (end.y - prev.y) / length
        // Đường kết thúc ngay tại 1 viên bi thì lùi mũi tên ra mép bi cho khỏi bị che.
        const endsOnBall = balls.some((ball) => {
          const centre = toSvg(ball.point, portrait)
          return Math.hypot(centre.x - end.x, centre.y - end.y) < BALL_R
        })
        const pull = endsOnBall ? BALL_R + 2 : 0
        const tip = {x: end.x - ux * pull, y: end.y - uy * pull}
        const base = {x: tip.x - ux * 26, y: tip.y - uy * 26}
        const line = [...svgPoints.slice(0, -1), {x: tip.x - ux * 20, y: tip.y - uy * 20}]

        return (
          <g key={path.key}>
            <polyline
              points={line.map((point) => `${point.x},${point.y}`).join(' ')}
              fill="none"
              stroke={stroke}
              strokeWidth={5}
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeDasharray={path.dashed ? '16 14' : undefined}
            />
            <polygon
              points={`${tip.x},${tip.y} ${base.x - uy * 11},${base.y + ux * 11} ${base.x + uy * 11},${base.y - ux * 11}`}
              fill={stroke}
            />
          </g>
        )
      })}

      {parseTableTips(value?.tips).map((tip, index) => {
        const centre = toSvg(tip.point, portrait)
        const radians = (tip.angle * Math.PI) / 180
        // 3 đầu cơ = vòng thứ 3 trong 5 vòng
        const dot = {x: centre.x + Math.sin(radians) * TIP_R * 0.6, y: centre.y - Math.cos(radians) * TIP_R * 0.6}
        return (
          <g key={index}>
            <circle cx={centre.x} cy={centre.y} r={TIP_R} fill="#ffffff" fillOpacity={0.92} stroke="#171717" strokeWidth={2} />
            <g fill="none" stroke="#171717" strokeOpacity={0.45} strokeWidth={1}>
              {[1, 2, 3, 4].map((ring) => (
                <circle key={ring} cx={centre.x} cy={centre.y} r={(TIP_R * ring) / 5} />
              ))}
              {Array.from({length: 8}, (_, spoke) => {
                const angle = (spoke * Math.PI) / 8
                const dx = Math.sin(angle) * TIP_R
                const dy = Math.cos(angle) * TIP_R
                return <line key={spoke} x1={centre.x - dx} y1={centre.y - dy} x2={centre.x + dx} y2={centre.y + dy} />
              })}
            </g>
            <circle cx={dot.x} cy={dot.y} r={9} fill="#e11d2a" />
          </g>
        )
      })}

      {balls.map((ball) => {
        const centre = toSvg(ball.point, portrait)
        return (
          <circle
            key={ball.name}
            cx={centre.x}
            cy={centre.y}
            r={BALL_R}
            fill={BALL_FILL[ball.name]}
            stroke="#0b1b2b"
            strokeWidth={2}
          />
        )
      })}

      <g fontSize={28} fontWeight={700} textAnchor="middle" dominantBaseline="central" paintOrder="stroke">
        {hits.map((point, index) => {
          const at = pushed(point, portrait, -30)
          return (
            <text key={index} x={at.x} y={at.y} fill="#ffffff" stroke="#12406b" strokeWidth={7}>
              {index + 1}
            </text>
          )
        })}
        {labels.map((label, index) => {
          const color = label.color && LABEL_COLORS[label.color]
          // Trên băng + có màu: ghi ra ngoài khung bàn, trên nền trang
          if (label.onRail && color) {
            // Số ở góc bàn xếp thẳng cột với các số dọc băng dài, không đẩy chéo ra xa
            const onLongRail = label.point.y <= 0 || label.point.y >= TABLE_Y
            const anchor = onLongRail ? {x: Math.min(Math.max(label.point.x, 0.001), TABLE_X - 0.001), y: label.point.y} : label.point
            const at = pushed(anchor, portrait, FRAME + MARGIN / 2)
            if (label.color === 'vang') {
              const width = label.text.length * 13 + 12
              return (
                <g key={index} fontSize={22}>
                  <rect x={at.x - width / 2} y={at.y - 17} width={width} height={34} rx={17} fill={color} />
                  <text x={at.x} y={at.y + 1} fill="#171717">
                    {label.text}
                  </text>
                </g>
              )
            }
            return (
              <text key={index} x={at.x} y={at.y} fill={color} fontSize={27}>
                {label.text}
              </text>
            )
          }
          // Trên mặt nỉ + có màu: ô màu chữ trắng
          if (color) {
            const at = toSvg(label.point, portrait)
            const width = label.text.length * 15 + 16
            return (
              <g key={index} fontSize={24}>
                <rect x={at.x - width / 2} y={at.y - 18} width={width} height={36} rx={8} fill={color} />
                <text x={at.x} y={at.y + 1} fill={label.color === 'vang' ? '#171717' : '#ffffff'}>
                  {label.text}
                </text>
              </g>
            )
          }
          const at = pushed(label.point, portrait, label.onRail ? DIAMOND_OFFSET : 0)
          return (
            <text
              key={index}
              x={at.x}
              y={at.y}
              fill={label.onRail ? '#fff3d6' : '#ffffff'}
              stroke={label.onRail ? '#4a2f1d' : '#12406b'}
              strokeWidth={9}
            >
              {label.text}
            </text>
          )
        })}
      </g>
    </svg>
  )
}
