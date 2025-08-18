'use client';

import { useState, useEffect } from 'react';
import Button from './Button';
import Card from './Card';
import { CalendarEvent } from '@/services/calendar.service';

interface EventContext {
  type: string;
  journalEntry?: any;
  cadisEntry?: any;
  reminder?: any;
  review?: any;
  cadisEnhancement?: {
    relatedPatterns: any[];
    insights: string[];
    recommendations: string[];
    confidence: number;
    generatedBy: string;
    generatedAt: string;
  };
  s3ContextPath?: string;
}

interface CalendarEventDetailProps {
  event: CalendarEvent;
  isOpen: boolean;
  onClose: () => void;
}

export default function CalendarEventDetail({ event, isOpen, onClose }: CalendarEventDetailProps) {
  const [context, setContext] = useState<EventContext | null>(null);
  const [isLoadingContext, setIsLoadingContext] = useState(false);
  const [showCADISContext, setShowCADISContext] = useState(false);

  useEffect(() => {
    if (isOpen && event) {
      loadEventContext();
    }
  }, [isOpen, event]);

  const loadEventContext = async () => {
    try {
      setIsLoadingContext(true);
      
      const response = await fetch(`/api/admin/calendar/context/${event.id.replace(/^(journal_|cadis_|reminder_|review_|meeting_)/, '')}?type=${event.type}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setContext(data.context);
        }
      }
    } catch (error) {
      console.error('Error loading event context:', error);
    } finally {
      setIsLoadingContext(false);
    }
  };

  const getEventIcon = (type: CalendarEvent['type']) => {
    const icons = {
      'journal_entry': '📝',
      'cadis_entry': '🧠',
      'reminder': '⏰',
      'self_review': '🔍',
      'meeting': '🎥',
      'milestone': '🎯'
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

  const getStatusColor = (status?: string) => {
    const colors = {
      'pending': 'text-yellow-400',
      'in_progress': 'text-blue-400',
      'completed': 'text-green-400',
      'cancelled': 'text-gray-400'
    };
    return colors[status as keyof typeof colors] || 'text-gray-400';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-start gap-4">
            <span className="text-3xl">{getEventIcon(event.type)}</span>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">{event.title}</h2>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-400">
                  {new Date(event.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
                <span className="text-gray-400">
                  {new Date(event.date).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
          >
            ✕
          </Button>
        </div>

        {/* Event Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Type</h3>
            <p className="text-white capitalize">{event.type.replace('_', ' ')}</p>
          </Card>
          
          {event.category && (
            <Card className="p-4">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Category</h3>
              <p className="text-white capitalize">{event.category}</p>
            </Card>
          )}
          
          {event.priority && (
            <Card className="p-4">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Priority</h3>
              <p className={`capitalize ${getPriorityColor(event.priority)}`}>
                {event.priority}
              </p>
            </Card>
          )}
          
          {event.status && (
            <Card className="p-4">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Status</h3>
              <p className={`capitalize ${getStatusColor(event.status)}`}>
                {event.status.replace('_', ' ')}
              </p>
            </Card>
          )}
          
          {event.metadata.confidence && (
            <Card className="p-4">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Confidence</h3>
              <p className="text-white">{event.metadata.confidence}%</p>
            </Card>
          )}
          
          {event.metadata.impact && (
            <Card className="p-4">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Impact</h3>
              <p className={`capitalize ${getPriorityColor(event.metadata.impact)}`}>
                {event.metadata.impact}
              </p>
            </Card>
          )}
        </div>

        {/* Content Summary */}
        <Card className="p-4 mb-6">
          <h3 className="text-lg font-semibold text-white mb-3">Summary</h3>
          <p className="text-gray-300 leading-relaxed">{event.contextSummary}</p>
        </Card>

        {/* Tags */}
        {event.metadata.tags && event.metadata.tags.length > 0 && (
          <Card className="p-4 mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {event.metadata.tags.map(tag => (
                <span 
                  key={tag} 
                  className="px-3 py-1 bg-blue-600/20 text-blue-300 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </Card>
        )}

        {/* Related Entities */}
        {event.metadata.relatedEntities && (
          <Card className="p-4 mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">Related Entities</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {event.metadata.relatedEntities.projects && event.metadata.relatedEntities.projects.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Projects</h4>
                  <div className="space-y-1">
                    {event.metadata.relatedEntities.projects.map(project => (
                      <span key={project} className="block text-green-300 text-sm">
                        📁 {project}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {event.metadata.relatedEntities.repositories && event.metadata.relatedEntities.repositories.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Repositories</h4>
                  <div className="space-y-1">
                    {event.metadata.relatedEntities.repositories.map(repo => (
                      <span key={repo} className="block text-purple-300 text-sm">
                        📦 {repo}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {event.metadata.relatedEntities.developers && event.metadata.relatedEntities.developers.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Developers</h4>
                  <div className="space-y-1">
                    {event.metadata.relatedEntities.developers.map(dev => (
                      <span key={dev} className="block text-blue-300 text-sm">
                        👨‍💻 {dev}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* CADIS Context */}
        {(context?.cadisEnhancement || event.type === 'cadis_entry') && (
          <Card className="p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-white">🧠 CADIS Intelligence</h3>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowCADISContext(!showCADISContext)}
              >
                {showCADISContext ? 'Hide Details' : 'Show Details'}
              </Button>
            </div>
            
            {context?.cadisEnhancement && (
              <div className="mb-3">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <span>Confidence: {context.cadisEnhancement.confidence}%</span>
                  <span>•</span>
                  <span>Generated: {new Date(context.cadisEnhancement.generatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            )}

            {showCADISContext && (
              <div className="space-y-4">
                {event.type === 'cadis_entry' && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-2">CADIS Analysis</h4>
                    <div className="space-y-2">
                      {event.metadata.confidence && (
                        <div className="text-sm text-gray-300">
                          <span className="font-medium">Confidence:</span> {event.metadata.confidence}%
                        </div>
                      )}
                      {event.metadata.impact && (
                        <div className="text-sm text-gray-300">
                          <span className="font-medium">Impact Level:</span> {event.metadata.impact}
                        </div>
                      )}
                      {event.metadata.relatedEntities && (
                        <div className="text-sm text-gray-300">
                          <span className="font-medium">Scope:</span> 
                          {event.metadata.relatedEntities.projects && ` ${event.metadata.relatedEntities.projects.length} projects`}
                          {event.metadata.relatedEntities.repositories && `, ${event.metadata.relatedEntities.repositories.length} repositories`}
                          {event.metadata.relatedEntities.modules && `, ${event.metadata.relatedEntities.modules.length} modules`}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {context?.cadisEnhancement?.insights && context.cadisEnhancement.insights.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Key Insights</h4>
                    <ul className="space-y-2">
                      {context.cadisEnhancement.insights.map((insight, index) => (
                        <li key={index} className="text-gray-300 text-sm">
                          • {insight}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {context?.cadisEnhancement?.recommendations && context.cadisEnhancement.recommendations.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Recommendations</h4>
                    <ul className="space-y-2">
                      {context.cadisEnhancement.recommendations.map((rec, index) => (
                        <li key={index} className="text-blue-300 text-sm">
                          💡 {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {event.type === 'cadis_maintenance' && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Maintenance Details</h4>
                    <div className="space-y-2 text-sm text-gray-300">
                      <div>
                        <span className="font-medium">Type:</span> {event.category === 'system' ? 'Full System Analysis' : 'Ecosystem Health Check'}
                      </div>
                      <div>
                        <span className="font-medium">Frequency:</span> {event.title.includes('Tuesday') ? 'Weekly - Tuesday' : 'Weekly - Friday'}
                      </div>
                      <div>
                        <span className="font-medium">Scope:</span> {event.category === 'system' ? 
                          'Ecosystem health, dream state predictions, creative intelligence' :
                          'Health monitoring and optimization recommendations'}
                      </div>
                    </div>
                  </div>
                )}

                {!context?.cadisEnhancement && event.type !== 'cadis_entry' && event.type !== 'cadis_maintenance' && (
                  <div className="text-sm text-gray-400">
                    CADIS context is being generated for this event...
                  </div>
                )}
              </div>
            )}
          </Card>
        )}

        {/* Loading Context */}
        {isLoadingContext && (
          <Card className="p-4 mb-6">
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-400">Loading CADIS context...</div>
            </div>
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-700">
          <div className="flex gap-2">
            {event.type === 'journal_entry' && (
              <Button variant="secondary" size="sm">
                📝 Edit Entry
              </Button>
            )}
            {event.type === 'reminder' && event.status === 'pending' && (
              <Button variant="secondary" size="sm">
                ✅ Mark Complete
              </Button>
            )}
            {event.type === 'self_review' && event.status === 'pending' && (
              <Button variant="primary" size="sm">
                🔄 Generate Analysis
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            {context?.s3ContextPath && (
              <Button variant="secondary" size="sm">
                📄 Full Context
              </Button>
            )}
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
