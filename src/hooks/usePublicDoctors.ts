import { useState, useEffect } from 'react';
import { Doctor } from '../types/doctor';
import { fetchPublicDoctors } from '../services/firestore';
import { doctorsData } from '../data/doctors';

interface UsePublicDoctorsResult {
  doctors: Doctor[];
  isLoading: boolean;
  isFallback: boolean;
  isEmpty: boolean;
}

export function usePublicDoctors(): UsePublicDoctorsResult {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFallback, setIsFallback] = useState(false);
  const [isEmpty, setIsEmpty] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadDoctors() {
      try {
        const firestoreDoctors = await fetchPublicDoctors();
        if (!isMounted) return;

        if (firestoreDoctors.length === 0) {
          // Fallback to static brochure dataset so doctors always display
          const activeStatic = doctorsData
            .filter((d) => d.isActive !== false)
            .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
          setDoctors(activeStatic);
          setIsEmpty(activeStatic.length === 0);
          setIsFallback(true);
        } else {
          // Sort by displayOrder ascending defensively
          const sorted = [...firestoreDoctors].sort(
            (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
          );
          setDoctors(sorted);
          setIsEmpty(false);
          setIsFallback(false);
        }
      } catch (err: any) {
        if (!isMounted) return;
        if (import.meta.env.DEV) {
          console.warn(
            '[usePublicDoctors] Firestore active doctors fetch failed. Engaging resilience static fallback.',
            err
          );
        }
        // Resilience Fallback to static brochure dataset
        const activeStatic = doctorsData
          .filter((d) => d.isActive !== false)
          .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
        setDoctors(activeStatic);
        setIsFallback(true);
        setIsEmpty(activeStatic.length === 0);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadDoctors();

    return () => {
      isMounted = false;
    };
  }, []);

  return { doctors, isLoading, isFallback, isEmpty };
}
