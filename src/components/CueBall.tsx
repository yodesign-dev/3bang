import {MAX_TIP_OFFSET, parseCueTips} from '@/lib/bida'

// Hình trái bi cái nhìn từ phía sau cơ, đánh dấu điểm chạm của đầu cơ theo
// mặt đồng hồ. Không dùng hook nào để chạy được cả ở trang lẫn khung xem
// trước trong Studio.

const SIZE = 360
const C = SIZE / 2
const R = 130
// Đầu cơ ~12mm trên bi 61.5mm: lệch 1 đầu cơ ≈ 0.36 bán kính.
const TIP = R * 0.36
const BRAND = '#1f5a94'

const polar = (clock: number, distance: number) => {
  const angle = (clock / 12) * Math.PI * 2
  return {x: C + Math.sin(angle) * distance, y: C - Math.cos(angle) * distance}
}

export function CueBall({value}: {value?: {tips?: string; caption?: string}}) {
  const tips = parseCueTips(value?.tips)
  const legend = tips.map((tip, index) => ({...tip, number: index + 1})).filter((tip) => tip.label)

  return (
    <div>
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="img"
        aria-label={value?.caption || 'Điểm chạm cơ trên bi cái'}
        className="block h-auto w-full text-neutral-500"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        <circle cx={C} cy={C} r={R} fill="#fafafa" stroke="#a3a3a3" strokeWidth={2} />
        <line x1={C - R} y1={C} x2={C + R} y2={C} stroke="#d4d4d4" strokeWidth={1.5} />
        <line x1={C} y1={C - R} x2={C} y2={C + R} stroke="#d4d4d4" strokeWidth={1.5} />
        {/* Vòng 1 đầu cơ và vòng giới hạn: chạm ngoài vòng nét đứt dễ trượt cơ */}
        <circle cx={C} cy={C} r={TIP} fill="none" stroke="#d4d4d4" strokeWidth={1.5} />
        <circle
          cx={C}
          cy={C}
          r={TIP * MAX_TIP_OFFSET}
          fill="none"
          stroke="#d92b2b"
          strokeWidth={1.5}
          strokeDasharray="6 6"
        />

        <g fill="currentColor" fontSize={18} textAnchor="middle" dominantBaseline="central">
          {[12, 3, 6, 9].map((hour) => {
            const at = polar(hour, R + 24)
            return (
              <text key={hour} x={at.x} y={at.y}>
                {hour}
              </text>
            )
          })}
        </g>

        {tips.map((tip, index) => {
          const at = polar(tip.clock, tip.offset * TIP)
          return (
            <g key={index}>
              <circle cx={at.x} cy={at.y} r={19} fill={BRAND} fillOpacity={0.92} stroke="#ffffff" strokeWidth={2} />
              <text
                x={at.x}
                y={at.y}
                fill="#ffffff"
                fontSize={18}
                fontWeight={700}
                textAnchor="middle"
                dominantBaseline="central"
              >
                {index + 1}
              </text>
            </g>
          )
        })}
      </svg>

      <p className="mt-1 text-center text-xs text-neutral-400">
        Nhìn từ phía sau cơ · vòng đỏ nét đứt: giới hạn, chạm ngoài dễ trượt cơ
      </p>

      {legend.length > 0 && (
        <ol className="mt-4 space-y-2 text-base leading-snug text-gray-800">
          {legend.map((tip) => (
            <li key={tip.number} className="flex gap-3">
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{backgroundColor: BRAND}}
              >
                {tip.number}
              </span>
              <span>{tip.label}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
