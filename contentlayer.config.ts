import { defineDocumentType, makeSource } from "contentlayer/source-files";

export const Changelog = defineDocumentType(() => ({
  name: "Changelog",
  filePathPattern: "changelog/**/*.mdx",
  contentType: "mdx",
  fields: {
    date: {
      type: "date",
      required: true,
      description: "The date of the changelog entry",
    },
    title: {
      type: "string",
      required: true,
      description: "The title of the changelog entry",
    },
    version: {
      type: "string",
      required: false,
      description: "The version number (optional)",
    },
    changeType: {
      type: "enum",
      options: ["added", "changed", "fixed"],
      required: false,
      description: "The type of change (optional)",
    },
    tags: {
      type: "list",
      of: { type: "string" },
      required: false,
      description: "Tags for filtering (e.g., Feature, Bug Fix)",
    },
    description: {
      type: "string",
      required: false,
      description: "Brief description of the changelog entry",
    },
  },
  computedFields: {
    formattedDate: {
      type: "string",
      resolve: (doc) => {
        const date = new Date(doc.date);
        return date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      },
    },
    url: {
      type: "string",
      resolve: (doc) => `/changelog#${doc._raw.flattenedPath.replace("changelog/", "")}`,
    },
  },
}));

export default makeSource({
  contentDirPath: "content",
  documentTypes: [Changelog],
  mdx: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
});

