'use client';

import React, { useEffect, useState } from 'react';
import { getRaceName } from '@/app/actions/race';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { PLACE_NAME_TO_CODE } from '@/lib/betting-utils';

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
    
    const fetchName = async () => {
      setLoading(true);
      try {
        // Convert Kanji place name to JRA code if necessary
        const code = PLACE_NAME_TO_CODE[placeCode] || placeCode;
        const name = await getRaceName(date, code, raceNumber);
        if (isMounted) {
          setRaceName(name);
        }
      } catch (error) {
        console.error("Failed to fetch race name", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchName();

    return () => {
      isMounted = false;
    };
  }, [date, placeCode, raceNumber]);

  if (loading) {
    return <Skeleton className="h-4 w-24 inline-block align-middle ml-2" />;
  }

  if (!raceName) {
    return null;
  }

  return (
    <span className={cn("text-muted-foreground ml-2", className)}>
      {raceName}
    </span>
  );
}
