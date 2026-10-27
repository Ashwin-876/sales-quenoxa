import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  PhoneCall,
  Award,
  TrendingUp,
  CheckCircle2,
  Mail,
  Shield,
  Layers
} from 'lucide-react';
import { TeamMember } from '../../../shared/types.js';
import { api } from '../services/api';

export const TeamManagementView: React.FC = () => {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadTeam = async () => {
      setLoading(true);
      try {
        const data = await api.getTeamMembers();
        setTeam(data);
      } catch (err) {
        console.error('Failed to load team:', err);
      } finally {
        setLoading(false);
      }
    };
    loadTeam();
  }, []);

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Team Management & Sales Productivity</h2>
          <p className="text-xs text-slate-500">
            Workforce distribution, lead ownership, completed call tallies, and conversion efficiency.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading team members...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {team.map((member) => (
            <div
              key={member.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-subtle hover:border-emerald-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center space-x-3 mb-3">
                  <img
                    src={member.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                    alt={member.name}
                    className="w-12 h-12 rounded-full object-cover border border-slate-200 shadow-xs"
                  />
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{member.name}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {member.role}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 flex items-center space-x-1.5 mb-4">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{member.email}</span>
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Active Leads:</span>
                    <span className="font-bold text-slate-900">{member.activeLeads}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Completed Calls:</span>
                    <span className="font-bold text-slate-900">{member.completedCalls}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Closed Deals Won:</span>
                    <span className="font-bold text-emerald-700">{member.closedWonDeals}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <span className="font-semibold text-slate-700">Win Conversion:</span>
                    <span className="font-extrabold text-slate-900 font-mono text-sm">{member.acceptanceRate}%</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Assigned Division:
                </span>
                <span className="text-xs font-semibold text-slate-700 block truncate">
                  Enterprise Solutions & AI Delivery
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
