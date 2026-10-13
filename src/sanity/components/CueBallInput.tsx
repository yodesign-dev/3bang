import type {ObjectInputProps} from 'sanity'
import {CueBall} from '@/components/CueBall'

// Khung nhập của khối "Điểm chạm cơ": vẽ luôn trái bi phía trên ô nhập để gõ
// tới đâu thấy tới đó.
export function CueBallInput(props: ObjectInputProps) {
  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 20}}>
      <div style={{maxWidth: 280, margin: '0 auto', background: '#fff', padding: 12, borderRadius: 8}}>
        <CueBall value={props.value as {tips?: string; caption?: string} | undefined} />
      </div>
      {props.renderDefault(props)}
    </div>
  )
}
