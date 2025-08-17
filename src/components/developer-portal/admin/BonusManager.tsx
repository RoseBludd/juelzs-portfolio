"use client";

import React, { useState, useEffect } from 'react';
import { 
  IconGift, 
  IconPlus, 
  IconEdit, 
  IconTrash, 
  IconX,
  IconChevronDown,
  IconChevronUp,
  IconToggleLeft,
  IconToggleRight,
  IconCheckbox,
  IconDownload,
  IconVideo,
  IconFlag,
  IconTrophy,
  IconStar,
  IconTarget,
  IconUsers,
  IconActivity,
  IconTrendingUp,
  IconAward
} from '@tabler/icons-react';
import { toast } from 'react-hot-toast';

interface AdminBonus {
  id: string;
  title: string;
  description: string;
  category: string;
  target_value: number;
  reward_points: number;
  icon: string;
  color: string;
  is_active: boolean;
  is_weekly: boolean;
  calculation_query: string;
  created_by_name: string;
  total_completions: number;
  this_week_completions: number;
  unique_developers: number;
  created_at: string;
}

const iconMap: { [key: string]: any } = {
  'checkbox': IconCheckbox,
  'download': IconDownload,
  'video': IconVideo,
  'flag': IconFlag,
  'trophy': IconTrophy,
  'star': IconStar,
  'target': IconTarget,
  'users': IconUsers,
  'gift': IconGift
};

const colorOptions = [
  'blue', 'green', 'purple', 'yellow', 'red', 'indigo', 'pink', 'gray'
];

const iconOptions = [
  'checkbox', 'download', 'video', 'flag', 'trophy', 'star', 'target', 'users', 'gift'
];

const categoryOptions = [
  { value: 'modules', label: 'Modules', query: 'modules_this_week' },
  { value: 'checkouts', label: 'Checkouts', query: 'total_checkouts' },
  { value: 'videos', label: 'Loom Videos', query: 'total_loom_videos' },
  { value: 'conditions', label: 'Pre/Post Conditions', query: 'total_conditions' },
  { value: 'monthly_modules', label: 'Monthly Modules', query: 'modules_this_month' }
];

