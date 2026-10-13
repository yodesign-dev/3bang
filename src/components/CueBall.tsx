import {CUE_RINGS, parseCueTips} from '@/lib/bida'

// Hình trái bi cái nhìn từ phía sau cơ, chia lưới vòng tròn + tia như bia
// bắn, chấm đỏ đánh dấu điểm chạm của đầu cơ. Không dùng hook nào để chạy
// được cả ở trang lẫn khung xem trước trong Studio.

const SIZE = 360
const C = SIZE / 2
const R = 140
// Thang −4…4 ghi quanh nửa trên mặt bi: 0 = 12 giờ, ±4 = 3 giờ / 9 giờ
const SCALE = [-4, -3, -2, -1, 0, 1, 2, 3, 4]
const SPOKES = 16
const RED = '#e11d2a'

// Góc tính bằng độ, 0 ở chính giữa phía trên, quay theo chiều kim đồng hồ.
const polar = (angle: number, distance: number) => {
  const radians = (angle * Math.PI) / 180
  return {x: C + Math.sin(radians) * distance, y: C - Math.cos(radians) * distance}
}

export function CueBall({value}: {value?: {tips?: string; caption?: string}}) {
  const tips = parseCueTips(value?.tips).map((tip, index) => ({...tip, mark: tip.mark ?? String(index + 1)}))
  const legend = tips.filter((tip) => tip.label)

  return (
    <div>
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="img"
        aria-label={value?.caption || 'Điểm chạm cơ trên bi cái'}
        className="block h-auto w-full"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        <circle cx={C} cy={C} r={R} fill="#ffffff" stroke="#171717" strokeWidth={2} />
        <g fill="none" stroke="#171717" strokeWidth={1}>
          {Array.from({length: CUE_RINGS - 1}, (_, index) => (
            <circle key={index} cx={C} cy={C} r={(R * (index + 1)) / CUE_RINGS} />
          ))}
          {Array.from({length: SPOKES}, (_, index) => {
            const end = polar((360 / SPOKES) * index, R)
            return <line key={index} x1={C} y1={C} x2={end.x} y2={end.y} />
          })}
        </g>

        <g fill="#525252" fontSize={17} textAnchor="middle" dominantBaseline="central">
          {SCALE.map((step) => {
            const at = polar(step * 22.5, R + 18)
            return (
              <text key={step} x={at.x} y={at.y}>
                {step < 0 ? `−${-step}` : step}
              </text>
            )
          })}
        </g>

        {tips.map((tip, index) => {
          const at = polar(tip.angle, (R * tip.ring) / CUE_RINGS)
          return (
            <g key={index}>
              <circle cx={at.x} cy={at.y} r={17} fill={RED} />
              <text
                x={at.x}
                y={at.y + 1}
                fill="#ffffff"
                fontSize={tip.mark.length > 1 ? 17 : 21}
                fontWeight={600}
                textAnchor="middle"
                dominantBaseline="central"
              >
                {tip.mark}
              </text>
            </g>
          )
        })}
      </svg>

      <p className="mt-2 text-center text-xs text-neutral-400">Nhìn từ phía sau cơ</p>

      {legend.length > 0 && (
        <ol className="mt-4 space-y-2 text-base leading-snug text-gray-800">
          {legend.map((tip, index) => (
            <li key={index} className="flex gap-3">
              <span
                className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full px-1 text-sm font-bold text-white"
                style={{backgroundColor: RED}}
              >
                {tip.mark}
              </span>
              <span>{tip.label}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
