import type {Metadata} from 'next'

// Tiêu đề, mô tả và ảnh chia sẻ lấy từ layout gốc.
export const metadata: Metadata = {alternates: {canonical: '/'}}

// Danh sách bài nằm ở layout (cột trái). Trang chủ chỉ là khung phải lúc chưa
// chọn bài nào — trên điện thoại khung này bị ẩn, người xem chỉ thấy danh sách.
export default function HomePage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-8 text-center text-neutral-400">
      <p>Chọn một bài ở cột bên trái để đọc.</p>
    </div>
  )
}
