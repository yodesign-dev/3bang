'use client'

// Studio nhúng tại /studio. Dùng chung project + dataset Sanity với
// portfolio, nhưng ở đây chỉ khai báo loại bài bida — bài blog của portfolio
// không hiện ở Studio này, và ngược lại.

import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {table} from '@sanity/table'

import {dataset, projectId} from './src/sanity/env'
import {schema} from './src/sanity/schemaTypes'
import {structure} from './src/sanity/structure'

export default defineConfig({
  basePath: '/studio',
  title: 'Bida 3 băng',
  projectId,
  dataset,
  schema,
  plugins: [structureTool({structure}), table()],
})
