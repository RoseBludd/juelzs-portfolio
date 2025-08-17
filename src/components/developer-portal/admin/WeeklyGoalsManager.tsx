"use client";

import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconTrophy,
  IconCrown,
  IconCalendar,
  IconTarget,
  IconUsers,
  IconChevronDown,
  IconChevronUp,
  IconStar,
  IconGift,
  IconCheck,
  IconX,
  IconCurrencyDollar,
  IconAward,
  IconTrendingUp,
  IconActivity
} from "@tabler/icons-react";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";

interface GoalType {
  id: string;
  name: string;
  display_name: string;
  description: string;
  icon: string;
  color: string;
  active_goals_count: number;
  total_winners_count: number;
}

interface WeeklyGoal {
  id: string;
  title: string;
  description: string;
  goal_type: string;
  target_value: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  prize_description: string;
  prize_amount: number;
  created_by_name: string;
  goal_display_name: string;
  goal_icon: string;
  goal_color: string;
  participant_count: number;
  current_max_value: number;
  avg_value: number;
  winner_count: number;
  current_winners: any[];
  top_performers: any[];
  status: string;
}

interface Winner {
  id: string;
  goal_id: string;
  developer_id: string;
  developer_name: string;
  achievement_value: number;
  achievement_description: string;
  award_date: string;
  notes: string;
  goal_title: string;
  goal_display_name: string;
  goal_icon: string;
  goal_color: string;
}

const iconMap: { [key: string]: any } = {
  'components': IconUsers,
  'video': IconTrophy,
  'layout': IconEdit,
  'api': IconTarget,
  'code': IconEdit,
  'test-pipe': IconCheck,
  'activity': IconStar,
  'star': IconStar,
  'calendar': IconCalendar,
  'users': IconUsers,
  'default': IconGift
};

