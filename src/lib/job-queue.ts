import { Client } from "@upstash/qstash";

// Initialize QStash client
const qstash = new Client({
  token: process.env.QSTASH_TOKEN!,
});

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
export async function enqueueMetadataEnrichment(job: EnrichMetadataJob): Promise<void> {
  // Determine the base URL for the callback
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL 
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
    || "http://localhost:3000";
  
  try {
    await qstash.publishJSON({
      url: `${baseUrl}/api/jobs/enrich-metadata`,
      body: job,
      retries: 3, // Retry up to 3 times on failure
      delay: 2, // 2 second delay before first execution
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
export async function enqueueBatchMetadataEnrichment(jobs: EnrichMetadataJob[]): Promise<void> {
  await Promise.allSettled(
    jobs.map(job => enqueueMetadataEnrichment(job))
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
export async function enqueueAITagging(job: EnrichAITagsJob): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
    || "http://localhost:3000";

  try {
    await qstash.publishJSON({
      url: `${baseUrl}/api/jobs/enrich-ai-tags`,
      body: job,
      retries: 3,
      delay: 5, // 5 second delay to let metadata settle
    });
  } catch (error) {
    console.error("[QStash] Failed to enqueue AI tagging:", error);
  }
}

/**
 * Enqueue multiple AI tagging jobs
 */
export async function enqueueBatchAITagging(jobs: EnrichAITagsJob[]): Promise<void> {
  await Promise.allSettled(
    jobs.map(job => enqueueAITagging(job))
  );
}
