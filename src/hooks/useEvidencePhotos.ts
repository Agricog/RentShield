import { useState, useEffect, useCallback } from 'react';
import type { Evidence } from '../types';

interface PhotoWithUrl {
  evidence: Evidence;
  url: string | null;
  loading: boolean;
  error: boolean;
}

/**
 * Fetches real evidence photos via signed URLs from R2.
 * Returns blob URLs for rendering in <img> tags.
 * Revokes all object URLs on cleanup to prevent memory leaks.
 */
export function useEvidencePhotos(evidence: Evidence[]) {
  const [photos, setPhotos] = useState<PhotoWithUrl[]>([]);

  // Filter to image evidence only
  const imageEvidence = evidence.filter((e) =>
    e.contentType === 'image/jpeg' || e.contentType === 'image/png'
  );

  useEffect(() => {
    if (imageEvidence.length === 0) {
      setPhotos([]);
      return;
    }

    // Initialise with loading state
    setPhotos(
      imageEvidence.map((e) => ({
        evidence: e,
        url: null,
        loading: true,
        error: false,
      }))
    );

    // Fetch each photo via signed URL
    const objectUrls: string[] = [];

    async function loadPhotos() {
      const results = await Promise.allSettled(
        imageEvidence.map(async (e) => {
          const res = await fetch(
            `${import.meta.env.VITE_API_URL}/api/evidence-url/${encodeURIComponent(e.r2Key)}`,
            {
              headers: {
                Authorization: `Bearer ${await getToken()}`,
              },
            }
          );

          if (!res.ok) throw new Error(`Failed to load photo: ${res.status}`);

          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          objectUrls.push(url);

          return { evidenceId: e.id, url };
        })
      );

      setPhotos((prev) =>
        prev.map((p) => {
          const result = results.find((r, i) => imageEvidence[i]?.id === p.evidence.id);

          if (!result) return p;

          if (result.status === 'fulfilled') {
            return { ...p, url: result.value.url, loading: false };
          }

          return { ...p, loading: false, error: true };
        })
      );
    }

    loadPhotos();

    // Cleanup — revoke all object URLs
    return () => {
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [evidence]);

  const refresh = useCallback(() => {
    // Force re-fetch by updating state
    setPhotos((prev) => prev.map((p) => ({ ...p, loading: true, error: false })));
  }, []);

  return { photos, refresh };
}

/**
 * Get auth token for signed URL requests.
 * Uses the same Clerk token getter as the API client.
 */
let tokenGetter: (() => Promise<string | null>) | null = null;

export function setPhotoTokenGetter(getter: () => Promise<string | null>) {
  tokenGetter = getter;
}

async function getToken(): Promise<string> {
  if (!tokenGetter) return '';
  const token = await tokenGetter();
  return token ?? '';
}
