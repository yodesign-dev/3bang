import {
  parseLabels,
  parsePoint,
  parsePoints,
  TABLE_X,
  TABLE_Y,
  type BidaDiagramValue,
  type Pt,
} from '@/lib/bida'

// Sơ đồ bàn bida vẽ bằng SVG từ toạ độ kim cương. Không dùng hook nào để
// chạy được cả ở trang (server component) lẫn khung xem trước trong Studio.

// 1 kim cương = 100 đơn vị SVG.
const U = 100
const W = TABLE_X * U
const H = TABLE_Y * U
const CUSHION = 10
const WOOD = 44
const FRAME = CUSHION + WOOD
const DIAMOND_OFFSET = CUSHION + WOOD / 2
const AXIS = 36
const BALL_R = 15

const BALL_FILL = {white: '#fafafa', yellow: '#f5c518', red: '#d92b2b'} as const
const PATH_STROKE: Record<string, string> = {
  white: '#ffffff',
  yellow: '#ffd84d',
  red: '#ff8a8a',
  black: '#0b1b2b',
}

type BallName = keyof typeof BALL_FILL

const toSvg = (point: Pt) => ({x: point.x * U, y: (TABLE_Y - point.y) * U})

// Hướng từ điểm trên băng chỉ ra ngoài bàn (theo trục SVG); 0,0 nếu điểm
// nằm giữa mặt bàn.
function outward(point: Pt) {
  return {
    x: point.x <= 0 ? -1 : point.x >= TABLE_X ? 1 : 0,
    y: point.y <= 0 ? 1 : point.y >= TABLE_Y ? -1 : 0,
  }
}

function Diamonds() {
  const dots: {x: number; y: number}[] = []
  for (let i = 1; i < TABLE_X; i++) {
    dots.push({x: i * U, y: -DIAMOND_OFFSET}, {x: i * U, y: H + DIAMOND_OFFSET})
  }
  for (let i = 1; i < TABLE_Y; i++) {
    dots.push({x: -DIAMOND_OFFSET, y: i * U}, {x: W + DIAMOND_OFFSET, y: i * U})
  }
  return (
    <g fill="#f3ead8">
      {dots.map((dot) => (
        <circle key={`${dot.x}:${dot.y}`} cx={dot.x} cy={dot.y} r={5} />
      ))}
    </g>
  )
}

function Axis() {
  return (
    <g fill="currentColor" fontSize={24} textAnchor="middle" dominantBaseline="central">
      {Array.from({length: TABLE_X + 1}, (_, i) => (
        <text key={`x${i}`} x={i * U} y={H + FRAME + AXIS / 2}>
          {i}
        </text>
      ))}
      {Array.from({length: TABLE_Y + 1}, (_, i) => (
        <text key={`y${i}`} x={-FRAME - AXIS / 2} y={(TABLE_Y - i) * U}>
          {i}
        </text>
      ))}
    </g>
  )
}

export function BidaTable({value, axis}: {value?: BidaDiagramValue; axis?: boolean}) {
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

  const labels = parseLabels(value?.labels)
  const showAxis = axis ?? value?.showAxis ?? false
  const numberHits = value?.numberHits ?? true

  const left = -FRAME - (showAxis ? AXIS : 0)
  const viewBox = `${left} ${-FRAME} ${W + FRAME - left} ${H + FRAME * 2 + (showAxis ? AXIS : 0)}`

  // Chạm băng thứ mấy — đánh số liên tục qua mọi điểm trên băng của đường đầu tiên.
  const hits = numberHits
    ? (paths[0]?.points ?? []).slice(1).filter((point) => {
        const out = outward(point)
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
      <Diamonds />
      {showAxis && <Axis />}

      {paths.map((path) => {
        const stroke = PATH_STROKE[path.color ?? ''] ?? PATH_STROKE.white
        const svgPoints = path.points.map(toSvg)
        const end = svgPoints[svgPoints.length - 1]
        const prev = svgPoints[svgPoints.length - 2]
        const length = Math.hypot(end.x - prev.x, end.y - prev.y) || 1
        const ux = (end.x - prev.x) / length
        const uy = (end.y - prev.y) / length
        // Đường kết thúc ngay tại 1 viên bi thì lùi mũi tên ra mép bi cho khỏi bị che.
        const endsOnBall = balls.some((ball) => {
          const centre = toSvg(ball.point)
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

      {balls.map((ball) => {
        const centre = toSvg(ball.point)
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
          const out = outward(point)
          const at = toSvg(point)
          return (
            <text
              key={index}
              x={at.x - out.x * 30}
              y={at.y - out.y * 30}
              fill="#ffffff"
              stroke="#12406b"
              strokeWidth={7}
            >
              {index + 1}
            </text>
          )
        })}
        {labels.map((label, index) => {
          const out = outward(label.point)
          const onRail = out.x !== 0 || out.y !== 0
          const at = toSvg(label.point)
          return (
            <text
              key={index}
              x={at.x + out.x * DIAMOND_OFFSET}
              y={at.y + out.y * DIAMOND_OFFSET}
              fill={onRail ? '#fff3d6' : '#ffffff'}
              stroke={onRail ? '#4a2f1d' : '#12406b'}
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
