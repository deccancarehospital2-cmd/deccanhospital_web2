import { useState, useEffect } from 'react';
import { GalleryItem } from '../types/gallery';
import { fetchPublicGallery } from '../services/firestore';
import { galleryData } from '../data/gallery';

interface UsePublicGalleryResult {
  galleryItems: GalleryItem[];
  isLoading: boolean;
  isFallback: boolean;
  isEmpty: boolean;
}

export function usePublicGallery(): UsePublicGalleryResult {
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFallback, setIsFallback] = useState(false);
  const [isEmpty, setIsEmpty] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadGallery() {
      try {
        const firestoreItems = await fetchPublicGallery();
        if (!isMounted) return;

        if (firestoreItems.length === 0) {
          // Admin has intentionally deactivated all gallery items or collection is empty
          setGalleryItems([]);
          setIsEmpty(true);
          setIsFallback(false);
        } else {
          // Sort by displayOrder ascending defensively
          const sorted = [...firestoreItems].sort(
            (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
          );
          setGalleryItems(sorted);
          setIsEmpty(false);
          setIsFallback(false);
        }
      } catch (err: any) {
        if (!isMounted) return;
        if (import.meta.env.DEV) {
          console.warn(
            '[usePublicGallery] Firestore active gallery fetch failed. Engaging resilience static fallback.',
            err
          );
        }
        // Resilience Fallback to static brochure gallery dataset
        const activeStatic = galleryData
          .filter((g) => g.isActive !== false)
          .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
        setGalleryItems(activeStatic);
        setIsFallback(true);
        setIsEmpty(activeStatic.length === 0);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadGallery();

    return () => {
      isMounted = false;
    };
  }, []);

  return { galleryItems, isLoading, isFallback, isEmpty };
}
