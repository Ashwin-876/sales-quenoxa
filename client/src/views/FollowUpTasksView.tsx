import React, { useState, useEffect } from 'react';
import {
  CalendarCheck2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  MessageSquare,
  Mail,
  ChevronRight,
  Sparkles,
  PhoneCall
} from 'lucide-react';
import { FollowUpTask } from '../../../shared/types.js';
import { api } from '../services/api';
import { ViewKey } from '../components/layout/Sidebar';

interface FollowUpTasksViewProps {
  onNavigate: (view: ViewKey) => void;
  onRefreshMetrics: () => void;
}

export const FollowUpTasksView: React.FC<FollowUpTasksViewProps> = ({
  onNavigate,
  onRefreshMetrics
}) => {
  const [tasks, setTasks] = useState<FollowUpTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterTab, setFilterTab] = useState<'due_today' | 'upcoming' | 'overdue' | 'completed'>('due_today');
  const [copiedTaskId, setCopiedTaskId] = useState<string | null>(null);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await api.getFollowUps(filterTab);
      setTasks(data);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [filterTab]);

  const handleMarkComplete = async (taskId: string) => {
    try {
      await api.updateFollowUp(taskId, { status: 'completed' });
      setTasks(prev => prev.filter(t => t.id !== taskId));
      onRefreshMetrics();
    } catch (err: any) {
      alert(err?.message || 'Failed to update task');
    }
  };

  const handleCopyMessage = (taskId: string, message: string) => {
    navigator.clipboard.writeText(message);
    setCopiedTaskId(taskId);
    setTimeout(() => setCopiedTaskId(null), 2000);
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Follow-Up Tasks & Reminders</h2>
          <p className="text-xs text-slate-500">
            Automated callback schedules, proposal reviews, and AI-suggested touchpoint messaging.
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center space-x-1.5 p-1 bg-white border border-slate-200 rounded-xl shadow-xs text-xs">
          <button
            onClick={() => setFilterTab('due_today')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              filterTab === 'due_today'
                ? 'bg-amber-100 text-amber-900'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Due Today
          </button>
          <button
            onClick={() => setFilterTab('upcoming')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              filterTab === 'upcoming'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setFilterTab('overdue')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              filterTab === 'overdue'
                ? 'bg-rose-100 text-rose-900'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Overdue
          </button>
          <button
            onClick={() => setFilterTab('completed')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              filterTab === 'completed'
                ? 'bg-slate-800 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Completed
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading follow-up tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
            <CalendarCheck2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700">No {filterTab.replace('_', ' ')} tasks.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Tasks scheduled after calls and proposal submissions will appear here.</p>
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-subtle hover:border-emerald-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    task.priority === 'urgent'
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : task.priority === 'high'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {task.priority} Priority
                  </span>
                  <span className="text-xs font-semibold text-slate-500">•</span>
                  <span className="text-xs font-semibold text-slate-500 font-mono">
                    Due: {task.dueDate}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900">{task.title}</h4>
                  <p className="text-xs text-slate-500 font-medium">
                    Customer: <span className="text-slate-800 font-semibold">{task.customerName}</span> ({task.companyName})
                  </p>
                  <p className="text-xs text-slate-600 mt-1">{task.description}</p>
                </div>

                {/* AI Suggested Message preview */}
                {task.aiSuggestedMessage && (
                  <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100 text-[11px] text-emerald-950 flex items-start justify-between gap-2">
                    <div className="flex items-start space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-bold text-emerald-900 block text-[10px] uppercase">AI Suggested Touchpoint Note:</span>
                        <span>"{task.aiSuggestedMessage}"</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCopyMessage(task.id, task.aiSuggestedMessage!)}
                      className="text-emerald-700 hover:text-emerald-900 shrink-0 p-1 rounded hover:bg-emerald-100/50"
                      title="Copy touchpoint text"
                    >
                      {copiedTaskId === task.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 shrink-0">
                {task.status !== 'completed' && (
                  <button
                    onClick={() => handleMarkComplete(task.id)}
                    className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-colors shadow-xs flex items-center space-x-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Complete</span>
                  </button>
                )}
                <button
                  onClick={() => onNavigate('cold-call-studio')}
                  className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  title="Launch Cold Call Studio"
                >
                  <PhoneCall className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onNavigate('whatsapp-outreach')}
                  className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  title="Launch WhatsApp Outreach"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
