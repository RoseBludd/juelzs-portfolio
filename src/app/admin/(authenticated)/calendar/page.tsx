'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import CalendarEventDetail from '@/components/ui/CalendarEventDetail';
import { CalendarEvent, CalendarFilters, CalendarStats } from '@/services/calendar.service';

type CalendarView = 'month' | 'week' | 'list';

// Calendar component for displaying events
function CalendarGrid({ events, onEventClick }: { events: CalendarEvent[], onEventClick: (event: CalendarEvent) => void }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };
  
  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.toDateString() === date.toDateString();
    });
  };
  
  const days = getDaysInMonth(currentDate);
  const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };
  
  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">{monthYear}</h3>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigateMonth('prev')}
          >
            ←
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
          >
            Today
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigateMonth('next')}
          >
            →
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-2 text-center text-xs font-medium text-gray-400">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {days.map((date, index) => {
          if (!date) {
            return <div key={index} className="p-2 h-24"></div>;
          }
          
          const dayEvents = getEventsForDate(date);
          const isToday = date.toDateString() === new Date().toDateString();
          
          return (
            <div
              key={date.toISOString()}
              className={`p-1 h-24 border border-gray-700 rounded ${
                isToday ? 'bg-blue-900/20 border-blue-500' : 'hover:bg-gray-700'
              }`}
            >
              <div className="text-xs text-gray-300 mb-1">
                {date.getDate()}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map(event => (
                  <div
                    key={event.id}
                    onClick={() => onEventClick(event)}
                    className={`text-xs p-1 rounded cursor-pointer truncate flex items-center gap-1 ${
                      event.type === 'journal_entry' ? 'bg-green-600/20 text-green-300' :
                      event.type === 'cadis_entry' ? 'bg-purple-600/20 text-purple-300' :
                      event.type === 'reminder' ? 'bg-yellow-600/20 text-yellow-300' :
                      event.type === 'self_review' ? 'bg-red-600/20 text-red-300' :
                      event.type === 'cadis_maintenance' ? 'bg-orange-600/20 text-orange-300' :
                      'bg-blue-600/20 text-blue-300'
                    }`}
                  >
                    <span className="text-xs">
                      {event.type === 'journal_entry' ? '📝' :
                       event.type === 'cadis_entry' ? '🧠' :
                       event.type === 'reminder' ? '⏰' :
                       event.type === 'self_review' ? '🔍' :
                       event.type === 'cadis_maintenance' ? '🔧' :
                       event.type === 'meeting' ? '🎥' :
                       '📄'}
                    </span>
                    <span className="truncate">{event.title}</span>
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-400">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Event list component
function EventList({ events, onEventClick }: { events: CalendarEvent[], onEventClick: (event: CalendarEvent) => void }) {
  const getEventIcon = (type: CalendarEvent['type']) => {
    const icons = {
      'journal_entry': '📝',
      'cadis_entry': '🧠',
      'reminder': '⏰',
      'self_review': '🔍',
      'meeting': '🎥',
      'milestone': '🎯',
      'cadis_maintenance': '🔧'
    };
    return icons[type] || '📄';
  };

  const getPriorityColor = (priority?: string) => {
    const colors = {
      'low': 'text-gray-400',
      'medium': 'text-blue-400',
      'high': 'text-orange-400',
      'urgent': 'text-red-400'
    };
    return colors[priority as keyof typeof colors] || 'text-gray-400';
  };

  return (
    <div className="space-y-3">
      {events.map(event => (
        <Card 
          key={event.id} 
          className="p-4 hover:bg-gray-700 cursor-pointer transition-colors"
          onClick={() => onEventClick(event)}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <span className="text-2xl">{getEventIcon(event.type)}</span>
              <div className="flex-1">
                <h4 className="text-white font-medium">{event.title}</h4>
                <p className="text-gray-400 text-sm mt-1">{event.contextSummary}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-xs text-gray-500">
                    {new Date(event.date).toLocaleDateString()}
                  </span>
                  <span className="text-xs text-gray-500">
                    {event.type.replace('_', ' ')}
                  </span>
                  {event.category && (
                    <span className="text-xs text-gray-500">
                      {event.category}
                    </span>
                  )}
                  {event.priority && (
                    <span className={`text-xs ${getPriorityColor(event.priority)}`}>
                      {event.priority} priority
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// Filter panel component
function FilterPanel({ 
  filters, 
  onFiltersChange,
  isOpen,
  onToggle 
}: { 
  filters: CalendarFilters;
  onFiltersChange: (filters: CalendarFilters) => void;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const eventTypes = [
    { id: 'journal_entry', label: 'Journal Entries', icon: '📝' },
    { id: 'cadis_entry', label: 'CADIS Insights', icon: '🧠' },
    { id: 'reminder', label: 'Reminders', icon: '⏰' },
    { id: 'self_review', label: 'Self Reviews', icon: '🔍' },
    { id: 'meeting', label: 'Meetings', icon: '🎥' },
    { id: 'milestone', label: 'Milestones', icon: '🎯' },
    { id: 'cadis_maintenance', label: 'CADIS Maintenance', icon: '🔧' }
  ];

  const priorities = [
    { id: 'low', label: 'Low', color: 'text-gray-400' },
    { id: 'medium', label: 'Medium', color: 'text-blue-400' },
    { id: 'high', label: 'High', color: 'text-orange-400' },
    { id: 'urgent', label: 'Urgent', color: 'text-red-400' }
  ];

  const updateFilter = (key: keyof CalendarFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleTypeFilter = (type: string) => {
    const currentTypes = filters.types || [];
    const newTypes = currentTypes.includes(type as any)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type as any];
    updateFilter('types', newTypes.length > 0 ? newTypes : undefined);
  };

  const togglePriorityFilter = (priority: string) => {
    const currentPriorities = filters.priorities || [];
    const newPriorities = currentPriorities.includes(priority as any)
      ? currentPriorities.filter(p => p !== priority)
      : [...currentPriorities, priority as any];
    updateFilter('priorities', newPriorities.length > 0 ? newPriorities : undefined);
  };

  if (!isOpen) {
    return (
      <Button
        variant="secondary"
        size="sm"
        onClick={onToggle}
        className="mb-4"
      >
        🔽 Show Filters
      </Button>
    );
  }

  return (
    <Card className="p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Filters</h3>
        <Button
          variant="secondary"
          size="sm"
          onClick={onToggle}
        >
          🔼 Hide Filters
        </Button>
      </div>

      <div className="space-y-4">
        {/* Event Types */}
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-2">Event Types</h4>
          <div className="flex flex-wrap gap-2">
            {eventTypes.map(type => (
              <button
                key={type.id}
                onClick={() => toggleTypeFilter(type.id)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  filters.types?.includes(type.id as any)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {type.icon} {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Priorities */}
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-2">Priorities</h4>
          <div className="flex flex-wrap gap-2">
            {priorities.map(priority => (
              <button
                key={priority.id}
                onClick={() => togglePriorityFilter(priority.id)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  filters.priorities?.includes(priority.id as any)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <span className={priority.color}>●</span> {priority.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date Range */}
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-2">Date Range</h4>
          <div className="flex gap-2">
            <input
              type="date"
              value={filters.dateRange?.start?.toISOString().split('T')[0] || ''}
              onChange={(e) => updateFilter('dateRange', {
                ...filters.dateRange,
                start: new Date(e.target.value),
                end: filters.dateRange?.end || new Date()
              })}
              className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
            />
            <span className="text-gray-400 self-center">to</span>
            <input
              type="date"
              value={filters.dateRange?.end?.toISOString().split('T')[0] || ''}
              onChange={(e) => updateFilter('dateRange', {
                ...filters.dateRange,
                start: filters.dateRange?.start || new Date(),
                end: new Date(e.target.value)
              })}
              className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
            />
          </div>
        </div>

        {/* Other Options */}
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-2">Options</h4>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={filters.showCompleted !== false}
                onChange={(e) => updateFilter('showCompleted', e.target.checked)}
                className="rounded"
              />
              Show completed items
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={filters.showPrivate || false}
                onChange={(e) => updateFilter('showPrivate', e.target.checked)}
                className="rounded"
              />
              Show private entries
            </label>
          </div>
        </div>

        {/* Clear Filters */}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onFiltersChange({})}
          className="w-full"
        >
          Clear All Filters
        </Button>
      </div>
    </Card>
  );
}

// Stats dashboard component
function StatsDashboard({ stats }: { stats: CalendarStats | null }) {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card className="p-4">
        <div className="text-2xl font-bold text-blue-400">{stats.upcomingReminders + stats.pendingSelfReviews}</div>
        <div className="text-sm text-gray-400">Upcoming Events</div>
      </Card>
      <Card className="p-4">
        <div className="text-2xl font-bold text-green-400">{stats.journalEntriesThisMonth}</div>
        <div className="text-sm text-gray-400">Journal Entries This Month</div>
      </Card>
      <Card className="p-4">
        <div className="text-2xl font-bold text-purple-400">{stats.cadisInsightsThisMonth}</div>
        <div className="text-sm text-gray-400">CADIS Insights This Month</div>
      </Card>
      <Card className="p-4">
        <div className="text-2xl font-bold text-yellow-400">{stats.upcomingReminders}</div>
        <div className="text-sm text-gray-400">Upcoming Reminders</div>
      </Card>
    </div>
  );
}

export default function CalendarPage() {
  const [view, setView] = useState<CalendarView>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [stats, setStats] = useState<CalendarStats | null>(null);
  const [filters, setFilters] = useState<CalendarFilters>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadCalendarData();
    loadStats();
  }, [filters]);

  const loadCalendarData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams();
      
      if (filters.types?.length) {
        queryParams.set('types', filters.types.join(','));
      }
      if (filters.categories?.length) {
        queryParams.set('categories', filters.categories.join(','));
      }
      if (filters.priorities?.length) {
        queryParams.set('priorities', filters.priorities.join(','));
      }
      if (filters.dateRange) {
        queryParams.set('startDate', filters.dateRange.start.toISOString());
        queryParams.set('endDate', filters.dateRange.end.toISOString());
      }
      if (filters.showCompleted !== undefined) {
        queryParams.set('showCompleted', filters.showCompleted.toString());
      }
      if (filters.showPrivate !== undefined) {
        queryParams.set('showPrivate', filters.showPrivate.toString());
      }
      
      const response = await fetch(`/api/admin/calendar?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load calendar data: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setEvents(data.events || []);
      } else {
        throw new Error(data.error || 'Failed to load calendar events');
      }
    } catch (error) {
      console.error('Error loading calendar data:', error);
      setError('Failed to load calendar data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/calendar/stats');
      
      if (!response.ok) {
        throw new Error(`Failed to load stats: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
  };

  const createSelfReview = async () => {
    try {
      const response = await fetch('/api/admin/calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'create_self_review',
          title: 'Weekly Self Review',
          startDate: new Date(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          type: 'weekly',
          scope: {
            includeJournal: true,
            includeRepositories: true,
            includeMeetings: true,
            includeCADIS: true,
            includeProjects: true
          }
        })
      });

      if (response.ok) {
        await loadCalendarData();
      }
    } catch (error) {
      console.error('Error creating self review:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">Loading calendar...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-red-400">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Portfolio Calendar</h1>
          <p className="text-gray-400 mt-1 text-sm sm:text-base">
            Comprehensive view of your development journey with CADIS intelligence
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={createSelfReview}
          >
            📝 New Self Review
          </Button>
          <Button
            variant={view === 'month' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setView('month')}
          >
            📅 Month
          </Button>
          <Button
            variant={view === 'list' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setView('list')}
          >
            📋 List
          </Button>
        </div>
      </div>

      {/* Stats Dashboard */}
      <StatsDashboard stats={stats} />

      {/* Filters */}
      <FilterPanel
        filters={filters}
        onFiltersChange={setFilters}
        isOpen={showFilters}
        onToggle={() => setShowFilters(!showFilters)}
      />

      {/* Calendar Content */}
      {view === 'month' ? (
        <CalendarGrid events={events} onEventClick={handleEventClick} />
      ) : (
        <div>
          <div className="mb-4 text-sm text-gray-400">
            Showing {events.length} events
          </div>
          <EventList events={events} onEventClick={handleEventClick} />
        </div>
      )}

      {/* Event Detail Modal */}
      <CalendarEventDetail
        event={selectedEvent}
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
}
