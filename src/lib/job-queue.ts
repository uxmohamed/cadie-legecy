import { Client } from "@upstash/qstash";

const qstashToken = process.env.QSTASH_TOKEN;
const qstash = qstashToken ? new Client({ token: qstashToken }) : null;

interface EnqueueOptions {
  baseUrl?: string;
}

function getQStashClient(): Client | null {
  if (!qstash) {
    console.warn("[QStash] QSTASH_TOKEN is missing, skipping enqueue");
    return null;
  }

  return qstash;
}

function resolveBaseUrl(baseUrlOverride?: string): string {
  const selected = baseUrlOverride
    || process.env.NEXT_PUBLIC_BASE_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
    || "http://localhost:3000";

  return selected.replace(/\/+$/, "");
}

/**
 * Job payload for metadata enrichment
 */
export interface EnrichMetadataJob {
  linkId: string;
  url: string;
  userId: string;
}

/**
 * Enqueue a metadata enrichment job
 * 
 * This is a fire-and-forget operation that schedules the job
 * to be processed asynchronously with automatic retries.
 * 
 * @param job - The job payload
 * @returns Promise that resolves when job is enqueued (not when executed)
 */
export async function enqueueMetadataEnrichment(
  job: EnrichMetadataJob,
  options?: EnqueueOptions
): Promise<void> {
  const client = getQStashClient();
  if (!client) return;

  const baseUrl = resolveBaseUrl(options?.baseUrl);
  
  try {
    await client.publishJSON({
      url: `${baseUrl}/api/jobs/enrich-metadata`,
      body: job,
      retries: 3, // Retry up to 3 times on failure
      delay: 0, // Start immediately for instant UI
    });
  } catch (error) {
    // Log but don't throw - metadata enrichment is best-effort
    console.error("[QStash] Failed to enqueue metadata enrichment:", error);
  }
}

/**
 * Enqueue multiple metadata enrichment jobs
 *
 * @param jobs - Array of job payloads
 */
export async function enqueueBatchMetadataEnrichment(
  jobs: EnrichMetadataJob[],
  options?: EnqueueOptions
): Promise<void> {
  await Promise.allSettled(
    jobs.map(job => enqueueMetadataEnrichment(job, options))
  );
}

/**
 * Job payload for AI tag enrichment
 */
export interface EnrichAITagsJob {
  linkId: string;
  userId: string;
}

/**
 * Enqueue an AI tagging job
 *
 * Uses a 5s delay to let metadata settle first.
 */
export async function enqueueAITagging(
  job: EnrichAITagsJob,
  options?: EnqueueOptions
): Promise<void> {
  const client = getQStashClient();
  if (!client) return;

  const baseUrl = resolveBaseUrl(options?.baseUrl);

  try {
    await client.publishJSON({
      url: `${baseUrl}/api/jobs/enrich-ai-tags`,
      body: job,
      retries: 3,
      delay: 10, // 10 second delay to let metadata settle
    });
  } catch (error) {
    console.error("[QStash] Failed to enqueue AI tagging:", error);
  }
}

/**
 * Enqueue multiple AI tagging jobs
 */
export async function enqueueBatchAITagging(
  jobs: EnrichAITagsJob[],
  options?: EnqueueOptions
): Promise<void> {
  await Promise.allSettled(
    jobs.map(job => enqueueAITagging(job, options))
  );
}

/**
 * Job payload for AI vision tag enrichment (for image items)
 */
export interface EnrichAIVisionTagsJob {
  linkId: string;
  userId: string;
}

export interface ProcessBookmarkImportJob {
  importJobId: string;
  userId: string;
}

/**
 * Enqueue an AI vision tagging job for an image item.
 * Uses a 2s delay to let the upload settle.
 */
export async function enqueueAIVisionTagging(
  job: EnrichAIVisionTagsJob,
  options?: EnqueueOptions
): Promise<void> {
  const client = getQStashClient();
  if (!client) return;

  const baseUrl = resolveBaseUrl(options?.baseUrl);

  try {
    await client.publishJSON({
      url: `${baseUrl}/api/jobs/enrich-ai-vision-tags`,
      body: job,
      retries: 3,
      delay: 2,
    });
  } catch (error) {
    console.error("[QStash] Failed to enqueue AI vision tagging:", error);
  }
}

/**
 * Enqueue multiple AI vision tagging jobs
 */
export async function enqueueBatchAIVisionTagging(
  jobs: EnrichAIVisionTagsJob[],
  options?: EnqueueOptions
): Promise<void> {
  await Promise.allSettled(
    jobs.map(job => enqueueAIVisionTagging(job, options))
  );
}

/**
 * Enqueue a bookmark import processing job.
 * This powers large background imports from Settings > Import.
 */
export async function enqueueBookmarkImportProcessing(
  job: ProcessBookmarkImportJob,
  options?: EnqueueOptions
): Promise<void> {
  const client = getQStashClient();
  if (!client) {
    throw new Error("QStash is not configured");
  }

  const baseUrl = resolveBaseUrl(options?.baseUrl);

  await client.publishJSON({
    url: `${baseUrl}/api/jobs/process-bookmark-import`,
    body: job,
    retries: 5,
    delay: 0,
  });
}
