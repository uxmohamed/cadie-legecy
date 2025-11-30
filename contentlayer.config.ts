import { defineDocumentType, makeSource } from 'contentlayer2/source-files'

export const Changelog = defineDocumentType(() => ({
  name: 'Changelog',
  filePathPattern: `changelog/**/*.mdx`,
  contentType: 'mdx',
  fields: {
    title: { type: 'string', required: true },
    date: { type: 'date', required: true },
    changeType: { type: 'string', required: false },
    tags: { type: 'list', of: { type: 'string' }, required: false },
    description: { type: 'string', required: false },
    version: { type: 'string', required: false },
  },
  computedFields: {
    url: {
      type: 'string',
      resolve: (doc) => `/changelog/${doc._raw.flattenedPath.split('/').pop()}`,
    },
  },
}))

export default makeSource({
  contentDirPath: 'content',
  documentTypes: [Changelog],
})
