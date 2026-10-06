/**
 * Events View (Protected: /events) — Purple & Amber Edition
 *
 * Full-featured student-facing technical events portal:
 * - Live, Upcoming, and Completed Hackathons & Workshops
 * - Real-time registration and capacity tracking
 * - Direct access to proctored technical coding workspaces
 * - Dedicated My Earned Certifications viewer with verification tokens
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/src/features/auth';
import { eventService, EventItem, EventCertificate } from './services/eventService';
import {
  Calendar,
  Users,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Terminal,
  Maximize2,
  Sparkles,
  Award,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  Download,
  ExternalLink,
  Lock,
  Flame,
} from 'lucide-react';

export function EventsView() {
  const { session, profile } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [certificates, setCertificates] = useState<EventCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'events' | 'certificates'>('events');
  const [statusFilter, setStatusFilter] = useState<'all' | 'live' | 'upcoming' | 'completed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [registeringId, setRegisteringId] = useState<string | null>(null);
  const [activeCertModal, setActiveCertModal] = useState<EventCertificate | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchEventsData = async () => {
    setLoading(true);
    try {
      const [evts, certs] = await Promise.all([
        eventService.getEvents(session?.access_token),
        session?.access_token ? eventService.getUserCertificates(session.access_token) : Promise.resolve([]),
      ]);
      setEvents(evts);
      setCertificates(certs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventsData();
  }, [session?.access_token]);

  const handleRegister = async (eventId: string) => {
    if (!session?.access_token) return;
    setRegisteringId(eventId);
    setNotice(null);
    try {
      const res = await eventService.registerForEvent(eventId, session.access_token);
      if (res.success) {
        setNotice({ type: 'success', message: 'Successfully registered for event!' });
        await fetchEventsData();
      } else {
        setNotice({ type: 'error', message: res.error || 'Failed to register for event.' });
      }
    } finally {
      setRegisteringId(null);
    }
  };

  const filteredEvents = events.filter((evt) => {
    const matchesSearch =
      evt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (evt.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      evt.category.toLowerCase().includes(searchTerm.toLowerCase());

    if (statusFilter === 'live') return matchesSearch && evt.status === 'live';
    if (statusFilter === 'upcoming')
      return matchesSearch && (evt.status === 'published' || evt.status === 'registration_open');
    if (statusFilter === 'completed') return matchesSearch && (evt.status === 'ended' || evt.status === 'completed');
    return matchesSearch;
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
            {notice.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            <span>{notice.message}</span>
          </div>
          <button type="button" onClick={() => setNotice(null)} className="hover:opacity-75">
            ✕
          </button>
        </div>
      )}

      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#241D4D] pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F8FAFC] flex items-center gap-2.5">
            <Calendar className="w-7 h-7 text-[#F59E0B]" />
            <span>Technical Events &amp; Hackathons</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
            Chapter hackathons, algorithmic workshops, and proctored technical sprints.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Switcher Tabs */}
          <div className="flex items-center gap-2 bg-[#0E0B28] p-1 rounded-2xl border border-[#241D4D]">
            <button
              type="button"
              onClick={() => setActiveTab('events')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'events'
                  ? 'bg-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/25'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#15103A]'
              }`}
            >
              Events ({events.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('certificates')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'certificates'
                  ? 'bg-[#F59E0B] text-[#08051A] shadow-md shadow-[#F59E0B]/25'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#15103A]'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>My Certifications ({certificates.length})</span>
            </button>
          </div>

          {(profile?.role === 'coordinator' || profile?.role === 'admin') && (
            <Link
              to="/events/manage"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] text-[#08051A] font-extrabold text-xs shadow-lg shadow-[#F59E0B]/20 hover:scale-[1.02] transition-transform"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Manage Events</span>
            </Link>
          )}
        </div>
      </div>

      {activeTab === 'events' ? (
        <>
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Search */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search events, workshops..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#0E0B28] border border-[#241D4D] text-[#F8FAFC] placeholder-[#64748B] text-xs focus:outline-none focus:border-[#7C3AED] transition-colors"
              />
            </div>

            {/* Status Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {[
                { id: 'all', label: 'All' },
                { id: 'upcoming', label: 'Upcoming' },
                { id: 'live', label: 'Live' },
                { id: 'completed', label: 'Past' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id as any)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    statusFilter === tab.id
                      ? 'bg-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/20 font-extrabold'
                      : 'bg-[#0E0B28] text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#15103A] border border-[#241D4D]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Events Grid */}
          {loading ? (
            <div className="p-16 text-center text-xs text-[#94A3B8] font-mono animate-pulse">
              Loading technical events...
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="rounded-3xl bg-[#0E0B28] border border-[#241D4D] p-12 text-center text-[#94A3B8] space-y-2">
              <Calendar className="w-8 h-8 text-[#64748B] mx-auto" />
              <p className="text-sm font-bold text-[#F8FAFC]">No events match your criteria</p>
              <p className="text-xs">Check back later or adjust your search filter.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEvents.map((evt, idx) => {
                const isLive = evt.status === 'live';
                const isRegOpen = evt.status === 'registration_open';
                const isCompleted = evt.status === 'ended' || evt.status === 'completed';

                return (
                  <div
                    key={evt.id}
                    className="rounded-3xl bg-[#0E0B28] border border-[#241D4D] hover:border-[#7C3AED]/60 p-6 sm:p-7 shadow-xl text-[#F8FAFC] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 transition-all duration-200 group relative overflow-hidden"
                  >
                    {/* Subtle ambient card glow */}
                    <div className="absolute right-0 top-0 w-72 h-72 bg-[#7C3AED]/10 blur-3xl pointer-events-none" />

                    {/* Left & Middle Content */}
                    <div className="space-y-3.5 flex-1 z-10">
                      {/* Top Badges */}
                      <div className="flex items-center gap-2.5 flex-wrap">
                        {isLive ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-extrabold px-3 py-1 rounded-full bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40">
                            <span className="w-2 h-2 rounded-full bg-[#EF4444] animate-ping" />
                            LIVE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-extrabold px-3 py-1 rounded-full bg-[#7C3AED]/20 text-[#C084FC] border border-[#7C3AED]/40">
                            <span className="w-2 h-2 rounded-full bg-[#A855F7]" />
                            UPCOMING
                          </span>
                        )}

                        <span className="text-[11px] font-mono font-bold text-[#A855F7] bg-[#181242] border border-[#2A205E] px-2.5 py-0.5 rounded-lg">
                          {evt.category || 'Hackathon'}
                        </span>

                        {evt.isTechnical && (
                          <span className="text-[11px] font-mono font-bold text-[#F59E0B] bg-[#F59E0B]/15 border border-[#F59E0B]/30 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Proctored Arena</span>
                          </span>
                        )}
                      </div>

                      {/* Title & Description */}
                      <div>
                        <h2 className="text-xl sm:text-2xl font-extrabold text-[#F8FAFC] group-hover:text-[#FBBF24] transition-colors">
                          {evt.title}
                        </h2>
                        <p className="text-xs sm:text-sm text-[#94A3B8] mt-1 leading-relaxed max-w-2xl">
                          {evt.description ||
                            'Build production-ready open source projects across AI, Web3, and Systems programming.'}
                        </p>
                      </div>

                      {/* Metadata Row */}
                      <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#94A3B8]">
                        <div className="flex items-center gap-1.5 text-[#C4B5FD]">
                          <Calendar className="w-3.5 h-3.5 text-[#A855F7]" />
                          <span>
                            {new Date(evt.startAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-[#64748B]" />
                          <span>{evt.registeredCount || 0} Registered</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#64748B]" />
                          <span>{evt.location || 'Virtual Arena'}</span>
                        </div>
                        <div className="text-[#FBBF24] font-bold">
                          • {evt.type === 'hackathon' ? 'Individual/Team' : 'Individual'}
                        </div>
                      </div>
                    </div>

                    {/* Right 3D Visual Art & Action Buttons (Panel 03) */}
                    <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between w-full lg:w-auto gap-4 z-10 shrink-0 border-t lg:border-t-0 border-[#241D4D] pt-4 lg:pt-0">
                      {/* 3D Isometric Art Icon Area */}
                      <div className="hidden sm:flex w-24 h-20 items-center justify-center">
                        {idx % 3 === 0 ? (
                          /* Isometric Glowing Cubes Art */
                          <svg viewBox="0 0 100 80" fill="none" className="w-full h-full drop-shadow-[0_0_12px_rgba(168,85,247,0.4)]">
                            <polygon points="50,10 80,25 50,40 20,25" fill="#C084FC" opacity="0.9" />
                            <polygon points="20,25 50,40 50,70 20,55" fill="#7C3AED" />
                            <polygon points="80,25 50,40 50,70 80,55" fill="#581C87" />
                            <polygon points="70,30 95,42 70,55 45,42" fill="#FBBF24" opacity="0.8" />
                            <polygon points="45,42 70,55 70,78 45,65" fill="#D97706" />
                            <polygon points="95,42 70,55 70,78 95,65" fill="#92400E" />
                          </svg>
                        ) : idx % 3 === 1 ? (
                          /* Glowing Graph Nodes Art */
                          <svg viewBox="0 0 100 80" fill="none" className="w-full h-full drop-shadow-[0_0_12px_rgba(245,158,11,0.4)]">
                            <line x1="30" y1="40" x2="60" y2="20" stroke="#A855F7" strokeWidth="2" />
                            <line x1="60" y1="20" x2="80" y2="50" stroke="#F59E0B" strokeWidth="2" />
                            <line x1="30" y1="40" x2="50" y2="65" stroke="#F59E0B" strokeWidth="2" />
                            <line x1="50" y1="65" x2="80" y2="50" stroke="#A855F7" strokeWidth="2" />
                            <circle cx="30" cy="40" r="7" fill="#A855F7" />
                            <circle cx="60" cy="20" r="9" fill="#FBBF24" />
                            <circle cx="80" cy="50" r="7" fill="#C084FC" />
                            <circle cx="50" cy="65" r="8" fill="#F59E0B" />
                          </svg>
                        ) : (
                          /* Golden Trophy Art */
                          <svg viewBox="0 0 100 80" fill="none" className="w-full h-full drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]">
                            <path d="M35 20 H65 V45 C65 53 58 60 50 60 C42 60 35 53 35 45 Z" fill="#FBBF24" />
                            <path d="M25 25 C25 35 35 38 35 38" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
                            <path d="M75 25 C75 35 65 38 65 38" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
                            <rect x="44" y="60" width="12" height="10" fill="#D97706" />
                            <rect x="36" y="70" width="28" height="6" rx="2" fill="#B45309" />
                          </svg>
                        )}
                      </div>

                      {/* Action Button Set */}
                      <div className="flex items-center gap-2.5 w-full sm:w-auto">
                        {isLive ? (
                          <Link
                            to={`/events/${evt.id}/workspace`}
                            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#F59E0B] hover:bg-[#FBBF24] text-[#08051A] font-extrabold text-xs transition-all shadow-md shadow-[#F59E0B]/20 active:scale-95 whitespace-nowrap"
                          >
                            <span>Enter Event</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        ) : evt.isRegistered ? (
                          <div className="px-4 py-2.5 rounded-xl bg-[#10B981]/20 text-[#34D399] font-extrabold text-xs border border-[#10B981]/40 flex items-center gap-1.5 whitespace-nowrap">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Registered</span>
                          </div>
                        ) : isRegOpen ? (
                          <button
                            type="button"
                            onClick={() => handleRegister(evt.id)}
                            disabled={registeringId === evt.id}
                            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-extrabold text-xs transition-all shadow-md shadow-[#7C3AED]/25 active:scale-95 whitespace-nowrap disabled:opacity-50"
                          >
                            <span>{registeringId === evt.id ? 'Registering...' : 'Register'}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        ) : isCompleted ? (
                          <div className="px-4 py-2.5 rounded-xl bg-[#15103A] text-[#94A3B8] font-bold text-xs border border-[#241D4D] whitespace-nowrap">
                            Event Concluded
                          </div>
                        ) : (
                          <div className="px-4 py-2.5 rounded-xl bg-[#15103A] text-[#94A3B8] font-bold text-xs border border-[#241D4D] whitespace-nowrap">
                            Opening Soon
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* My Certifications Tab */
        <div className="space-y-6">
          {certificates.length === 0 ? (
            <div className="rounded-3xl bg-[#0E0B28] border border-[#241D4D] p-12 text-center text-[#94A3B8] space-y-3">
              <Award className="w-10 h-10 text-[#F59E0B] mx-auto" />
              <h3 className="text-base font-bold text-[#F8FAFC]">No Certifications Earned Yet</h3>
              <p className="text-xs max-w-md mx-auto">
                Participate and complete eligible technical hackathons and workshops to earn verified chapter certificates.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {certificates.map((cert) => (
                <div
                  key={cert.id}
                  className="rounded-3xl bg-[#0E0B28] border border-[#241D4D] hover:border-[#F59E0B]/50 p-6 space-y-4 shadow-xl text-[#F8FAFC] flex flex-col justify-between transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/20 text-[#FBBF24] flex items-center justify-center">
                        <Award className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-mono text-[#10B981] font-bold bg-[#10B981]/15 px-2.5 py-1 rounded-full border border-[#10B981]/30">
                        VERIFIED
                      </span>
                    </div>

                    <div>
                      <h4 className="text-base font-extrabold text-[#F8FAFC]">{cert.eventTitle}</h4>
                      <p className="text-xs text-[#94A3B8] mt-1">Certificate of Completion &amp; Achievement</p>
                    </div>

                    <div className="p-3 rounded-xl bg-[#08051A] border border-[#241D4D] text-[11px] font-mono space-y-1 text-[#CBD5E1]">
                      <div>
                        <span className="text-[#64748B]">Cert No:</span> {cert.certificateNumber}
                      </div>
                      <div>
                        <span className="text-[#64748B]">Issued:</span>{' '}
                        {new Date(cert.issuedAt).toLocaleDateString()}
                      </div>
                      {cert.rank && (
                        <div>
                          <span className="text-[#F59E0B]">Rank:</span> #{cert.rank} ({cert.score} pts)
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveCertModal(cert)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-extrabold text-xs transition-all shadow-md shadow-[#7C3AED]/20 active:scale-95"
                  >
                    <span>View Verified Certificate</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Verified Certificate Modal */}
      {activeCertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-2xl rounded-3xl bg-[#0E0B28] border-2 border-[#F59E0B] p-6 sm:p-10 shadow-2xl space-y-6 text-center text-[#F8FAFC]">
            {/* Top Close */}
            <button
              type="button"
              onClick={() => setActiveCertModal(null)}
              className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#F8FAFC] text-sm p-2"
            >
              ✕
            </button>

            {/* Certificate Header */}
            <div className="space-y-2">
              <div className="w-16 h-16 rounded-full bg-[#F59E0B]/20 text-[#F59E0B] mx-auto flex items-center justify-center border-2 border-[#F59E0B]/40">
                <Award className="w-8 h-8" />
              </div>
              <h2 className="text-xs font-mono font-bold tracking-widest text-[#F59E0B] uppercase">
                Nexus Code Chapter Certificate
              </h2>
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F8FAFC]">
                Certificate of Achievement
              </h3>
            </div>

            {/* Recipient */}
            <div className="py-2 border-y border-[#241D4D] space-y-1">
              <p className="text-xs text-[#94A3B8]">This is proudly presented to</p>
              <p className="text-xl sm:text-2xl font-extrabold text-[#FBBF24]">
                {activeCertModal.userDisplayName}
              </p>
              <p className="text-xs text-[#CBD5E1] pt-1">
                for outstanding completion and performance in{' '}
                <strong className="text-white">{activeCertModal.eventTitle}</strong>.
              </p>
            </div>

            {/* Metadata Footer */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-left text-[10px] font-mono text-[#94A3B8] bg-[#08051A] p-4 rounded-xl border border-[#241D4D]">
              <div>
                <span className="block text-[#64748B]">CERTIFICATE ID</span>
                <span className="font-bold text-[#CBD5E1]">{activeCertModal.certificateNumber}</span>
              </div>
              <div>
                <span className="block text-[#64748B]">ISSUED DATE</span>
                <span className="font-bold text-[#CBD5E1]">
                  {new Date(activeCertModal.issuedAt).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="block text-[#64748B]">VERIFICATION</span>
                <span className="font-bold text-[#10B981]">Cryptographically Signed</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#F59E0B] hover:bg-[#FBBF24] text-[#08051A] font-extrabold text-xs transition-all shadow-lg shadow-[#F59E0B]/25 active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Print / Save PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
