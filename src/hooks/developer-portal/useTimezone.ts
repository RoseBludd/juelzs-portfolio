import { useState, useEffect } from 'react';

interface TimezoneInfo {
  isClient: boolean;
  todayInCST: string;
  yesterdayInCST: string;
  formatDateInCST: (date: Date) => string;
  getCurrentTimeInCST: () => string;
}

export const useTimezone = (): TimezoneInfo => {
  const [isClient, setIsClient] = useState(false);
  const [todayInCST, setTodayInCST] = useState<string>('');
  const [yesterdayInCST, setYesterdayInCST] = useState<string>('');

  useEffect(() => {
    setIsClient(true);
    
    // Calculate today and yesterday in CST timezone once on client
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Chicago',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    
    const today = new Date();
    setTodayInCST(formatter.format(today));
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    setYesterdayInCST(formatter.format(yesterday));
  }, []);

  const formatDateInCST = (date: Date): string => {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Chicago',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return formatter.format(date);
  };

  const getCurrentTimeInCST = (): string => {
    return formatDateInCST(new Date());
  };

  return {
    isClient,
    todayInCST,
    yesterdayInCST,
    formatDateInCST,
    getCurrentTimeInCST
  };
}; 