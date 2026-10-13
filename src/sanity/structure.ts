import type {StructureResolver} from 'sanity/structure'
import {BIDA_CATEGORIES} from '@/lib/bida'

// Mỗi nhóm 1 danh sách cho dễ tìm khi bài nhiều lên
export const structure: StructureResolver = (S) =>
  S.list()
    .title('Bida 3 băng')
    .items([
      S.listItem()
        .title('Tất cả bài')
        .id('bidaNote-all')
        .child(
          S.documentTypeList('bidaNote')
            .title('Tất cả bài')
            .defaultOrdering([{field: 'publishedAt', direction: 'desc'}]),
        ),
      S.divider(),
      ...BIDA_CATEGORIES.map(({title, value}) =>
        S.listItem()
          .title(title)
          .id(`bidaNote-${value}`)
          .child(
            S.documentTypeList('bidaNote')
              .title(title)
              .filter('_type == "bidaNote" && category == $category')
              .params({category: value})
              .initialValueTemplates([])
              .defaultOrdering([{field: 'publishedAt', direction: 'desc'}]),
          ),
      ),
    ])
