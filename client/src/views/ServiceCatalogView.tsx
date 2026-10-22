import React, { useState, useEffect } from 'react';
import {
  BookOpenCheck,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Layers,
  X,
  Building2,
  Sparkles,
  AlertTriangle,
  Lightbulb,
  Workflow,
  Compass
} from 'lucide-react';
import { ServiceCatalogItem, ServiceCategory, IndustryCatalogueItem } from '../../../shared/types.js';
import { api } from '../services/api';

const SERVICE_CATEGORIES: ServiceCategory[] = [
  'AI and machine learning',
  'Website development',
  'Web application development',
  'Full-stack development',
  'Custom software',
  'Business automation',
  'Data analytics',
  'Dashboards and business intelligence',
  'Cloud solutions',
  'Software integration',
  'Technical consulting',
  'Training and technology services'
];

export const ServiceCatalogView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'industries' | 'services'>('industries');

  // Service Offerings State
  const [services, setServices] = useState<ServiceCatalogItem[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [serviceSearch, setServiceSearch] = useState('');
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceCatalogItem | null>(null);

  // Service Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ServiceCategory>('AI and machine learning');
  const [description, setDescription] = useState('');
  const [targetCustomer, setTargetCustomer] = useState('');
  const [pricingRange, setPricingRange] = useState('');
  const [complexity, setComplexity] = useState<'Low' | 'Medium' | 'High' | 'Enterprise'>('Medium');
  const [benefitsText, setBenefitsText] = useState('');
  const [limitationsText, setLimitationsText] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Industry Intelligence State (Section 7 Spec: 14 Industries A to N)
  const [industries, setIndustries] = useState<IndustryCatalogueItem[]>([]);
  const [loadingIndustries, setLoadingIndustries] = useState(false);
  const [industrySearch, setIndustrySearch] = useState('');
  const [industryModalOpen, setIndustryModalOpen] = useState(false);
  const [editingIndustry, setEditingIndustry] = useState<IndustryCatalogueItem | null>(null);

  // Industry Form State
  const [industryCode, setIndustryCode] = useState('');
  const [industryName, setIndustryName] = useState('');
  const [categoriesText, setCategoriesText] = useState('');
  const [problemsText, setProblemsText] = useState('');
  const [mappedServicesText, setMappedServicesText] = useState('');
  const [solutionsText, setSolutionsText] = useState('');
  const [exampleWorkflow, setExampleWorkflow] = useState('');

  const loadServices = async () => {
    setLoadingServices(true);
    try {
      const data = await api.getServices();
      setServices(data);
    } catch (err) {
      console.error('Failed to load services:', err);
    } finally {
      setLoadingServices(false);
    }
  };

  const loadIndustries = async () => {
    setLoadingIndustries(true);
    try {
      const data = await api.getIndustries();
      setIndustries(data);
    } catch (err) {
      console.error('Failed to load industry catalogue:', err);
    } finally {
      setLoadingIndustries(false);
    }
  };

  useEffect(() => {
    loadServices();
    loadIndustries();
  }, []);

  // ---------------------------------------------------------
  // Service Handlers
  // ---------------------------------------------------------
  const openAddServiceModal = () => {
    setEditingService(null);
    setName('');
    setCategory('AI and machine learning');
    setDescription('');
    setTargetCustomer('');
    setPricingRange('Quotation Required');
    setComplexity('Medium');
    setBenefitsText('Rapid deployment\nHigh conversion ROI');
    setLimitationsText('Requires client data access');
    setIsActive(true);
    setServiceModalOpen(true);
  };

  const openEditServiceModal = (service: ServiceCatalogItem) => {
    setEditingService(service);
    setName(service.name);
    setCategory(service.category);
    setDescription(service.description);
    setTargetCustomer(service.targetCustomer);
    setPricingRange(service.pricingRange || '');
    setComplexity(service.implementationComplexity);
    setBenefitsText(service.expectedBenefits.join('\n'));
    setLimitationsText(service.limitations.join('\n'));
    setIsActive(service.isActive);
    setServiceModalOpen(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name,
      category,
      description,
      targetCustomer,
      pricingRange,
      implementationComplexity: complexity,
      expectedBenefits: benefitsText.split('\n').map(s => s.trim()).filter(Boolean),
      limitations: limitationsText.split('\n').map(s => s.trim()).filter(Boolean),
      qualifyingRequirements: ['Standard corporate scope workshop'],
      deliveryRequirements: ['Client stakeholder access'],
      isActive
    };

    try {
      if (editingService) {
        await api.updateService(editingService.id, payload);
      } else {
        await api.createService(payload);
      }
      setServiceModalOpen(false);
      loadServices();
    } catch (err: any) {
      alert(err?.message || 'Failed to save service');
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service offering?')) return;
    try {
      await api.deleteService(id);
      loadServices();
    } catch (err: any) {
      alert(err?.message || 'Failed to delete service');
    }
  };

  const handleToggleActive = async (service: ServiceCatalogItem) => {
    try {
      await api.updateService(service.id, { isActive: !service.isActive });
      setServices(prev => prev.map(s => s.id === service.id ? { ...s, isActive: !s.isActive } : s));
    } catch (err: any) {
      alert(err?.message || 'Failed to toggle active status');
    }
  };

  // ---------------------------------------------------------
  // Industry Intelligence Handlers (Section 7)
  // ---------------------------------------------------------
  const openAddIndustryModal = () => {
    setEditingIndustry(null);
    setIndustryCode('');
    setIndustryName('');
    setCategoriesText('Specialized Sub-sector 1\nSpecialized Sub-sector 2');
    setProblemsText('Untracked customer inquiries and delayed responses\nManual operational records causing overhead');
    setMappedServicesText('Lead CRM & Follow-up Automation\nDedicated Business Portal\nAutomated Customer Notifications');
    setSolutionsText('Centralized inquiry pipeline with automatic alerts\nCustom web portal tailored for vertical clients');
    setExampleWorkflow('For businesses lacking automated follow-ups, prioritize lead capture CRM before upgrading to advanced portals.');
    setIndustryModalOpen(true);
  };

  const openEditIndustryModal = (item: IndustryCatalogueItem) => {
    setEditingIndustry(item);
    setIndustryCode(item.code);
    setIndustryName(item.industryName);
    setCategoriesText((item.businessCategories || []).join('\n'));
    setProblemsText((item.commonProblems || []).join('\n'));
    setMappedServicesText((item.mappedServices || []).join('\n'));
    setSolutionsText((item.solutionDescriptions || []).join('\n'));
    setExampleWorkflow(item.exampleWorkflow || '');
    setIndustryModalOpen(true);
  };

  const handleSaveIndustry = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      code: industryCode.trim().toUpperCase() || 'CUSTOM',
      industryName: industryName.trim(),
      businessCategories: categoriesText.split('\n').map(s => s.trim()).filter(Boolean),
      commonProblems: problemsText.split('\n').map(s => s.trim()).filter(Boolean),
      mappedServices: mappedServicesText.split('\n').map(s => s.trim()).filter(Boolean),
      solutionDescriptions: solutionsText.split('\n').map(s => s.trim()).filter(Boolean),
      exampleWorkflow: exampleWorkflow.trim()
    };

    try {
      if (editingIndustry) {
        await api.updateIndustry(editingIndustry.id, payload);
      } else {
        await api.createIndustry(payload);
      }
      setIndustryModalOpen(false);
      loadIndustries();
    } catch (err: any) {
      alert(err?.message || 'Failed to save industry intelligence');
    }
  };

  const handleDeleteIndustry = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the industry "${name}" from the intelligence catalogue?`)) return;
    try {
      await api.deleteIndustry(id);
      loadIndustries();
    } catch (err: any) {
      alert(err?.message || 'Failed to delete industry');
    }
  };

  const filteredIndustries = industries.filter(item => {
    if (!industrySearch) return true;
    const q = industrySearch.toLowerCase();
    const matchName = item.industryName.toLowerCase().includes(q) || item.code.toLowerCase().includes(q);
    const matchCats = (item.businessCategories || []).some(c => c.toLowerCase().includes(q));
    const matchProbs = (item.commonProblems || []).some(p => p.toLowerCase().includes(q));
    const matchServices = (item.mappedServices || []).some(s => s.toLowerCase().includes(q));
    return matchName || matchCats || matchProbs || matchServices;
  });

  const filteredServices = services.filter(s => {
    const matchCat = categoryFilter === 'All' || s.category === categoryFilter;
    const matchSearch = !serviceSearch || s.name.toLowerCase().includes(serviceSearch.toLowerCase()) || s.description.toLowerCase().includes(serviceSearch.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Service Catalog & Industry Intelligence</h2>
          <p className="text-xs text-slate-500">
            Section 7: Searchable knowledge database mapping 14 vertical industries (A to N) to tailored Quenoxa services.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {activeTab === 'industries' ? (
            <button
              onClick={openAddIndustryModal}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Industry Mapping</span>
            </button>
          ) : (
            <button
              onClick={openAddServiceModal}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Service Offering</span>
            </button>
          )}
        </div>
      </div>

      {/* Top Tab Bar */}
      <div className="flex items-center space-x-2 border-b border-slate-200 text-xs font-bold">
        <button
          onClick={() => setActiveTab('industries')}
          className={`flex items-center space-x-2 pb-2.5 px-3 border-b-2 transition-colors ${
            activeTab === 'industries'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Section 7: Industry Intelligence Catalogue ({industries.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('services')}
          className={`flex items-center space-x-2 pb-2.5 px-3 border-b-2 transition-colors ${
            activeTab === 'services'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpenCheck className="w-4 h-4" />
          <span>Quenoxa Service Catalogue ({services.length})</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: INDUSTRY INTELLIGENCE (14 INDUSTRIES A TO N)           */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'industries' && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex-1 relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search industries (e.g. 'gyms', 'cafes', 'retail', 'pos', 'crm', 'attendance')..."
                value={industrySearch}
                onChange={(e) => setIndustrySearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50/50 focus:bg-white"
              />
            </div>
            <div className="text-slate-500 text-xs shrink-0 font-medium">
              Showing {filteredIndustries.length} of {industries.length} Industries
            </div>
          </div>

          {loadingIndustries ? (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
              <div className="w-7 h-7 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-xs text-slate-500">Loading industry catalogue...</p>
            </div>
          ) : filteredIndustries.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-xs">
              No matching industries found for "{industrySearch}".
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredIndustries.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-subtle hover:border-emerald-300 transition-all space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div className="flex items-center space-x-2">
                        <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-extrabold text-xs flex items-center justify-center">
                          {item.code}
                        </span>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 leading-snug">
                            {item.industryName}
                          </h3>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {item.isCustom ? 'Custom Industry' : 'Standard Quenoxa Knowledge Base'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          onClick={() => openEditIndustryModal(item)}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 rounded-md hover:bg-slate-100 transition-colors"
                          title="Edit Industry"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {item.isCustom && (
                          <button
                            onClick={() => handleDeleteIndustry(item.id, item.industryName)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100 transition-colors"
                            title="Delete Custom Industry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Business Categories */}
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                        Specific Business Categories:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {(item.businessCategories || []).map((cat, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-200"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Common Customer Problems */}
                    <div className="p-3 bg-rose-50/40 rounded-lg border border-rose-100 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-rose-800 block">
                        Common Customer Problems:
                      </span>
                      <ul className="list-disc pl-4 text-[11px] text-rose-950 space-y-0.5">
                        {(item.commonProblems || []).slice(0, 3).map((prob, idx) => (
                          <li key={idx}>{prob}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Mapped Services */}
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                        Relevant Quenoxa Services:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {(item.mappedServices || []).map((srv, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-900 border border-emerald-200"
                          >
                            {srv}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Example Sales Workflow */}
                    {item.exampleWorkflow && (
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-700 space-y-0.5">
                        <strong className="text-[10px] font-bold uppercase text-slate-500 block">Example Sales Workflow:</strong>
                        <p className="italic font-medium text-slate-800">{item.exampleWorkflow}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: QUENOXA SERVICE CATALOGUE                              */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'services' && (
        <div className="space-y-4">
          {/* Filter and Search Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search services by keyword, category, or description..."
                value={serviceSearch}
                onChange={(e) => setServiceSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50/50 focus:bg-white"
              />
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <span className="font-semibold text-slate-500">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
              >
                <option value="All">All Categories ({services.length})</option>
                {SERVICE_CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Service Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className={`bg-white rounded-xl border p-5 flex flex-col justify-between transition-all shadow-subtle ${
                  service.isActive ? 'border-slate-200 hover:border-emerald-300' : 'border-slate-200 opacity-60 bg-slate-50/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 truncate">
                      {service.category}
                    </span>
                    <button
                      onClick={() => handleToggleActive(service)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                        service.isActive
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                      title="Toggle active status"
                    >
                      {service.isActive ? 'ACTIVE' : 'DISABLED'}
                    </button>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-snug">{service.name}</h3>
                  <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
                    {service.description}
                  </p>

                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Target Buyer:</span>
                      <span className="font-semibold text-slate-800 truncate max-w-[160px]">{service.targetCustomer}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Pricing Tier:</span>
                      <span className="font-mono font-semibold text-emerald-700">{service.pricingRange || 'Quotation Required'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Complexity:</span>
                      <span className="font-medium text-slate-800">{service.implementationComplexity}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                  <button
                    onClick={() => openEditServiceModal(service)}
                    className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded hover:bg-slate-100 flex items-center space-x-1"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteService(service.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-50"
                    title="Delete service"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ADD / EDIT INDUSTRY (SECTION 7 SPEC)                   */}
      {/* ------------------------------------------------------------- */}
      {industryModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleSaveIndustry}
            className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 text-xs space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">
                {editingIndustry ? `Edit Industry: ${editingIndustry.industryName}` : 'Add Industry to Intelligence Catalogue'}
              </h3>
              <button
                type="button"
                onClick={() => setIndustryModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <label className="font-bold text-slate-700 block mb-1">Index Code (A-Z):</label>
                <input
                  type="text"
                  required
                  maxLength={5}
                  value={industryCode}
                  onChange={(e) => setIndustryCode(e.target.value.toUpperCase())}
                  placeholder="e.g. O"
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-mono font-bold"
                />
              </div>

              <div className="col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Industry Name:</label>
                <input
                  type="text"
                  required
                  value={industryName}
                  onChange={(e) => setIndustryName(e.target.value)}
                  placeholder="e.g. Clean Energy & Solar"
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Specific Business Categories (one per line):
              </label>
              <textarea
                rows={3}
                required
                value={categoriesText}
                onChange={(e) => setCategoriesText(e.target.value)}
                placeholder="Rooftop solar installers&#10;Solar farm operators&#10;Battery storage suppliers"
                className="w-full p-2.5 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Common Customer Problems (one per line):
              </label>
              <textarea
                rows={3}
                required
                value={problemsText}
                onChange={(e) => setProblemsText(e.target.value)}
                placeholder="Untracked site-inspection requests&#10;Manual quotation generation delays"
                className="w-full p-2.5 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Mapped Quenoxa Services (one per line):
              </label>
              <textarea
                rows={3}
                required
                value={mappedServicesText}
                onChange={(e) => setMappedServicesText(e.target.value)}
                placeholder="Site-visit booking system&#10;Quotation workflow automation&#10;Lead CRM"
                className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Example Sales Workflow:
              </label>
              <textarea
                rows={2}
                value={exampleWorkflow}
                onChange={(e) => setExampleWorkflow(e.target.value)}
                placeholder="For solar installers with untracked site-visits, prioritize mobile booking and lead CRM."
                className="w-full p-2.5 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIndustryModalOpen(false)}
                className="px-3.5 py-2 text-slate-600 hover:text-slate-800 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs"
              >
                Save Industry
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ADD / EDIT SERVICE OFFERING                            */}
      {/* ------------------------------------------------------------- */}
      {serviceModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleSaveService}
            className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 text-xs space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">
                {editingService ? 'Edit Service Offering' : 'Add New Service Offering'}
              </h3>
              <button
                type="button"
                onClick={() => setServiceModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Service Offering Name:</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Automated Business Workflows & RPA"
                className="w-full p-2.5 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Category:</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ServiceCategory)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-slate-50"
                >
                  {SERVICE_CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Implementation Complexity:</label>
                <select
                  value={complexity}
                  onChange={(e) => setComplexity(e.target.value as any)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-slate-50"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Enterprise">Enterprise</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Description:</label>
              <textarea
                rows={2}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed explanation of the solution..."
                className="w-full p-2.5 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Customer Profile:</label>
                <input
                  type="text"
                  value={targetCustomer}
                  onChange={(e) => setTargetCustomer(e.target.value)}
                  placeholder="e.g. Gyms, fitness centres, local retail"
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Pricing Range:</label>
                <input
                  type="text"
                  value={pricingRange}
                  onChange={(e) => setPricingRange(e.target.value)}
                  placeholder="e.g. Quotation Required"
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Expected Benefits (one per line):</label>
                <textarea
                  rows={3}
                  value={benefitsText}
                  onChange={(e) => setBenefitsText(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Limitations / Risks (one per line):</label>
                <textarea
                  rows={3}
                  value={limitationsText}
                  onChange={(e) => setLimitationsText(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="activeToggle"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="activeToggle" className="font-semibold text-slate-800 cursor-pointer">
                Active in Catalog (Gemini AI will recommend this service)
              </label>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setServiceModalOpen(false)}
                className="px-3.5 py-2 text-slate-600 hover:text-slate-800 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs"
              >
                Save Service Offering
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
