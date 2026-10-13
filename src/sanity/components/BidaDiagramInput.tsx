import type {ObjectInputProps} from 'sanity'
import {BidaTable} from '@/components/BidaTable'
import type {BidaDiagramValue} from '@/lib/bida'

// Khung nhập của khối "Sơ đồ bàn": vẽ luôn bàn phía trên các ô nhập, kèm số
// toạ độ ở mép, để gõ tới đâu thấy tới đó — không phải Publish rồi mở trang
// mới biết đặt bi sai chỗ.
export function BidaDiagramInput(props: ObjectInputProps) {
  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 20}}>
      <div style={{position: 'sticky', top: 0, zIndex: 1, background: 'var(--card-bg-color)', paddingBottom: 8}}>
        <BidaTable value={props.value as BidaDiagramValue | undefined} axis />
      </div>
      {props.renderDefault(props)}
    </div>
  )
}
