import type {MetadataRoute} from 'next'
import {BIDA_URL} from '@/lib/bida'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {userAgent: '*', allow: '/', disallow: ['/studio']},
    sitemap: `${BIDA_URL}/sitemap.xml`,
  }
}
