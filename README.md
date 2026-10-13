# Bida 3 băng

Trang tổng hợp hệ thống, công thức, kỹ thuật và thế bóng mẫu của bida carom 3 băng — https://3bang.applebin.me

- Next.js (App Router) + Tailwind, deploy trên Vercel.
- Nội dung nhập ở Sanity Studio nhúng tại `/studio`. Dùng chung project và dataset Sanity với portfolio (applebin.me); trang này chỉ đọc/ghi loại tài liệu `bidaNote`.
- Biến môi trường: `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`.

```bash
npm install
npm run dev
```
