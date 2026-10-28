import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  Phone,
  Target,
  Search,
  Plus,
  MoreVertical,
  Mail,
  Edit3,
  Eye,
  Check,
  X,
  ChevronDown,
  Building,
  Briefcase,
  TrendingUp,
  Award,
  PhoneCall,
  Calendar,
  FileText,
  AlertCircle
} from 'lucide-react';
import { TeamMember } from '../../../shared/types.js';
import { api } from '../services/api';

const DEFAULT_TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'user-ashwin',
    name: 'Ashwin Kumar',
    email: 'ashwin@quenoxa.com',
    role: 'Admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    activeLeads: 0,
    completedCalls: 0,
    closedWonDeals: 0,
    acceptanceRate: 0,
    division: 'Enterprise Solutions & AI Delivery',
    status: 'Active',
    phone: '+91 6369480281'
  },
  {
    id: 'user-karthik',
    name: 'Karthik Subramanian',
    email: 'karthik.sales@quenoxa.com',
    role: 'Sales Manager',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    activeLeads: 0,
    completedCalls: 0,
    closedWonDeals: 0,
    acceptanceRate: 0,
    division: 'Enterprise Solutions & AI Delivery',
    status: 'Active',
    phone: '+91 9840123456'
  },
  {
    id: 'user-priya',
    name: 'Priya Narayanan',
    email: 'priya.n@quenoxa.com',
    role: 'Sales Rep',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    activeLeads: 0,
    completedCalls: 0,
    closedWonDeals: 0,
    acceptanceRate: 0,
    division: 'Enterprise Solutions & AI Delivery',
    status: 'Active',
    phone: '+91 9791054321'
  },
  {
    id: 'user-suresh',
    name: 'Suresh Varma',
    email: 'suresh.ai@quenoxa.com',
    role: 'Business Analyst',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    activeLeads: 0,
    completedCalls: 0,
    closedWonDeals: 0,
    acceptanceRate: 0,
    division: 'Enterprise Solutions & AI Delivery',
    status: 'Active',
    phone: '+91 9444112233'
  }
];

