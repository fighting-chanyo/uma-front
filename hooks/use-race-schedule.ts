import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface RaceScheduleItem {
  date: string;
  place_code: string;
  race_number: number;
}

export function useRaceSchedule() {
  const [schedule, setSchedule] = useState<RaceScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchedule = async () => {
      const { data, error } = await supabase
        .from('races')
        .select('date, place_code, race_number')
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching race schedule:', error);
      } else {
        setSchedule(data || []);
      }
      setLoading(false);
    };

    fetchSchedule();
  }, []);

  const getAvailableDates = () => {
    const dates = new Set(schedule.map(s => s.date));
    return Array.from(dates).sort().reverse();
  };

  const getPlacesForDate = (date: string) => {
    const places = new Set(
      schedule
        .filter(s => s.date === date)
        .map(s => s.place_code)
    );
    return Array.from(places).sort();
  };

  const getRacesForDateAndPlace = (date: string, place: string) => {
    return schedule
      .filter(s => s.date === date && s.place_code === place)
      .map(s => s.race_number)
      .sort((a, b) => a - b);
  };

  const isDateAvailable = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return schedule.some(s => s.date === dateStr);
  };

  return {
    loading,
    getAvailableDates,
    getPlacesForDate,
    getRacesForDateAndPlace,
    isDateAvailable
  };
}
