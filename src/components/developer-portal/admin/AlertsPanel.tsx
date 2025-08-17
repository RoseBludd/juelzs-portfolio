'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Info, XCircle, RefreshCw, Clock, User, ChevronDown, ChevronUp } from 'lucide-react';

interface Alert {
  id: string;
  type: 'warning' | 'critical' | 'info' | 'success';
  title: string;
  message: string;
  developerId?: string;
  developerName?: string;
  actionRequired: boolean;
  timestamp: Date;
  data?: any;
}

interface AlertsResponse {
  success: boolean;
  alerts: Alert[];
  timestamp: string;
  count: number;
}

const AlertIcon = ({ type }: { type: Alert['type'] }) => {
  switch (type) {
    case 'critical':
      return <XCircle className="h-4 w-4 text-red-400" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
    case 'info':
      return <Info className="h-4 w-4 text-blue-400" />;
    case 'success':
      return <CheckCircle className="h-4 w-4 text-green-400" />;
    default:
      return <Info className="h-4 w-4 text-gray-400" />;
  }
};

const AlertItem = ({ alert }: { alert: Alert }) => {
  const bgColor = {
    critical: 'bg-red-950/50 border-red-800/50',
    warning: 'bg-yellow-950/50 border-yellow-800/50',
    info: 'bg-blue-950/50 border-blue-800/50',
    success: 'bg-green-950/50 border-green-800/50'
  }[alert.type];

  const textColor = {
    critical: 'text-red-200',
    warning: 'text-yellow-200',
    info: 'text-blue-200',
    success: 'text-green-200'
  }[alert.type];

  return (
    <div className={`p-3 rounded-lg border ${bgColor} ${textColor} mb-2`}>
      <div className="flex items-start space-x-3">
        <AlertIcon type={alert.type} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">{alert.title}</h4>
            {alert.actionRequired && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-900/50 text-red-200 border border-red-800/50">
                Action Required
              </span>
            )}
          </div>
          <p className="mt-1 text-xs opacity-80">{alert.message}</p>
          <div className="flex items-center mt-2 text-xs opacity-60 space-x-3">
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
            </div>
            {alert.developerName && (
              <div className="flex items-center space-x-1">
                <User className="h-3 w-3" />
                <span>{alert.developerName}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function AlertsPanel() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const fetchAlerts = async () => {
    try {
      setIsRefreshing(true);
      const response = await fetch('/api/admin/alerts');
      const data: AlertsResponse = await response.json();
      
      if (data.success) {
        setAlerts(data.alerts);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const alertsByType = {
    critical: alerts.filter(a => a.type === 'critical'),
    warning: alerts.filter(a => a.type === 'warning'),
    info: alerts.filter(a => a.type === 'info'),
    success: alerts.filter(a => a.type === 'success')
  };

  const criticalCount = alertsByType.critical.length;
  const warningCount = alertsByType.warning.length;
  const actionRequiredCount = alerts.filter(a => a.actionRequired).length;

  if (loading) {
    return (
      <div className="bg-gray-900/50 border border-gray-800/50 rounded-lg backdrop-blur-sm">
        <div className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="animate-spin">
                <RefreshCw className="h-4 w-4 text-gray-400" />
              </div>
              <span className="text-sm font-medium text-gray-300">System Alerts</span>
            </div>
            <span className="text-xs text-gray-500">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  // Collapsed view - just show summary
  if (!isExpanded) {
    return (
      <div className="bg-gray-900/50 border border-gray-800/50 rounded-lg backdrop-blur-sm hover:bg-gray-900/70 transition-all duration-200">
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full p-3 text-left"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                <AlertTriangle className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-300">System Alerts</span>
              </div>
              
              {/* Quick summary badges */}
              <div className="flex items-center space-x-2">
                {criticalCount > 0 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-900/50 text-red-200 border border-red-800/50">
                    {criticalCount} Critical
                  </span>
                )}
                {warningCount > 0 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-900/50 text-yellow-200 border border-yellow-800/50">
                    {warningCount} Warning
                  </span>
                )}
                {actionRequiredCount > 0 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-900/50 text-orange-200 border border-orange-800/50">
                    {actionRequiredCount} Action Required
                  </span>
                )}
                {alerts.length === 0 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-900/50 text-green-200 border border-green-800/50">
                    All Clear
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">
                {lastUpdated && lastUpdated.toLocaleTimeString()}
              </span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </button>
      </div>
    );
  }

  // Expanded view - show full alerts
  return (
    <div className="bg-gray-900/50 border border-gray-800/50 rounded-lg backdrop-blur-sm">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-200">System Alerts</h3>
            <p className="text-sm text-gray-500">
              {lastUpdated && `Last updated: ${lastUpdated.toLocaleTimeString()}`}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {actionRequiredCount > 0 && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-900/50 text-red-200 border border-red-800/50">
                {actionRequiredCount} Action{actionRequiredCount !== 1 ? 's' : ''} Required
              </span>
            )}
            <button
              onClick={fetchAlerts}
              disabled={isRefreshing}
              className="p-2 text-gray-400 hover:text-gray-300 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-2 text-gray-400 hover:text-gray-300 transition-colors"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Alert Summary */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="bg-red-950/30 border border-red-800/30 p-3 rounded-lg">
            <div className="flex items-center">
              <XCircle className="h-4 w-4 text-red-400 mr-2" />
              <div>
                <p className="text-xs font-medium text-red-300">Critical</p>
                <p className="text-lg font-bold text-red-200">{criticalCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-yellow-950/30 border border-yellow-800/30 p-3 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="h-4 w-4 text-yellow-400 mr-2" />
              <div>
                <p className="text-xs font-medium text-yellow-300">Warning</p>
                <p className="text-lg font-bold text-yellow-200">{warningCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-blue-950/30 border border-blue-800/30 p-3 rounded-lg">
            <div className="flex items-center">
              <Info className="h-4 w-4 text-blue-400 mr-2" />
              <div>
                <p className="text-xs font-medium text-blue-300">Info</p>
                <p className="text-lg font-bold text-blue-200">{alertsByType.info.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-green-950/30 border border-green-800/30 p-3 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
              <div>
                <p className="text-xs font-medium text-green-300">Success</p>
                <p className="text-lg font-bold text-green-200">{alertsByType.success.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Alert List */}
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {alerts.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-400" />
              <p className="text-sm font-medium text-gray-300">All systems normal</p>
              <p className="text-xs text-gray-500">No alerts to display</p>
            </div>
          ) : (
            <>
              {/* Critical alerts first */}
              {alertsByType.critical.map(alert => (
                <AlertItem key={alert.id} alert={alert} />
              ))}
              
              {/* Warning alerts */}
              {alertsByType.warning.map(alert => (
                <AlertItem key={alert.id} alert={alert} />
              ))}
              
              {/* Success alerts */}
              {alertsByType.success.map(alert => (
                <AlertItem key={alert.id} alert={alert} />
              ))}
              
              {/* Info alerts last */}
              {alertsByType.info.map(alert => (
                <AlertItem key={alert.id} alert={alert} />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
} 