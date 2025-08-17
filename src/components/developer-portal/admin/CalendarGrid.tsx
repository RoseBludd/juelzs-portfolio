'use client';

import React from 'react';
import { formatDateCST } from '@/utils/taskHelpers';
import { useTimezone } from '@/hooks/useTimezone';

interface CalendarGridProps {
  currentMonth: Date;
  selectedDate: string | null;
  onDateSelect: (date: string) => void;
  datesWithUpdates: Set<string>;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  currentMonth,
  selectedDate,
  onDateSelect,
  datesWithUpdates
}) => {
  const { isClient, todayInCST, formatDateInCST } = useTimezone();

  // Get first day of the month and number of days
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday

  // Get previous month's last days to fill the grid
  const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 0);
  const daysInPrevMonth = prevMonth.getDate();

  // Generate calendar days
  const calendarDays: Array<{
    date: Date;
    dayNumber: number;
    isCurrentMonth: boolean;
    isToday: boolean;
    hasUpdates: boolean;
    dateString: string;
  }> = [];

  // Add previous month's trailing days
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const dayNumber = daysInPrevMonth - i;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, dayNumber);
    const dateString = formatDateInCST(date);
    
    calendarDays.push({
      date,
      dayNumber,
      isCurrentMonth: false,
      isToday: isClient && dateString === todayInCST,
      hasUpdates: datesWithUpdates.has(dateString),
      dateString
    });
  }

  // Add current month's days
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dateString = formatDateInCST(date);
    
    calendarDays.push({
      date,
      dayNumber: day,
      isCurrentMonth: true,
      isToday: isClient && dateString === todayInCST,
      hasUpdates: datesWithUpdates.has(dateString),
      dateString
    });
  }

  // Add next month's leading days to complete the grid (6 weeks = 42 days)
  const remainingDays = 42 - calendarDays.length;
  for (let day = 1; day <= remainingDays; day++) {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, day);
    const dateString = formatDateInCST(date);
    
    calendarDays.push({
      date,
      dayNumber: day,
      isCurrentMonth: false,
      isToday: isClient && dateString === todayInCST,
      hasUpdates: datesWithUpdates.has(dateString),
      dateString
    });
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="w-full">
      {/* Week day headers */}
      <div className="grid grid-cols-7 mb-2">
        {weekDays.map(day => (
          <div key={day} className="p-2 text-center">
            <span className="text-sm font-medium text-gray-400 uppercase tracking-wide">
              {day}
            </span>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((calendarDay, index) => {
          const isSelected = selectedDate === calendarDay.dateString;
          
          return (
            <button
              key={index}
              onClick={() => onDateSelect(calendarDay.dateString)}
              className={`
                relative p-2 sm:p-3 h-12 sm:h-16 rounded-lg text-sm font-medium transition-all duration-200
                hover:bg-gray-800/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50
                ${calendarDay.isCurrentMonth 
                  ? 'text-white' 
                  : 'text-gray-600'
                }
                ${isSelected 
                  ? 'bg-indigo-600 text-white shadow-lg' 
                  : ''
                }
                ${calendarDay.isToday && !isSelected
                  ? 'bg-gray-800/70 border border-indigo-500/50 text-indigo-300'
                  : ''
                }
                ${!calendarDay.isCurrentMonth && !calendarDay.hasUpdates
                  ? 'opacity-40'
                  : ''
                }
              `}
            >
              <span className="relative z-10">
                {calendarDay.dayNumber}
              </span>
              
              {/* Update indicator */}
              {calendarDay.hasUpdates && (
                <div className={`
                  absolute top-1 right-1 w-2 h-2 rounded-full
                  ${isSelected 
                    ? 'bg-white/80' 
                    : calendarDay.isToday 
                      ? 'bg-indigo-400' 
                      : 'bg-indigo-500'
                  }
                `} />
              )}
              
              {/* Today indicator ring */}
              {calendarDay.isToday && !isSelected && (
                <div className="absolute inset-0 rounded-lg border-2 border-indigo-500/30 pointer-events-none" />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-6 text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-500" />
          <span>Has Updates</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded border border-indigo-500/50" />
          <span>Today</span>
        </div>
      </div>
    </div>
  );
}; 