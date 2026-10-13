import {defineArrayMember, defineField, defineType} from 'sanity'
import {BIDA_CATEGORIES, bidaCategoryTitle, parseCueTips, parsePoint, parsePoints, parseYouTube} from '@/lib/bida'
import {BidaDiagramInput} from '../components/BidaDiagramInput'
import {CueBallInput} from '../components/CueBallInput'

const POINT_HELP = 'Dạng x,y tính bằng kim cương — x từ 0 đến 8 (băng dài), y từ 0 đến 4 (băng ngắn). Số lẻ dùng dấu chấm, vd. 2.5,1'

const ballField = (name: string, title: string) =>
  defineField({
    name,
    title,
    type: 'string',
    description: 'Vd. 2,1 — để trống nếu sơ đồ không cần bi này.',
    validation: (Rule) => Rule.custom((value) => (!value || parsePoint(value) ? true : POINT_HELP)),
  })

// Bài viết của trang. Nội dung có 4 khối riêng ngoài chữ/ảnh/bảng: video
// YouTube, sơ đồ bàn, điểm chạm cơ, công thức.
export default defineType({
  name: 'bidaNote',
  title: 'Bài viết',
  type: 'document',
  groups: [
    {name: 'content', title: 'Nội dung', default: true},
    {name: 'meta', title: 'Hiển thị & nguồn'},
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Tiêu đề',
      type: 'string',
      group: 'content',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Đường dẫn tĩnh',
      type: 'slug',
      group: 'content',
      options: {source: 'title', maxLength: 96},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Nhóm',
      type: 'string',
      group: 'content',
      options: {list: [...BIDA_CATEGORIES], layout: 'dropdown'},
      initialValue: 'system',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'body',
      title: 'Nội dung',
      type: 'array',
      group: 'content',
      of: [
        defineArrayMember({
          type: 'block',
          styles: [
            {title: 'Normal', value: 'normal'},
            {title: 'H2', value: 'h2'},
            {title: 'H3', value: 'h3'},
            {title: 'Quote', value: 'blockquote'},
          ],
          lists: [
            {title: 'Bullet', value: 'bullet'},
            {title: 'Numbered', value: 'number'},
          ],
          marks: {
            decorators: [
              {title: 'Bold', value: 'strong'},
              {title: 'Italic', value: 'em'},
              {title: 'Underline', value: 'underline'},
              {title: 'Code', value: 'code'},
            ],
            annotations: [
              defineField({
                name: 'link',
                title: 'Link',
                type: 'object',
                fields: [defineField({name: 'href', title: 'URL', type: 'url'})],
              }),
            ],
          },
        }),
        defineArrayMember({
          type: 'image',
          options: {hotspot: true},
          fields: [
            defineField({name: 'alt', title: 'Văn bản thay thế (Alt text)', type: 'string'}),
            defineField({name: 'caption', title: 'Chú thích ảnh', type: 'string'}),
          ],
        }),
        defineArrayMember({type: 'table'}),
        defineArrayMember({
          type: 'object',
          name: 'youtube',
          title: 'Video YouTube',
          fields: [
            defineField({
              name: 'url',
              title: 'Link YouTube',
              type: 'url',
              description: 'Dán link video, Shorts hay youtu.be đều được.',
              validation: (Rule) =>
                Rule.required().custom((value) =>
                  !value || parseYouTube(value) ? true : 'Không đọc được ID video từ link này.',
                ),
            }),
            defineField({
              name: 'start',
              title: 'Bắt đầu từ giây thứ',
              type: 'number',
              description: 'Để nhảy thẳng tới cú đánh cần xem. Để trống thì lấy theo "t=" trong link, không có thì phát từ đầu.',
              validation: (Rule) => Rule.min(0).integer(),
            }),
            defineField({name: 'caption', title: 'Chú thích', type: 'string'}),
          ],
          preview: {
            select: {caption: 'caption', url: 'url'},
            prepare({caption, url}) {
              return {title: caption || 'Video YouTube', subtitle: url}
            },
          },
        }),
        defineArrayMember({
          type: 'object',
          name: 'bidaDiagram',
          title: 'Sơ đồ bàn',
          components: {input: BidaDiagramInput},
          fields: [
            ballField('white', 'Bi trắng'),
            ballField('yellow', 'Bi vàng'),
            ballField('red', 'Bi đỏ'),
            defineField({
              name: 'paths',
              title: 'Đường bi',
              type: 'array',
              of: [
                defineArrayMember({
                  type: 'object',
                  name: 'path',
                  title: 'Đường bi',
                  fields: [
                    defineField({
                      name: 'from',
                      title: 'Xuất phát từ',
                      type: 'string',
                      options: {
                        list: [
                          {title: 'Bi trắng', value: 'white'},
                          {title: 'Bi vàng', value: 'yellow'},
                          {title: 'Bi đỏ', value: 'red'},
                          {title: 'Điểm tự nhập', value: 'none'},
                        ],
                        layout: 'radio',
                        direction: 'horizontal',
                      },
                      initialValue: 'white',
                    }),
                    defineField({
                      name: 'points',
                      title: 'Các điểm đi qua',
                      type: 'string',
                      description: 'Lần lượt từng điểm, vd. 8,2.5 > 5,4 > 0,2.5 > 3,0. Điểm trên băng là x = 0/8 hoặc y = 0/4.',
                      validation: (Rule) =>
                        Rule.required().custom((value) =>
                          !value || parsePoints(value).length > 0 ? true : POINT_HELP,
                        ),
                    }),
                    defineField({
                      name: 'color',
                      title: 'Màu nét',
                      type: 'string',
                      options: {
                        list: [
                          {title: 'Trắng', value: 'white'},
                          {title: 'Vàng', value: 'yellow'},
                          {title: 'Đỏ', value: 'red'},
                          {title: 'Đen', value: 'black'},
                        ],
                        layout: 'radio',
                        direction: 'horizontal',
                      },
                      initialValue: 'white',
                    }),
                    defineField({
                      name: 'dashed',
                      title: 'Nét đứt',
                      type: 'boolean',
                      description: 'Dùng cho đường ngắm hoặc đường bi mục tiêu.',
                      initialValue: false,
                    }),
                  ],
                  preview: {
                    select: {points: 'points', from: 'from'},
                    prepare({points, from}) {
                      return {title: points || 'Đường bi', subtitle: from && from !== 'none' ? `từ bi ${from}` : undefined}
                    },
                  },
                }),
              ],
            }),
            defineField({
              name: 'numberHits',
              title: 'Đánh số băng chạm',
              type: 'boolean',
              description: 'Ghi 1, 2, 3… tại các điểm chạm băng của đường bi đầu tiên.',
              initialValue: true,
            }),
            defineField({
              name: 'labels',
              title: 'Nhãn số trên bàn',
              type: 'text',
              rows: 4,
              description: 'Mỗi dòng 1 nhãn: "x,y chữ". Vd. "0,3 30" ghi số 30 cạnh kim cương thứ 3 băng ngắn bên trái — dùng để đánh số theo từng hệ thống.',
            }),
            defineField({
              name: 'showAxis',
              title: 'Hiện số toạ độ ở mép bàn',
              type: 'boolean',
              initialValue: false,
            }),
            defineField({name: 'caption', title: 'Chú thích', type: 'string'}),
          ],
          preview: {
            select: {caption: 'caption'},
            prepare({caption}) {
              return {title: caption || 'Sơ đồ bàn', subtitle: caption ? 'Sơ đồ bàn' : undefined}
            },
          },
        }),
        defineArrayMember({
          type: 'object',
          name: 'cueBall',
          title: 'Điểm chạm cơ (ép phê)',
          components: {input: CueBallInput},
          fields: [
            defineField({
              name: 'tips',
              title: 'Các điểm chạm',
              type: 'text',
              rows: 5,
              description:
                'Mỗi dòng 1 điểm. Ép phê cao cơ theo mức 0–4: "P3 nhãn" (bên phải mức 3) hoặc "T2 nhãn" (bên trái mức 2). Điểm bất kỳ: "giờ vòng nhãn", giờ theo mặt đồng hồ nhìn từ sau cơ, vòng 0–5 (0 = đúng tâm, 5 = mép bi), vd. "6 2 Thấp cơ".',
              validation: (Rule) =>
                Rule.required().custom((value) =>
                  !value || parseCueTips(value).length > 0 ? true : 'Mỗi dòng dạng "P3 nhãn", "T2 nhãn" hoặc "giờ vòng nhãn".',
                ),
            }),
            defineField({name: 'caption', title: 'Chú thích', type: 'string'}),
          ],
          preview: {
            select: {caption: 'caption', tips: 'tips'},
            prepare({caption, tips}) {
              return {title: caption || 'Điểm chạm cơ', subtitle: tips?.split('\n')[0]}
            },
          },
        }),
        defineArrayMember({
          type: 'object',
          name: 'formula',
          title: 'Công thức',
          fields: [
            defineField({name: 'title', title: 'Tên công thức', type: 'string'}),
            defineField({
              name: 'expression',
              title: 'Công thức',
              type: 'text',
              rows: 2,
              description: 'Vd. Điểm xuất phát − Điểm ngắm = Điểm đến',
              validation: (Rule) => Rule.required(),
            }),
            defineField({name: 'note', title: 'Ghi chú', type: 'text', rows: 3}),
          ],
          preview: {
            select: {title: 'title', expression: 'expression'},
            prepare({title, expression}) {
              return {title: title || expression, subtitle: title ? expression : 'Công thức'}
            },
          },
        }),
      ],
    }),
    defineField({
      name: 'excerpt',
      title: 'Mô tả ngắn',
      type: 'text',
      group: 'meta',
      rows: 3,
      description: 'Hiện dưới tiêu đề ở trang danh sách. 1–2 câu.',
      validation: (Rule) => Rule.max(200),
    }),
    defineField({
      name: 'formula',
      title: 'Công thức tóm tắt',
      type: 'string',
      group: 'meta',
      description: 'Hiện ngay trên thẻ ở trang danh sách để tra nhanh, vd. "Xuất phát − Ngắm = Đến". Để trống nếu bài không có công thức.',
    }),
    defineField({
      name: 'sourceName',
      title: 'Nguồn',
      type: 'string',
      group: 'meta',
      description: 'Tên tác giả / trang / kênh mà bạn chép hoặc tổng hợp lại. Hiện ở đầu và cuối bài.',
    }),
    defineField({
      name: 'sourceUrl',
      title: 'Link nguồn',
      type: 'url',
      group: 'meta',
    }),
    defineField({
      name: 'publishedAt',
      title: 'Ngày đăng',
      type: 'datetime',
      group: 'meta',
      initialValue: () => new Date().toISOString(),
    }),
  ],
  preview: {
    select: {title: 'title', category: 'category', sourceName: 'sourceName'},
    prepare({title, category, sourceName}) {
      return {title, subtitle: [bidaCategoryTitle(category), sourceName].filter(Boolean).join(' · ')}
    },
  },
})