export const WeeklyGoalsManager = () => {
  const [goals, setGoals] = useState<WeeklyGoal[]>([]);
  const [goalTypes, setGoalTypes] = useState<GoalType[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'goals' | 'winners' | 'types'>('goals');
  const [showCreateGoal, setShowCreateGoal] = useState(false);
  const [showCreateWinner, setShowCreateWinner] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string>('');
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Form states
  const [goalForm, setGoalForm] = useState({
    title: '',
    description: '',
    goal_type: '',
    target_value: '',
    start_date: '',
    end_date: '',
    prize_description: '',
    prize_amount: ''
  });

  const [winnerForm, setWinnerForm] = useState({
    goal_id: '',
    developer_id: '',
    developer_name: '',
    achievement_value: '',
    achievement_description: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [goalsRes, typesRes, winnersRes] = await Promise.all([
        fetch('/api/admin/weekly-goals'),
        fetch('/api/admin/weekly-goals/types'),
        fetch('/api/admin/weekly-goals/winners')
      ]);

      if (goalsRes.ok) {
        const goalsData = await goalsRes.json();
        setGoals(goalsData.goals || []);
      }

      if (typesRes.ok) {
        const typesData = await typesRes.json();
        setGoalTypes(typesData.goalTypes || []);
      }

      if (winnersRes.ok) {
        const winnersData = await winnersRes.json();
        setWinners(winnersData.winners || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/weekly-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...goalForm,
          target_value: goalForm.target_value ? parseInt(goalForm.target_value) : null,
          prize_amount: goalForm.prize_amount ? parseFloat(goalForm.prize_amount) : null,
          created_by: 'admin'
        })
      });

      if (response.ok) {
        toast.success('Goal created successfully!');
        setShowCreateGoal(false);
        setGoalForm({
          title: '',
          description: '',
          goal_type: '',
          target_value: '',
          start_date: '',
          end_date: '',
          prize_description: '',
          prize_amount: ''
        });
        loadData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create goal');
      }
    } catch (error) {
      toast.error('Failed to create goal');
    }
  };

  const handleCreateWinner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/weekly-goals/winners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...winnerForm,
          achievement_value: winnerForm.achievement_value ? parseInt(winnerForm.achievement_value) : null
        })
      });

      if (response.ok) {
        toast.success('Winner added successfully!');
        setShowCreateWinner(false);
        setWinnerForm({
          goal_id: '',
          developer_id: '',
          developer_name: '',
          achievement_value: '',
          achievement_description: '',
          notes: ''
        });
        loadData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to add winner');
      }
    } catch (error) {
      toast.error('Failed to add winner');
    }
  };

  const toggleGoalStatus = async (goalId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/weekly-goals?id=${goalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus })
      });

      if (response.ok) {
        toast.success(`Goal ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
        loadData();
      } else {
        toast.error('Failed to update goal status');
      }
    } catch (error) {
      toast.error('Failed to update goal status');
    }
  };

  const getIconComponent = (iconName: string) => {
    const IconComponent = iconMap[iconName] || iconMap.default;
    return <IconComponent className="w-4 h-4" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500 text-white';
      case 'upcoming': return 'bg-blue-500 text-white';
      case 'completed': return 'bg-gray-500 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatCurrency = (amount: number) => {
    if (!amount) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Calculate summary stats
  const activeGoals = goals.filter(g => g.is_active).length;
  const totalParticipants = goals.reduce((sum, g) => sum + g.participant_count, 0);
  const totalWinners = winners.length;
  const thisWeekWinners = winners.filter(w => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return new Date(w.award_date) >= weekAgo;
  }).length;

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-yellow-900/20 to-amber-900/20 border border-yellow-500/20 rounded-xl p-4 sm:p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-yellow-500/20 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-yellow-500/10 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-yellow-900/20 to-amber-900/20 border border-yellow-500/20 rounded-xl p-4 sm:p-6">
      {/* Header with Summary */}
      <div className="flex items-center justify-between mb-4">
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-3 text-white hover:text-yellow-300 transition-colors group"
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-lg flex items-center justify-center">
            <IconTrophy className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div className="text-left">
            <h2 className="text-lg sm:text-xl font-bold text-white group-hover:text-yellow-300 transition-colors">
              Weekly Goals
            </h2>
            <p className="text-xs sm:text-sm text-yellow-300/80">
              {activeGoals} active • {totalParticipants} participants • {thisWeekWinners} winners this week
            </p>
          </div>
          {isExpanded ? (
            <IconChevronUp className="w-4 h-4 text-yellow-400 ml-2" />
          ) : (
            <IconChevronDown className="w-4 h-4 text-yellow-400 ml-2" />
          )}
        </button>

        {/* Quick Stats */}
        {!isExpanded && (
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2 text-center">
              <div className="text-lg sm:text-xl font-bold text-yellow-400">{activeGoals}</div>
              <div className="text-xs text-yellow-300/80">Active</div>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 text-center">
              <div className="text-lg sm:text-xl font-bold text-amber-400">{totalWinners}</div>
              <div className="text-xs text-amber-300/80">Winners</div>
            </div>
          </div>
        )}
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <>
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <button
              onClick={() => setShowCreateGoal(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700 text-white rounded-lg transition-all duration-200 text-sm font-medium"
            >
              <IconPlus className="w-4 h-4" />
              New Goal
            </button>
            <button
              onClick={() => setShowCreateWinner(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-lg transition-all duration-200 text-sm font-medium"
            >
              <IconCrown className="w-4 h-4" />
              Add Winner
            </button>
          </div>

          {/* Enhanced Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-3 text-center">
              <IconActivity className="w-5 h-5 text-green-400 mx-auto mb-1" />
              <div className="text-xl font-bold text-green-400">{activeGoals}</div>
              <div className="text-xs text-green-300/80">Active Goals</div>
            </div>
            <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-lg p-3 text-center">
              <IconUsers className="w-5 h-5 text-blue-400 mx-auto mb-1" />
              <div className="text-xl font-bold text-blue-400">{totalParticipants}</div>
              <div className="text-xs text-blue-300/80">Participants</div>
            </div>
            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-3 text-center">
              <IconAward className="w-5 h-5 text-purple-400 mx-auto mb-1" />
              <div className="text-xl font-bold text-purple-400">{totalWinners}</div>
              <div className="text-xs text-purple-300/80">Total Winners</div>
            </div>
            <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-lg p-3 text-center">
              <IconTrendingUp className="w-5 h-5 text-orange-400 mx-auto mb-1" />
              <div className="text-xl font-bold text-orange-400">{thisWeekWinners}</div>
              <div className="text-xs text-orange-300/80">This Week</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex bg-black/20 rounded-lg p-1 mb-4">
            {[
              { id: 'goals', name: 'Goals', icon: IconTarget },
              { id: 'winners', name: 'Winners', icon: IconCrown },
              { id: 'types', name: 'Types', icon: IconGift }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-yellow-600 text-white shadow-lg'
                    : 'text-yellow-200 hover:text-white hover:bg-yellow-600/20'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.name}</span>
              </button>
            ))}
          </div>

          {/* Goals Tab */}
          {activeTab === 'goals' && (
            <div className="space-y-3">
              {goals.length === 0 ? (
                <div className="text-center py-12 text-yellow-300/60">
                  <IconTarget className="w-16 h-16 mx-auto mb-4 opacity-40" />
                  <p className="text-lg font-medium">No goals created yet</p>
                  <p className="text-sm text-yellow-400/60 mt-1">Create your first goal to get started</p>
                </div>
              ) : (
                goals.map(goal => (
                  <div key={goal.id} className="bg-black/20 border border-yellow-500/10 rounded-lg p-4 hover:bg-black/30 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`p-2 rounded-lg bg-${goal.goal_color}-500/20 border border-${goal.goal_color}-500/30 flex-shrink-0`}>
                          {getIconComponent(goal.goal_icon)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-semibold text-sm sm:text-base truncate">{goal.title}</h3>
                          <p className="text-yellow-200/80 text-xs sm:text-sm truncate">{goal.goal_display_name}</p>
                          {goal.prize_amount && (
                            <p className="text-green-400 text-xs sm:text-sm font-medium mt-1 flex items-center gap-1">
                              <IconCurrencyDollar className="w-3 h-3" />
                              {formatCurrency(goal.prize_amount)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(goal.status)}`}>
                          {goal.status}
                        </span>
                        <button
                          onClick={() => setExpandedGoal(expandedGoal === goal.id ? null : goal.id)}
                          className="p-1 text-yellow-400 hover:text-yellow-300 transition-colors"
                        >
                          {expandedGoal === goal.id ? (
                            <IconChevronUp className="w-4 h-4" />
                          ) : (
                            <IconChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Compact metrics */}
                    <div className="mt-3 flex items-center gap-4 text-xs">
                      <span className="text-yellow-300/80">
                        {formatDate(goal.start_date)} - {formatDate(goal.end_date)}
                      </span>
                      <span className="text-blue-300/80">{goal.participant_count} participants</span>
                      <span className="text-green-300/80">Top: {goal.current_max_value}</span>
                      <span className="text-purple-300/80">{goal.winner_count} winners</span>
                    </div>

                    {expandedGoal === goal.id && (
                      <div className="mt-4 border-t border-yellow-500/20 pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Top Performers */}
                          <div>
                            <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                              <IconUsers className="w-4 h-4" />
                              Top Performers
                            </h4>
                            {goal.top_performers && goal.top_performers.length > 0 ? (
                              <div className="space-y-2">
                                {goal.top_performers.slice(0, 3).map((performer: any, index: number) => (
                                  <div key={performer.developer_id} className="flex items-center justify-between p-2 bg-black/20 rounded">
                                    <span className="text-yellow-200 text-sm">
                                      #{index + 1} {performer.developer_name}
                                    </span>
                                    <span className="text-white font-medium">{performer.current_value}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-yellow-300/60 text-sm">No participants yet</p>
                            )}
                          </div>

                          {/* Actions */}
                          <div>
                            <h4 className="text-white font-medium mb-2">Actions</h4>
                            <div className="space-y-2">
                              <button
                                onClick={() => toggleGoalStatus(goal.id, goal.is_active)}
                                className={`w-full px-3 py-2 rounded text-sm font-medium transition-colors ${
                                  goal.is_active
                                    ? 'bg-red-600 hover:bg-red-700 text-white'
                                    : 'bg-green-600 hover:bg-green-700 text-white'
                                }`}
                              >
                                {goal.is_active ? 'Deactivate' : 'Activate'}
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedGoalId(goal.id);
                                  setShowCreateWinner(true);
                                  setWinnerForm(prev => ({ ...prev, goal_id: goal.id }));
                                }}
                                className="w-full px-3 py-2 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700 text-white rounded text-sm font-medium transition-all duration-200"
                              >
                                Add Winner
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Winners Tab */}
          {activeTab === 'winners' && (
            <div className="space-y-3">
              {winners.length === 0 ? (
                <div className="text-center py-12 text-yellow-300/60">
                  <IconCrown className="w-16 h-16 mx-auto mb-4 opacity-40" />
                  <p className="text-lg font-medium">No winners recorded yet</p>
                  <p className="text-sm text-yellow-400/60 mt-1">Add winners to celebrate achievements</p>
                </div>
              ) : (
                winners.map(winner => (
                  <div key={winner.id} className="bg-black/20 border border-yellow-500/10 rounded-lg p-4 hover:bg-black/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-full flex items-center justify-center">
                          <IconCrown className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-white font-semibold">{winner.developer_name}</h3>
                          <p className="text-yellow-200/80 text-sm">{winner.goal_display_name}</p>
                          <p className="text-yellow-300/60 text-xs">{formatDate(winner.award_date)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-yellow-400">{winner.achievement_value}</div>
                        <div className="text-xs text-yellow-300/80">Achievement</div>
                      </div>
                    </div>
                    {winner.achievement_description && (
                      <div className="mt-3 p-2 bg-black/20 rounded text-sm text-yellow-200/80">
                        {winner.achievement_description}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Goal Types Tab */}
          {activeTab === 'types' && (
            <div className="space-y-3">
              {goalTypes.length === 0 ? (
                <div className="text-center py-12 text-yellow-300/60">
                  <IconGift className="w-16 h-16 mx-auto mb-4 opacity-40" />
                  <p className="text-lg font-medium">No goal types available</p>
                </div>
              ) : (
                goalTypes.map(type => (
                  <div key={type.id} className="bg-black/20 border border-yellow-500/10 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-${type.color}-500/20 border border-${type.color}-500/30`}>
                          {getIconComponent(type.icon)}
                        </div>
                        <div>
                          <h3 className="text-white font-semibold">{type.display_name}</h3>
                          <p className="text-yellow-200/80 text-sm">{type.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-yellow-400">{type.active_goals_count}</div>
                        <div className="text-xs text-yellow-300/80">Active Goals</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Create Goal Modal */}
          {showCreateGoal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-gray-800 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-white">Create New Goal</h3>
                    <button
                      onClick={() => {
                        setShowCreateGoal(false);
                        setGoalForm({
                          title: '',
                          description: '',
                          goal_type: '',
                          target_value: '',
                          start_date: '',
                          end_date: '',
                          prize_description: '',
                          prize_amount: ''
                        });
                      }}
                      className="text-gray-400 hover:text-white"
                    >
                      <IconX className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <form onSubmit={handleCreateGoal} className="space-y-4">
                    <input
                      type="text"
                      placeholder="Goal Title"
                      value={goalForm.title}
                      onChange={(e) => setGoalForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-yellow-500 focus:outline-none"
                      required
                    />
                    
                    <textarea
                      placeholder="Description"
                      value={goalForm.description}
                      onChange={(e) => setGoalForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-yellow-500 focus:outline-none"
                      rows={3}
                    />
                    
                    <select
                      value={goalForm.goal_type}
                      onChange={(e) => setGoalForm(prev => ({ ...prev, goal_type: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-yellow-500 focus:outline-none"
                      required
                    >
                      <option value="">Select Goal Type</option>
                      {goalTypes.map(type => (
                        <option key={type.id} value={type.id}>{type.display_name}</option>
                      ))}
                    </select>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="number"
                        placeholder="Target Value"
                        value={goalForm.target_value}
                        onChange={(e) => setGoalForm(prev => ({ ...prev, target_value: e.target.value }))}
                        className="px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-yellow-500 focus:outline-none"
                        required
                        min="1"
                      />
                      
                      <input
                        type="number"
                        placeholder="Prize Amount ($)"
                        value={goalForm.prize_amount}
                        onChange={(e) => setGoalForm(prev => ({ ...prev, prize_amount: e.target.value }))}
                        className="px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-yellow-500 focus:outline-none"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="date"
                        value={goalForm.start_date}
                        onChange={(e) => setGoalForm(prev => ({ ...prev, start_date: e.target.value }))}
                        className="px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-yellow-500 focus:outline-none"
                        required
                      />
                      
                      <input
                        type="date"
                        value={goalForm.end_date}
                        onChange={(e) => setGoalForm(prev => ({ ...prev, end_date: e.target.value }))}
                        className="px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-yellow-500 focus:outline-none"
                        required
                      />
                    </div>
                    
                    <input
                      type="text"
                      placeholder="Prize Description"
                      value={goalForm.prize_description}
                      onChange={(e) => setGoalForm(prev => ({ ...prev, prize_description: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-yellow-500 focus:outline-none"
                    />
                    
                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowCreateGoal(false);
                          setGoalForm({
                            title: '',
                            description: '',
                            goal_type: '',
                            target_value: '',
                            start_date: '',
                            end_date: '',
                            prize_description: '',
                            prize_amount: ''
                          });
                        }}
                        className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700 text-white rounded-lg transition-all duration-200"
                      >
                        Create Goal
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Create Winner Modal */}
          {showCreateWinner && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-gray-800 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-white">Add Winner</h3>
                    <button
                      onClick={() => {
                        setShowCreateWinner(false);
                        setWinnerForm({
                          goal_id: '',
                          developer_id: '',
                          developer_name: '',
                          achievement_value: '',
                          achievement_description: '',
                          notes: ''
                        });
                      }}
                      className="text-gray-400 hover:text-white"
                    >
                      <IconX className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <form onSubmit={handleCreateWinner} className="space-y-4">
                    <select
                      value={winnerForm.goal_id}
                      onChange={(e) => setWinnerForm(prev => ({ ...prev, goal_id: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-yellow-500 focus:outline-none"
                      required
                    >
                      <option value="">Select Goal</option>
                      {goals.filter(g => g.is_active).map(goal => (
                        <option key={goal.id} value={goal.id}>{goal.title}</option>
                      ))}
                    </select>
                    
                    <input
                      type="text"
                      placeholder="Developer Name"
                      value={winnerForm.developer_name}
                      onChange={(e) => setWinnerForm(prev => ({ ...prev, developer_name: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-yellow-500 focus:outline-none"
                      required
                    />
                    
                    <input
                      type="number"
                      placeholder="Achievement Value"
                      value={winnerForm.achievement_value}
                      onChange={(e) => setWinnerForm(prev => ({ ...prev, achievement_value: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-yellow-500 focus:outline-none"
                      required
                      min="1"
                    />
                    
                    <textarea
                      placeholder="Achievement Description"
                      value={winnerForm.achievement_description}
                      onChange={(e) => setWinnerForm(prev => ({ ...prev, achievement_description: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-yellow-500 focus:outline-none"
                      rows={3}
                    />
                    
                    <textarea
                      placeholder="Notes (optional)"
                      value={winnerForm.notes}
                      onChange={(e) => setWinnerForm(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-yellow-500 focus:outline-none"
                      rows={2}
                    />
                    
                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowCreateWinner(false);
                          setWinnerForm({
                            goal_id: '',
                            developer_id: '',
                            developer_name: '',
                            achievement_value: '',
                            achievement_description: '',
                            notes: ''
                          });
                        }}
                        className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700 text-white rounded-lg transition-all duration-200"
                      >
                        Add Winner
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}; 