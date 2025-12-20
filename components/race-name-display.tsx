'use client';

import { useEffect, useState } from 'react';
import { getRaceName } from '@/app/actions/race';
import { Skeleton } from '@/components/ui/skeleton';

interface RaceNameDisplayProps {
  date: string;
  placeCode: string;
  raceNumber: number;
  className?: string;
}

export function RaceNameDisplay({ date, placeCode, raceNumber, className }: RaceNameDisplayProps) {
  const [raceName, setRaceName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    getRaceName(date, placeCode, raceNumber).then((name) => {
      if (isMounted) {
        setRaceName(name);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [date, placeCode, raceNumber]);

  if (loading) {
    return <Skeleton className="h-4 w-24 inline-block align-middle" />;
  }

  if (!raceName) return null;

  return <span className={className}>{raceName}</span>;
}
