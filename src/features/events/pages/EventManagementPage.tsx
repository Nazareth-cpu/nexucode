/**
 * Event Management Page (Coordinators & Administrators ONLY)
 *
 * Dedicated authorized dashboard for Chapter Coordinators and Platform Administrators
 * to oversee, schedule, manage, and complete technical hackathons, workshops, and meetups.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/src/features/auth';
import { eventService, EventItem } from '../services/eventService';
import { problemService } from '@/src/features/problems';
import type { ProblemRow } from '@/src/types/database';
import {
  Calendar,
  Plus,
  Search,
  Filter,
  Users,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  CalendarCheck,
  Award,
  Edit3,
  Trash2,
  Play,
  Check,
  Lock,
  Sparkles,
  AlertCircle,
  X,
  Code2,
} from 'lucide-react';

export function EventManagementPage() {
  const { session, profile } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published' | 'live' | 'completed'>('all');
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [modalNotice, setModalNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    type: 'hackathon',
    category: 'Hackathon',
    description: '',
    startAt: '',
    endAt: '',
    registrationStart: '',
    registrationEnd: '',
    location: 'Campus Hub & Virtual Arena',
    capacity: 100,
    isTechnical: true,
    certificateEligible: true,
    selectedProblemIds: [] as string[],
  });

  const [availableProblems, setAvailableProblems] = useState<ProblemRow[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const role = profile?.role || 'coordinator';

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const [evts, probsRes] = await Promise.all([
        eventService.getEvents(session?.access_token),
        problemService.getProblems(),
      ]);
      setEvents(evts);
      setAvailableProblems(probsRes.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [session?.access_token]);

  const handleOpenCreateModal = () => {
    setEditingEventId(null);
    setModalNotice(null);
    const now = new Date();
    const start = new Date(now.getTime() + 24 * 3600 * 1000);
    const end = new Date(now.getTime() + 48 * 3600 * 1000);

    setFormData({
      title: '',
      type: 'hackathon',
      category: 'Hackathon',
      description: '',
      startAt: start.toISOString().slice(0, 16),
      endAt: end.toISOString().slice(0, 16),
      registrationStart: now.toISOString().slice(0, 16),
      registrationEnd: start.toISOString().slice(0, 16),
      location: 'Campus Hub & Virtual Arena',
      capacity: 100,
      isTechnical: true,
      certificateEligible: true,
      selectedProblemIds: [],
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (evt: EventItem) => {
    setEditingEventId(evt.id);
    setModalNotice(null);
    setFormData({
      title: evt.title,
      type: evt.type,
      category: evt.category,
      description: evt.description || '',
      startAt: new Date(evt.startAt).toISOString().slice(0, 16),
      endAt: new Date(evt.endAt).toISOString().slice(0, 16),
      registrationStart: new Date(evt.registrationStart).toISOString().slice(0, 16),
      registrationEnd: new Date(evt.registrationEnd).toISOString().slice(0, 16),
      location: evt.location || '',
      capacity: evt.capacity || 100,
      isTechnical: evt.isTechnical,
      certificateEligible: evt.rules?.certificateEligible ?? true,
      selectedProblemIds: (evt.problems || []).map((p) => p.problemId),
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setModalNotice(null);
    setNotice(null);

    try {
      // 1. Validate Title
      if (!formData.title || formData.title.trim().length < 3) {
        setModalNotice({ type: 'error', message: 'Event title must be at least 3 characters long.' });
        setSubmitting(false);
        return;
      }

      // 2. Validate & Parse Dates
      if (!formData.startAt || !formData.endAt) {
        setModalNotice({ type: 'error', message: 'Event start time and end time are required.' });
        setSubmitting(false);
        return;
      }

      const startDate = new Date(formData.startAt);
      const endDate = new Date(formData.endAt);
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        setModalNotice({ type: 'error', message: 'Invalid start or end date format.' });
        setSubmitting(false);
        return;
      }

      if (endDate.getTime() <= startDate.getTime()) {
        setModalNotice({ type: 'error', message: 'Event end time must be after the start time.' });
        setSubmitting(false);
        return;
      }

      const now = new Date();
      const regStartDate = formData.registrationStart && !isNaN(new Date(formData.registrationStart).getTime())
        ? new Date(formData.registrationStart)
        : now;

      const regEndDate = formData.registrationEnd && !isNaN(new Date(formData.registrationEnd).getTime())
        ? new Date(formData.registrationEnd)
        : startDate;

      const problemsPayload = formData.selectedProblemIds.map((probId, idx) => {
        const match = availableProblems.find((p) => p.id === probId);
        return {
          problemId: probId,
          slug: match?.slug || `prob-${idx}`,
          title: match?.title || `Challenge #${idx + 1}`,
          difficulty: match?.difficulty || 'easy',
          points: 100,
          orderIndex: idx + 1,
        };
      });

      const payload = {
        title: formData.title.trim(),
        type: formData.type as any,
        category: formData.category?.trim() || 'Hackathon',
        description: formData.description?.trim() || '',
        startAt: startDate.toISOString(),
        endAt: endDate.toISOString(),
        registrationStart: regStartDate.toISOString(),
        registrationEnd: regEndDate.toISOString(),
        location: formData.location?.trim() || 'Nexus Arena',
        capacity: Math.max(1, Number(formData.capacity) || 100),
        isTechnical: formData.isTechnical,
        rules: {
          maxWarnings: 3,
          enableProctoring: formData.isTechnical,
          requireFullscreen: formData.isTechnical,
          certificateEligible: formData.certificateEligible,
        },
        problems: problemsPayload,
      };

      if (editingEventId) {
        const res = await eventService.updateEvent(editingEventId, payload, session?.access_token);
        if (res.event) {
          setNotice({ type: 'success', message: 'Event successfully updated!' });
          setIsModalOpen(false);
          await fetchEvents();
        } else {
          setNotice({ type: 'error', message: res.error || 'Failed to update event.' });
        }
      } else {
        const res = await eventService.createEvent(payload, session?.access_token);
        if (res.event) {
          setNotice({ type: 'success', message: 'New event successfully created in Draft state!' });
          setIsModalOpen(false);
          await fetchEvents();
        } else {
          setNotice({ type: 'error', message: res.error || 'Failed to create event.' });
        }
      }
    } catch (err: unknown) {
      setNotice({ type: 'error', message: (err as Error).message || 'An unexpected error occurred during submission.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (eventId: string, newStatus: any) => {
    try {
      const res = await eventService.updateEvent(eventId, { status: newStatus }, session?.access_token);
      if (res.event) {
        setNotice({ type: 'success', message: `Event lifecycle updated to ${newStatus.toUpperCase()}` });
        await fetchEvents();
      } else {
        setNotice({ type: 'error', message: res.error || 'Failed to update status.' });
      }
    } catch (err: unknown) {
      setNotice({ type: 'error', message: (err as Error).message });
    }
  };

  const handleCompleteEvent = async (eventId: string) => {
    if (!window.confirm('Are you sure you want to finalize this event and issue certificates to eligible participants?')) {
      return;
    }
    try {
      const res = await eventService.completeEvent(eventId, session?.access_token);
      if (res.success) {
        setNotice({
          type: 'success',
          message: `Event completed! Issued ${res.certificatesCount || 0} verified certificates.`,
        });
        await fetchEvents();
      } else {
        setNotice({ type: 'error', message: res.error || 'Failed to complete event.' });
      }
    } catch (err: unknown) {
      setNotice({ type: 'error', message: (err as Error).message });
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this event? This action cannot be undone.')) {
      return;
    }
    try {
      const res = await eventService.deleteEvent(eventId, session?.access_token);
      if (res.success) {
        setNotice({ type: 'success', message: 'Event successfully deleted.' });
        await fetchEvents();
      } else {
        setNotice({ type: 'error', message: res.error || 'Failed to delete event.' });
      }
    } catch (err: unknown) {
      setNotice({ type: 'error', message: (err as Error).message });
    }
  };

  const filteredEvents = events.filter((evt) => {
    const matchesSearch =
      evt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evt.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || evt.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Notice Banner */}
      {notice && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between transition-all ${
            notice.type === 'success'
              ? 'bg-[#10B981]/15 text-[#34D399] border border-[#10B981]/30'
              : 'bg-[#EF4444]/15 text-[#F87171] border border-[#EF4444]/30'
          }`}
        >
          <div className="flex items-center gap-2">
            {notice.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{notice.message}</span>
          </div>
          <button type="button" onClick={() => setNotice(null)} className="hover:opacity-75">
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#241D4D] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#A855F7] font-semibold bg-[#7C3AED]/15 px-2 py-0.5 rounded border border-[#7C3AED]/30">
              Authorized Staff Portal
            </span>
            <span className="text-xs text-[#94A3B8]">•</span>
            <span className="text-xs text-[#F59E0B] font-mono capitalize">{role} Access</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F8FAFC] mt-1 flex items-center gap-2.5">
            <Calendar className="w-7 h-7 text-[#F59E0B]" />
            <span>Event Management</span>
          </h1>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#F59E0B] hover:bg-[#FBBF24] text-[#08051A] font-extrabold text-xs transition-all shadow-md shadow-[#F59E0B]/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Event</span>
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search managed events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#0E0B28] border border-[#241D4D] text-[#F8FAFC] placeholder-[#64748B] text-xs focus:outline-none focus:border-[#F59E0B]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {[
            { id: 'all', label: 'All Events' },
            { id: 'draft', label: 'Drafts' },
            { id: 'published', label: 'Published' },
            { id: 'live', label: 'Live' },
            { id: 'completed', label: 'Completed' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === tab.id
                  ? 'bg-[#7C3AED]/20 text-[#C084FC] border border-[#7C3AED]/40'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#0E0B28]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Events Table / List */}
      <div className="rounded-3xl bg-[#0E0B28] border border-[#241D4D] overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#94A3B8] animate-pulse">Loading managed events...</div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-12 text-center text-[#94A3B8] space-y-2">
            <Calendar className="w-8 h-8 text-[#64748B] mx-auto" />
            <p className="text-sm font-bold text-[#F8FAFC]">No events found</p>
            <p className="text-xs">Create your first technical event or adjust the filter.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#241D4D]">
            {filteredEvents.map((evt) => {
              const isLive = evt.status === 'live';
              const isDraft = evt.status === 'draft';
              const isCompleted = evt.status === 'completed';

              return (
                <div
                  key={evt.id}
                  className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-[#130F35]/50 transition-colors"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                          isLive
                            ? 'bg-[#EF4444]/20 text-[#F87171] animate-pulse border border-[#EF4444]/30'
                            : isDraft
                            ? 'bg-[#64748B]/20 text-[#CBD5E1] border border-[#64748B]/30'
                            : isCompleted
                            ? 'bg-[#10B981]/20 text-[#34D399] border border-[#10B981]/30'
                            : 'bg-[#F59E0B]/20 text-[#FBBF24] border border-[#F59E0B]/30'
                        }`}
                      >
                        {evt.status}
                      </span>
                      <span className="text-[10px] font-mono text-[#A855F7] bg-[#7C3AED]/15 px-2 py-0.5 rounded">
                        {evt.category}
                      </span>
                      {evt.isTechnical && (
                        <span className="text-[10px] font-mono text-[#10B981] bg-[#10B981]/15 px-2 py-0.5 rounded flex items-center gap-1">
                          <Code2 className="w-3 h-3" />
                          <span>Monaco Workspace</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-extrabold text-[#F8FAFC]">{evt.title}</h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-[#94A3B8] font-mono">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#F59E0B]" />
                        <span>{new Date(evt.startAt).toLocaleString()}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-[#7C3AED]" />
                        <span>
                          {evt.registeredCount} / {evt.capacity || '∞'} Registered
                        </span>
                      </span>
                      {evt.problems && (
                        <span>{evt.problems.length} Challenges Attached</span>
                      )}
                    </div>
                  </div>

                  {/* Lifecycle & Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    {isDraft && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(evt.id, 'published')}
                        className="px-3 py-1.5 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-xs transition-all"
                      >
                        Publish Event
                      </button>
                    )}

                    {evt.status === 'published' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(evt.id, 'registration_open')}
                        className="px-3 py-1.5 rounded-lg bg-[#F59E0B] hover:bg-[#FBBF24] text-[#08051A] font-bold text-xs transition-all"
                      >
                        Open Registration
                      </button>
                    )}

                    {evt.status === 'registration_open' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(evt.id, 'live')}
                        className="px-3 py-1.5 rounded-lg bg-[#EF4444] hover:bg-[#DC2626] text-white font-bold text-xs transition-all flex items-center gap-1"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        Set Live
                      </button>
                    )}

                    {isLive && (
                      <button
                        type="button"
                        onClick={() => handleCompleteEvent(evt.id)}
                        className="px-3 py-1.5 rounded-lg bg-[#10B981] hover:bg-[#059669] text-[#08051A] font-bold text-xs transition-all flex items-center gap-1"
                      >
                        <Award className="w-3 h-3" />
                        Finalize &amp; Issue Certs
                      </button>
                    )}

                    {evt.isTechnical && (
                      <Link
                        to={`/events/${evt.id}/workspace`}
                        className="px-3 py-1.5 rounded-lg bg-[#181342] hover:bg-[#201A54] text-[#CBD5E1] border border-[#2D245E] font-bold text-xs transition-all"
                      >
                        Preview Workspace
                      </Link>
                    )}

                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(evt)}
                      className="p-2 rounded-lg bg-[#110D30] hover:bg-[#181342] text-[#94A3B8] hover:text-[#F8FAFC] border border-[#241D4D] transition-all"
                      title="Edit Event"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {role === 'admin' && (
                      <button
                        type="button"
                        onClick={() => handleDeleteEvent(evt.id)}
                        className="p-2 rounded-lg bg-[#EF4444]/15 hover:bg-[#EF4444]/30 text-[#F87171] border border-[#EF4444]/30 transition-all"
                        title="Delete Event (Admin Only)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-2xl rounded-3xl bg-[#0E0B28] border border-[#241D4D] p-6 sm:p-8 shadow-2xl space-y-5 text-[#F8FAFC] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#241D4D] pb-3">
              <h3 className="text-lg font-bold text-[#F8FAFC] flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#F59E0B]" />
                <span>{editingEventId ? 'Edit Event' : 'Create New Technical Event'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-[#94A3B8] hover:text-[#F8FAFC]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalNotice && (
              <div
                className={`p-3.5 rounded-2xl text-xs font-bold flex items-center justify-between transition-all ${
                  modalNotice.type === 'success'
                    ? 'bg-[#10B981]/15 text-[#34D399] border border-[#10B981]/30'
                    : 'bg-[#EF4444]/15 text-[#F87171] border border-[#EF4444]/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  {modalNotice.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  <span>{modalNotice.message}</span>
                </div>
                <button type="button" onClick={() => setModalNotice(null)} className="hover:opacity-75">
                  ✕
                </button>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-[#94A3B8] mb-1">EVENT TITLE</label>
                <input
                  type="text"
                  required
                  minLength={3}
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({ ...formData, title: e.target.value });
                    if (modalNotice) setModalNotice(null);
                  }}
                  placeholder="e.g. CodeStorm Hackathon 2026"
                  className="w-full px-3 py-2 rounded-xl bg-[#08051A] border border-[#241D4D] text-[#F8FAFC] focus:outline-none focus:border-[#F59E0B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#94A3B8] mb-1">EVENT TYPE</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-[#08051A] border border-[#241D4D] text-[#F8FAFC] focus:outline-none focus:border-[#F59E0B]"
                  >
                    <option value="hackathon">Hackathon</option>
                    <option value="workshop">Technical Workshop</option>
                    <option value="contest">Coding Contest</option>
                    <option value="webinar">Webinar</option>
                    <option value="meetup">Meetup</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#94A3B8] mb-1">CATEGORY BADGE</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g. Annual Hackathon"
                    className="w-full px-3 py-2 rounded-xl bg-[#08051A] border border-[#241D4D] text-[#F8FAFC] focus:outline-none focus:border-[#F59E0B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#94A3B8] mb-1">DESCRIPTION</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Explain event rules, scope, and objectives..."
                  className="w-full px-3 py-2 rounded-xl bg-[#08051A] border border-[#241D4D] text-[#F8FAFC] focus:outline-none focus:border-[#F59E0B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#94A3B8] mb-1">START DATE &amp; TIME</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.startAt}
                    onChange={(e) => setFormData({ ...formData, startAt: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#08051A] border border-[#241D4D] text-[#F8FAFC] focus:outline-none focus:border-[#F59E0B]"
                  />
                </div>
                <div>
                  <label className="block text-[#94A3B8] mb-1">END DATE &amp; TIME</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.endAt}
                    onChange={(e) => setFormData({ ...formData, endAt: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#08051A] border border-[#241D4D] text-[#F8FAFC] focus:outline-none focus:border-[#F59E0B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#94A3B8] mb-1">LOCATION / PLATFORM</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#08051A] border border-[#241D4D] text-[#F8FAFC] focus:outline-none focus:border-[#F59E0B]"
                  />
                </div>
                <div>
                  <label className="block text-[#94A3B8] mb-1">CAPACITY LIMIT</label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-[#08051A] border border-[#241D4D] text-[#F8FAFC] focus:outline-none focus:border-[#F59E0B]"
                  />
                </div>
              </div>

              {/* Technical Flags */}
              <div className="p-3 rounded-xl bg-[#08051A] border border-[#241D4D] space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isTechnical}
                    onChange={(e) => setFormData({ ...formData, isTechnical: e.target.checked })}
                    className="rounded border-[#241D4D] text-[#F59E0B] focus:ring-0"
                  />
                  <span className="text-[#F8FAFC] font-bold">
                    Enable Monaco Coding Workspace &amp; 3-Strike Integrity Proctoring
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.certificateEligible}
                    onChange={(e) => setFormData({ ...formData, certificateEligible: e.target.checked })}
                    className="rounded border-[#241D4D] text-[#F59E0B] focus:ring-0"
                  />
                  <span className="text-[#CBD5E1]">
                    Issue Verified Chapter Certificates upon Completion
                  </span>
                </label>
              </div>

              {/* Challenge Problems Attachment */}
              {formData.isTechnical && (
                <div className="space-y-1.5">
                  <label className="block text-[#94A3B8]">ATTACH CHALLENGE PROBLEMS ({formData.selectedProblemIds.length} selected)</label>
                  <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 rounded-xl bg-[#08051A] border border-[#241D4D]">
                    {availableProblems.map((prob) => {
                      const isSelected = formData.selectedProblemIds.includes(prob.id);
                      return (
                        <button
                          key={prob.id}
                          type="button"
                          onClick={() => {
                            const next = isSelected
                              ? formData.selectedProblemIds.filter((id) => id !== prob.id)
                              : [...formData.selectedProblemIds, prob.id];
                            setFormData({ ...formData, selectedProblemIds: next });
                          }}
                          className={`p-2 rounded-lg text-left text-[11px] border transition-all flex items-center justify-between ${
                            isSelected
                              ? 'bg-[#7C3AED]/20 border-[#7C3AED] text-white'
                              : 'bg-[#110D30] border-[#241D4D] text-[#94A3B8] hover:text-[#F8FAFC]'
                          }`}
                        >
                          <span className="truncate">{prob.title}</span>
                          <span className="text-[9px] uppercase font-bold text-[#F59E0B]">{prob.difficulty}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#241D4D]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#110D30] hover:bg-[#181342] text-[#CBD5E1] text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 rounded-xl bg-[#F59E0B] hover:bg-[#FBBF24] text-[#08051A] font-extrabold text-xs transition-all shadow-md shadow-[#F59E0B]/20"
                >
                  {submitting ? 'Saving...' : editingEventId ? 'Update Event' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
