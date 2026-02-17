"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import type { ImportJobDTO } from "@/features/imports/types/import.types";

interface ImportJobsResponse {
  jobs: ImportJobDTO[];
}

interface ImportJobResponse {
  job: ImportJobDTO;
}

export function useImportJobsQuery(limit: number = 20, enabled: boolean = true) {
  const query = useQuery({
    queryKey: queryKeys.imports.list(limit),
    enabled,
    queryFn: async () => {
      const response = await fetch(`/api/imports?limit=${limit}`);
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Failed to fetch import jobs");
      }
      const data = (await response.json()) as ImportJobsResponse;
      return data.jobs || [];
    },
    staleTime: 5000,
    refetchOnWindowFocus: false,
  });

  return {
    jobs: query.data || [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useImportJobQuery(jobId: string | null, enabled: boolean = true) {
  const query = useQuery({
    queryKey: jobId ? queryKeys.imports.detail(jobId) : queryKeys.imports.detail("none"),
    enabled: Boolean(jobId) && enabled,
    queryFn: async () => {
      const response = await fetch(`/api/imports/${jobId}`);
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Failed to fetch import job");
      }
      const data = (await response.json()) as ImportJobResponse;
      return data.job;
    },
    refetchInterval: (queryState) => {
      const job = queryState.state.data as ImportJobDTO | undefined;
      if (!job) return 2000;
      return job.status === "queued" || job.status === "processing" ? 2000 : false;
    },
    refetchOnWindowFocus: false,
  });

  return {
    job: query.data || null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