export const TeamManagementView: React.FC = () => {
  const [team, setTeam] = useState<TeamMember[]>(DEFAULT_TEAM_MEMBERS);
  const [loading, setLoading] = useState(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('All Divisions');
  const [selectedRole, setSelectedRole] = useState('All Roles');
  const [selectedStatus, setSelectedStatus] = useState('All Status');

  // Menus & Modals
  const [activeMenuMemberId, setActiveMenuMemberId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [viewingMember, setViewingMember] = useState<TeamMember | null>(null);

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Sales Rep' as TeamMember['role'],
    division: 'Enterprise Solutions & AI Delivery',
    status: 'Active' as 'Active' | 'Away' | 'Inactive',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    phone: ''
  });

  const loadTeam = async () => {
    try {
      const data = await api.getTeamMembers();
      if (data && data.length > 0) {
        // Merge with existing divisions & status if present
        const merged = data.map((d) => {
          const matched = DEFAULT_TEAM_MEMBERS.find((m) => m.email.toLowerCase() === d.email.toLowerCase());
          return {
            ...d,
            division: d.division || matched?.division || 'Enterprise Solutions & AI Delivery',
            status: d.status || matched?.status || 'Active',
            avatar: d.avatar || matched?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            phone: d.phone || matched?.phone || ''
          };
        });
        setTeam(merged);
      }
    } catch (err) {
      console.warn('Using default team members as fallback:', err);
    }
  };

  useEffect(() => {
    loadTeam();
  }, []);

  // Close 3-dot menu on clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.member-actions-menu')) {
        setActiveMenuMemberId(null);
      }
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Filtered members
  const filteredTeam = team.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (member.division && member.division.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesDivision =
      selectedDivision === 'All Divisions' || member.division === selectedDivision;

    const matchesRole =
      selectedRole === 'All Roles' || member.role === selectedRole;

    const matchesStatus =
      selectedStatus === 'All Status' || (member.status || 'Active') === selectedStatus;

    return matchesSearch && matchesDivision && matchesRole && matchesStatus;
  });

  // KPI Calculations
  const totalMembers = team.length;
  const activeMembers = team.filter((m) => (m.status || 'Active') === 'Active').length;
  const totalCalls = team.reduce((acc, m) => acc + (m.completedCalls || 0), 0);
  const totalWonDeals = team.reduce((acc, m) => acc + (m.closedWonDeals || 0), 0);

  // Role Badge Styling
  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'bg-blue-50 text-blue-600 border border-blue-200/60';
      case 'Sales Manager':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200/60';
      case 'Sales Rep':
        return 'bg-purple-50 text-purple-700 border border-purple-200/60';
      case 'Business Analyst':
        return 'bg-amber-50 text-amber-800 border border-amber-200/60';
      default:
        return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (member: TeamMember) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      email: member.email,
      role: member.role,
      division: member.division || 'Enterprise Solutions & AI Delivery',
      status: member.status || 'Active',
      avatar: member.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      phone: member.phone || ''
    });
    setActiveMenuMemberId(null);
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setFormData({
      name: '',
      email: '',
      role: 'Sales Rep',
      division: 'Enterprise Solutions & AI Delivery',
      status: 'Active',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      phone: ''
    });
    setShowAddModal(true);
  };

  // Submit Add
  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    const newMember: TeamMember = {
      id: `user-${Date.now()}`,
      name: formData.name,
      email: formData.email,
      role: formData.role,
      division: formData.division,
      status: formData.status,
      avatar: formData.avatar,
      phone: formData.phone,
      activeLeads: 0,
      completedCalls: 0,
      closedWonDeals: 0,
      acceptanceRate: 0
    };

    setTeam((prev) => [...prev, newMember]);
    setShowAddModal(false);

    try {
      await api.createTeamMember(newMember);
      loadTeam();
    } catch (err) {
      console.warn('Saved member locally:', err);
    }
  };

  // Submit Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    const updated: TeamMember = {
      ...editingMember,
      name: formData.name,
      email: formData.email,
      role: formData.role,
      division: formData.division,
      status: formData.status,
      avatar: formData.avatar,
      phone: formData.phone
    };

    setTeam((prev) => prev.map((m) => (m.id === editingMember.id ? updated : m)));
    setEditingMember(null);

    try {
      await api.updateTeamMember(editingMember.id, updated);
      loadTeam();
    } catch (err) {
      console.warn('Updated member locally:', err);
    }
  };

  // Delete Member
  const handleDeleteMember = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this team member?')) return;
    setTeam((prev) => prev.filter((m) => m.id !== id));
    setActiveMenuMemberId(null);
    try {
      await api.deleteTeamMember(id);
      loadTeam();
    } catch (err) {
      console.warn('Deleted member locally:', err);
    }
  };

  // Toggle Status
  const handleToggleStatus = async (member: TeamMember) => {
    const nextStatus: 'Active' | 'Away' | 'Inactive' =
      member.status === 'Active' ? 'Away' : member.status === 'Away' ? 'Inactive' : 'Active';
    const updated = { ...member, status: nextStatus };
    setTeam((prev) => prev.map((m) => (m.id === member.id ? updated : m)));
    setActiveMenuMemberId(null);
    try {
      await api.updateTeamMember(member.id, { status: nextStatus });
    } catch (err) {
      console.warn('Status updated locally');
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-xs shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Team Management & Sales Productivity
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Manage your team, track performance, and improve sales productivity.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium text-sm rounded-lg shadow-sm hover:shadow transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Team Member</span>
        </button>
      </div>

      {/* 2. Top Metric / KPI Summary Cards (Row of 4) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Team Members */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Team Members</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{totalMembers}</p>
          </div>
        </div>

        {/* Card 2: Active Members */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Active Members</p>
            <p className="text-2xl font-bold text-emerald-600 mt-0.5">{activeMembers}</p>
          </div>
        </div>

        {/* Card 3: Total Calls */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
            <Phone className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Calls (This Month)</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{totalCalls}</p>
          </div>
        </div>

        {/* Card 4: Closed Deals Won */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Closed Deals Won</p>
            <p className="text-2xl font-bold text-emerald-600 mt-0.5">{totalWonDeals}</p>
          </div>
        </div>
      </div>

      {/* 3. Search and Filters Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-2 sm:p-2.5 shadow-xs flex flex-col md:flex-row items-center gap-2.5">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search team members by name, role, email..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 bg-transparent border-0 focus:outline-none focus:ring-0"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters Group */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {/* Division Filter */}
          <div className="relative shrink-0">
            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              className="appearance-none bg-white border border-slate-200 rounded-lg pl-3 pr-8 py-2 text-xs font-medium text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer shadow-xs"
            >
              <option value="All Divisions">All Divisions</option>
              <option value="Enterprise Solutions & AI Delivery">Enterprise Solutions & AI Delivery</option>
              <option value="Digital Outreach & Growth">Digital Outreach & Growth</option>
              <option value="Custom Engineering">Custom Engineering</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Role Filter */}
          <div className="relative shrink-0">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="appearance-none bg-white border border-slate-200 rounded-lg pl-3 pr-8 py-2 text-xs font-medium text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer shadow-xs"
            >
              <option value="All Roles">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="Sales Manager">Sales Manager</option>
              <option value="Sales Rep">Sales Rep</option>
              <option value="Business Analyst">Business Analyst</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Status Filter */}
          <div className="relative shrink-0">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="appearance-none bg-white border border-slate-200 rounded-lg pl-3 pr-8 py-2 text-xs font-medium text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer shadow-xs"
            >
              <option value="All Status">All Status</option>
              <option value="Active">Active</option>
              <option value="Away">Away</option>
              <option value="Inactive">Inactive</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 4. Team Member Grid */}
      {filteredTeam.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-700">No team members found</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search criteria or filter selections to view matching personnel.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedDivision('All Divisions');
              setSelectedRole('All Roles');
              setSelectedStatus('All Status');
            }}
            className="text-xs text-emerald-600 font-semibold hover:underline cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {filteredTeam.map((member) => (
            <div
              key={member.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between relative"
            >
              {/* Card Header */}
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={member.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                      alt={member.name}
                      className="w-12 h-12 rounded-full object-cover border border-slate-100 shadow-xs shrink-0"
                    />
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 text-sm truncate">{member.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${getRoleBadgeStyle(
                            member.role
                          )}`}
                        >
                          {member.role}
                        </span>
                        <span className="inline-flex items-center text-[11px] font-semibold text-emerald-700">
                          <span
                            className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                              member.status === 'Away'
                                ? 'bg-amber-500'
                                : member.status === 'Inactive'
                                ? 'bg-slate-400'
                                : 'bg-emerald-500'
                            }`}
                          />
                          {member.status || 'Active'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 3-Dot Action Menu */}
                  <div className="relative member-actions-menu shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuMemberId(activeMenuMemberId === member.id ? null : member.id);
                      }}
                      className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {activeMenuMemberId === member.id && (
                      <div className="absolute right-0 top-7 w-44 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-20 text-xs">
                        <button
                          onClick={() => handleOpenEdit(member)}
                          className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                          <span>Edit Details</span>
                        </button>
                        <button
                          onClick={() => {
                            setViewingMember(member);
                            setActiveMenuMemberId(null);
                          }}
                          className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-400" />
                          <span>View Profile</span>
                        </button>
                        <button
                          onClick={() => handleToggleStatus(member)}
                          className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                        >
                          <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                          <span>Set {member.status === 'Active' ? 'Away' : 'Active'}</span>
                        </button>
                        <div className="my-1 border-t border-slate-100" />
                        <button
                          onClick={() => handleDeleteMember(member.id)}
                          className="w-full px-3 py-1.5 text-left text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5 text-rose-500" />
                          <span>Remove</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mb-4">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{member.email}</span>
                </div>

                {/* Metrics Breakdown */}
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
                    <span className="font-bold text-emerald-600">{member.closedWonDeals}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <span className="font-semibold text-slate-700">Win Conversion:</span>
                    <span className="font-bold text-slate-900 font-mono text-xs">{member.acceptanceRate}%</span>
                  </div>
                </div>

                {/* Assigned Division */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Assigned Division
                  </span>
                  <span className="text-xs font-bold text-slate-800 block truncate">
                    {member.division || 'Enterprise Solutions & AI Delivery'}
                  </span>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleOpenEdit(member)}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer shadow-2xs"
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => setViewingMember(member)}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer shadow-2xs"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  <span>View Details</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. ADD TEAM MEMBER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Add New Team Member</h3>
                  <p className="text-xs text-slate-500">Add sales personnel, analysts, or administrators to Quenoxa.</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="ramesh@quenoxa.com"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Sales Manager">Sales Manager</option>
                    <option value="Sales Rep">Sales Rep</option>
                    <option value="Business Analyst">Business Analyst</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Away">Away</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Division</label>
                <select
                  value={formData.division}
                  onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                >
                  <option value="Enterprise Solutions & AI Delivery">Enterprise Solutions & AI Delivery</option>
                  <option value="Digital Outreach & Growth">Digital Outreach & Growth</option>
                  <option value="Custom Engineering">Custom Engineering</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Avatar Image URL</label>
                <input
                  type="url"
                  value={formData.avatar}
                  onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. EDIT TEAM MEMBER MODAL */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Edit Team Member</h3>
                  <p className="text-xs text-slate-500">Update profile details, role, division, and status.</p>
                </div>
              </div>
              <button
                onClick={() => setEditingMember(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Sales Manager">Sales Manager</option>
                    <option value="Sales Rep">Sales Rep</option>
                    <option value="Business Analyst">Business Analyst</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Away">Away</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Division</label>
                <select
                  value={formData.division}
                  onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                >
                  <option value="Enterprise Solutions & AI Delivery">Enterprise Solutions & AI Delivery</option>
                  <option value="Digital Outreach & Growth">Digital Outreach & Growth</option>
                  <option value="Custom Engineering">Custom Engineering</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Avatar Image URL</label>
                <input
                  type="url"
                  value={formData.avatar}
                  onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. VIEW DETAILS MODAL / DRAWER */}
      {viewingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <img
                  src={viewingMember.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt={viewingMember.name}
                  className="w-12 h-12 rounded-full object-cover border border-slate-100 shadow-xs"
                />
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{viewingMember.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getRoleBadgeStyle(
                        viewingMember.role
                      )}`}
                    >
                      {viewingMember.role}
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-700 flex items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1" />
                      {viewingMember.status || 'Active'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setViewingMember(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="py-4 space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> Email:
                  </span>
                  <span className="font-semibold text-slate-900">{viewingMember.email}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Building className="w-3.5 h-3.5 text-slate-400" /> Division:
                  </span>
                  <span className="font-semibold text-slate-900">{viewingMember.division || 'Enterprise Solutions & AI Delivery'}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> Contact:
                  </span>
                  <span className="font-semibold text-slate-900">{viewingMember.phone || '+91 6369480281'}</span>
                </div>
              </div>

              {/* Productivity Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Active Leads Assigned
                  </span>
                  <span className="text-xl font-bold text-slate-900 mt-1 block">
                    {viewingMember.activeLeads}
                  </span>
                </div>
                <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Completed Calls
                  </span>
                  <span className="text-xl font-bold text-slate-900 mt-1 block">
                    {viewingMember.completedCalls}
                  </span>
                </div>
                <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Closed Deals Won
                  </span>
                  <span className="text-xl font-bold text-emerald-600 mt-1 block">
                    {viewingMember.closedWonDeals}
                  </span>
                </div>
                <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Win Conversion Rate
                  </span>
                  <span className="text-xl font-bold text-slate-900 mt-1 block">
                    {viewingMember.acceptanceRate}%
                  </span>
                </div>
              </div>

              {/* Recent Assigned Activity Note */}
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100/80 text-xs text-emerald-800 flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p>
                  Active member of Quenoxa Global Technologies sales & solutions division. Automatically tracks outreach and conversion efficiency in CRM pipeline.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                onClick={() => {
                  const m = viewingMember;
                  setViewingMember(null);
                  handleOpenEdit(m);
                }}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
              <button
                onClick={() => setViewingMember(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
