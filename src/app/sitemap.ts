import type {MetadataRoute} from 'next'
import {client} from '@/sanity/lib/client'
import {BIDA_URL} from '@/lib/bida'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const notes = await client
    .fetch<{slug: string; _updatedAt: string}[]>(
      `*[_type == "bidaNote" && defined(slug.current)]{"slug": slug.current, _updatedAt}`,
      {},
      {next: {revalidate}}
    )
    .catch(() => [])

  return [
    {url: BIDA_URL},
    ...notes.map((note) => ({url: `${BIDA_URL}/${note.slug}`, lastModified: note._updatedAt})),
  ]
}