export const BonusManager = () => {
  const [bonuses, setBonuses] = useState<AdminBonus[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateBonus, setShowCreateBonus] = useState(false);
  const [editingBonus, setEditingBonus] = useState<AdminBonus | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const [bonusForm, setBonusForm] = useState({
    title: '',
    description: '',
    category: '',
    target_value: '',
    reward_points: '',
    icon: 'gift',
    color: 'blue',
    is_weekly: true,
    calculation_query: ''
  });

  useEffect(() => {
    loadBonuses();
  }, []);

  const loadBonuses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/bonuses');
      
      if (response.ok) {
        const data = await response.json();
        setBonuses(data.bonuses || []);
      } else {
        toast.error('Failed to load bonuses');
      }
    } catch (error) {
      console.error('Error loading bonuses:', error);
      toast.error('Failed to load bonuses');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBonus = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/bonuses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...bonusForm,
          target_value: parseInt(bonusForm.target_value),
          reward_points: parseInt(bonusForm.reward_points) || 0,
          created_by: 'admin'
        })
      });

      if (response.ok) {
        toast.success('Bonus created successfully!');
        setShowCreateBonus(false);
        resetForm();
        loadBonuses();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create bonus');
      }
    } catch (error) {
      toast.error('Failed to create bonus');
    }
  };

  const handleUpdateBonus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBonus) return;

    try {
      const response = await fetch(`/api/admin/bonuses?id=${editingBonus.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...bonusForm,
          target_value: parseInt(bonusForm.target_value),
          reward_points: parseInt(bonusForm.reward_points) || 0
        })
      });

      if (response.ok) {
        toast.success('Bonus updated successfully!');
        setEditingBonus(null);
        resetForm();
        loadBonuses();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update bonus');
      }
    } catch (error) {
      toast.error('Failed to update bonus');
    }
  };

  const handleToggleActive = async (bonus: AdminBonus) => {
    try {
      const response = await fetch(`/api/admin/bonuses?id=${bonus.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !bonus.is_active })
      });

      if (response.ok) {
        toast.success(`Bonus ${!bonus.is_active ? 'activated' : 'deactivated'}!`);
        loadBonuses();
      } else {
        toast.error('Failed to update bonus status');
      }
    } catch (error) {
      toast.error('Failed to update bonus status');
    }
  };

  const handleDeleteBonus = async (bonus: AdminBonus) => {
    if (!confirm(`Are you sure you want to delete "${bonus.title}"?`)) return;

    try {
      const response = await fetch(`/api/admin/bonuses?id=${bonus.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message || 'Bonus deleted successfully!');
        loadBonuses();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete bonus');
      }
    } catch (error) {
      toast.error('Failed to delete bonus');
    }
  };

  const startEditing = (bonus: AdminBonus) => {
    setEditingBonus(bonus);
    setBonusForm({
      title: bonus.title,
      description: bonus.description,
      category: bonus.category,
      target_value: bonus.target_value.toString(),
      reward_points: bonus.reward_points.toString(),
      icon: bonus.icon,
      color: bonus.color,
      is_weekly: bonus.is_weekly,
      calculation_query: bonus.calculation_query || ''
    });
  };

  const resetForm = () => {
    setBonusForm({
      title: '',
      description: '',
      category: '',
      target_value: '',
      reward_points: '',
      icon: 'gift',
      color: 'blue',
      is_weekly: true,
      calculation_query: ''
    });
  };

  const getIconComponent = (iconName: string) => {
    const IconComponent = iconMap[iconName] || iconMap.gift;
    return <IconComponent className="w-4 h-4" />;
  };

  const getColorClass = (color: string, type: 'bg' | 'text' | 'border') => {
    const colorMap = {
      blue: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
      green: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
      purple: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
      yellow: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
      red: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
      indigo: { bg: 'bg-indigo-500/20', text: 'text-indigo-400', border: 'border-indigo-500/30' },
      pink: { bg: 'bg-pink-500/20', text: 'text-pink-400', border: 'border-pink-500/30' },
      gray: { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30' }
    };
    return colorMap[color as keyof typeof colorMap]?.[type] || colorMap.blue[type];
  };

  // Calculate summary stats
  const activeBonuses = bonuses.filter(b => b.is_active).length;
  const totalCompletions = bonuses.reduce((sum, b) => sum + b.total_completions, 0);
  const thisWeekCompletions = bonuses.reduce((sum, b) => sum + b.this_week_completions, 0);
  const uniqueDevelopers = [...new Set(bonuses.flatMap(b => b.unique_developers))].length;

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-blue-900/20 to-indigo-900/20 border border-blue-500/20 rounded-xl p-4 sm:p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-blue-500/20 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-blue-500/10 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-900/20 to-indigo-900/20 border border-blue-500/20 rounded-xl p-4 sm:p-6">
      {/* Header with Summary */}
      <div className="flex items-center justify-between mb-4">
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-3 text-white hover:text-blue-300 transition-colors group"
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <IconGift className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div className="text-left">
            <h2 className="text-lg sm:text-xl font-bold text-white group-hover:text-blue-300 transition-colors">
              Bonus Manager
            </h2>
            <p className="text-xs sm:text-sm text-blue-300/80">
              {activeBonuses} active • {thisWeekCompletions} completions this week
            </p>
          </div>
          {isExpanded ? (
            <IconChevronUp className="w-4 h-4 text-blue-400 ml-2" />
          ) : (
            <IconChevronDown className="w-4 h-4 text-blue-400 ml-2" />
          )}
        </button>

        {/* Quick Stats */}
        {!isExpanded && (
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2 text-center">
              <div className="text-lg sm:text-xl font-bold text-blue-400">{activeBonuses}</div>
              <div className="text-xs text-blue-300/80">Active</div>
            </div>
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-2 text-center">
              <div className="text-lg sm:text-xl font-bold text-indigo-400">{thisWeekCompletions}</div>
              <div className="text-xs text-indigo-300/80">This Week</div>
            </div>
          </div>
        )}
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <>
          {/* Action Button */}
          <div className="flex mb-4">
            <button
              onClick={() => setShowCreateBonus(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-all duration-200 text-sm font-medium"
            >
              <IconPlus className="w-4 h-4" />
              New Bonus
            </button>
          </div>

          {/* Enhanced Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-3 text-center">
              <IconActivity className="w-5 h-5 text-green-400 mx-auto mb-1" />
              <div className="text-xl font-bold text-green-400">{activeBonuses}</div>
              <div className="text-xs text-green-300/80">Active Bonuses</div>
            </div>
            <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-lg p-3 text-center">
              <IconAward className="w-5 h-5 text-blue-400 mx-auto mb-1" />
              <div className="text-xl font-bold text-blue-400">{totalCompletions}</div>
              <div className="text-xs text-blue-300/80">Total Earned</div>
            </div>
            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-3 text-center">
              <IconTrendingUp className="w-5 h-5 text-purple-400 mx-auto mb-1" />
              <div className="text-xl font-bold text-purple-400">{thisWeekCompletions}</div>
              <div className="text-xs text-purple-300/80">This Week</div>
            </div>
            <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-lg p-3 text-center">
              <IconUsers className="w-5 h-5 text-orange-400 mx-auto mb-1" />
              <div className="text-xl font-bold text-orange-400">{uniqueDevelopers}</div>
              <div className="text-xs text-orange-300/80">Developers</div>
            </div>
          </div>

          {/* Bonuses List */}
          <div className="space-y-3">
            {bonuses.length === 0 ? (
              <div className="text-center py-12 text-blue-300/60">
                <IconGift className="w-16 h-16 mx-auto mb-4 opacity-40" />
                <p className="text-lg font-medium">No bonuses created yet</p>
                <p className="text-sm text-blue-400/60 mt-1">Create your first bonus to get started</p>
              </div>
            ) : (
              bonuses.map(bonus => (
                <div key={bonus.id} className="bg-black/20 border border-blue-500/10 rounded-lg p-4 hover:bg-black/30 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`p-2 rounded-lg ${getColorClass(bonus.color, 'bg')} border ${getColorClass(bonus.color, 'border')} flex-shrink-0`}>
                        {getIconComponent(bonus.icon)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-white font-semibold text-sm sm:text-base truncate">{bonus.title}</h3>
                          {!bonus.is_active && (
                            <span className="px-2 py-0.5 bg-gray-600/50 text-gray-300 text-xs rounded-full">Inactive</span>
                          )}
                        </div>
                        <p className="text-blue-200/80 text-xs sm:text-sm line-clamp-1 mb-2">{bonus.description}</p>
                        
                        {/* Compact info row */}
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-blue-300/80">Target: {bonus.target_value}</span>
                          <span className="text-green-300/80">Points: {bonus.reward_points}</span>
                          <span className="text-purple-300/80">{bonus.is_weekly ? 'Weekly' : 'Monthly'}</span>
                          <span className="text-yellow-300/80">{bonus.this_week_completions} this week</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Stats and Actions */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {/* Performance indicator */}
                      <div className="bg-black/20 border border-blue-500/20 p-2 rounded text-center min-w-[60px]">
                        <div className="text-sm font-bold text-blue-400">{bonus.this_week_completions}</div>
                        <div className="text-xs text-blue-300/80">This Week</div>
                      </div>
                      
                      {/* Action buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleActive(bonus)}
                          className={`p-1.5 rounded transition-colors ${
                            bonus.is_active 
                              ? 'text-green-400 hover:text-green-300 bg-green-500/10' 
                              : 'text-gray-500 hover:text-gray-400 bg-gray-500/10'
                          }`}
                          title={bonus.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {bonus.is_active ? <IconToggleRight className="w-4 h-4" /> : <IconToggleLeft className="w-4 h-4" />}
                        </button>
                        
                        <button
                          onClick={() => startEditing(bonus)}
                          className="p-1.5 text-blue-400 hover:text-blue-300 bg-blue-500/10 rounded transition-colors"
                          title="Edit"
                        >
                          <IconEdit className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => handleDeleteBonus(bonus)}
                          className="p-1.5 text-red-400 hover:text-red-300 bg-red-500/10 rounded transition-colors"
                          title="Delete"
                        >
                          <IconTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Create/Edit Modal */}
          {(showCreateBonus || editingBonus) && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-gray-800 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-white">
                      {editingBonus ? 'Edit Bonus' : 'Create New Bonus'}
                    </h3>
                    <button
                      onClick={() => {
                        setShowCreateBonus(false);
                        setEditingBonus(null);
                        resetForm();
                      }}
                      className="text-gray-400 hover:text-white"
                    >
                      <IconX className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <form onSubmit={editingBonus ? handleUpdateBonus : handleCreateBonus} className="space-y-4">
                    <input
                      type="text"
                      placeholder="Bonus Title"
                      value={bonusForm.title}
                      onChange={(e) => setBonusForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                      required
                    />
                    
                    <textarea
                      placeholder="Description"
                      value={bonusForm.description}
                      onChange={(e) => setBonusForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                      rows={3}
                    />
                    
                    <select
                      value={bonusForm.category}
                      onChange={(e) => {
                        const category = categoryOptions.find(c => c.value === e.target.value);
                        setBonusForm(prev => ({ 
                          ...prev, 
                          category: e.target.value,
                          calculation_query: category?.query || ''
                        }));
                      }}
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                      required
                    >
                      <option value="">Select Category</option>
                      {categoryOptions.map(category => (
                        <option key={category.value} value={category.value}>{category.label}</option>
                      ))}
                    </select>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="number"
                        placeholder="Target Value"
                        value={bonusForm.target_value}
                        onChange={(e) => setBonusForm(prev => ({ ...prev, target_value: e.target.value }))}
                        className="px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                        required
                        min="1"
                      />
                      
                      <input
                        type="number"
                        placeholder="Reward Points"
                        value={bonusForm.reward_points}
                        onChange={(e) => setBonusForm(prev => ({ ...prev, reward_points: e.target.value }))}
                        className="px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                        min="0"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <select
                        value={bonusForm.icon}
                        onChange={(e) => setBonusForm(prev => ({ ...prev, icon: e.target.value }))}
                        className="px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                      >
                        {iconOptions.map(icon => (
                          <option key={icon} value={icon}>{icon}</option>
                        ))}
                      </select>
                      
                      <select
                        value={bonusForm.color}
                        onChange={(e) => setBonusForm(prev => ({ ...prev, color: e.target.value }))}
                        className="px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                      >
                        {colorOptions.map(color => (
                          <option key={color} value={color}>{color}</option>
                        ))}
                      </select>
                    </div>
                    
                    <label className="flex items-center gap-2 text-white">
                      <input
                        type="checkbox"
                        checked={bonusForm.is_weekly}
                        onChange={(e) => setBonusForm(prev => ({ ...prev, is_weekly: e.target.checked }))}
                        className="rounded"
                      />
                      Weekly (unchecked = Monthly)
                    </label>
                    
                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowCreateBonus(false);
                          setEditingBonus(null);
                          resetForm();
                        }}
                        className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-all duration-200"
                      >
                        {editingBonus ? 'Update' : 'Create'} Bonus
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