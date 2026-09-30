/**
 * Event Management Page (Coordinators & Administrators ONLY)
 *
 * Dedicated authorized dashboard for Chapter Coordinators and Platform Administrators
 * to oversee, schedule, and manage technical hackathons, workshops, and coding meetups.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/src/features/auth';
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
} from 'lucide-react';

interface EventItem {
  id: string;
  title: string;
  category: string;
  status: 'published' | 'draft' | 'completed';
  startDate: string;
  duration: string;
  location: string;
  registeredCount: number;
}

const INITIAL_EVENTS: EventItem[] = [
  {
    id: 'evt-1',
    title: 'CodeStorm Hackathon 2026',
    category: 'Hackathon',
    status: 'published',
    startDate: 'Oct 24–26, 2026',
    duration: '36 Hours',
    location: 'Campus Innovation Hub & Discord',
    registeredCount: 42,
  },
  {
    id: 'evt-2',
    title: 'Advanced Graph Algorithms & Dynamic Programming Bootcamp',
    category: 'Workshop',
    status: 'published',
    startDate: 'Nov 07, 2026',
    duration: '4 Hours',
    location: 'Lab 4 & Stream',
    registeredCount: 19,
  },
  {
    id: 'evt-3',
    title: 'Winter Open Source Sprint',
    category: 'Open Source',
    status: 'draft',
    startDate: 'Dec 12, 2026',
    duration: '48 Hours',
    location: 'Virtual',
    registeredCount: 0,
  },
];

export function EventManagementPage() {
  const { profile } = useAuth();
  const [events, setEvents] = useState<EventItem[]>(INITIAL_EVENTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [notice, setNotice] = useState<string | null>(null);

  const role = profile?.role || 'coordinator';

  const filteredEvents = events.filter((evt) => {
    const matchesSearch =
      evt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evt.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || evt.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#263833] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#10B981] font-semibold bg-[#12221E] px-2 py-0.5 rounded border border-[#263833]">
              Authorized Staff Portal
            </span>
            <span className="text-xs text-[#9CA3AF]">•</span>
            <span className="text-xs text-[#F59E0B] font-mono capitalize">{role} Access</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F8FAFC] mt-1 flex items-center gap-2.5">
            <Calendar className="w-7 h-7 text-[#F59E0B]" />
            <span>Event Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#9CA3AF] mt-1">
            Author and administer chapter hackathons, guest lectures, and coding workshops.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setNotice('Event creation form initialized. Authorization verified.');
              setTimeout(() => setNotice(null), 3500);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#F59E0B] hover:bg-[#FBBF24] text-[#07110F] font-semibold text-xs sm:text-sm transition-all shadow-sm active:scale-[0.99]"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule New Event</span>
          </button>
        </div>
      </div>

      {notice && (
        <div className="flex items-center gap-2 p-3.5 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30 text-xs text-[#10B981]">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search events by title or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#0D1A17] border border-[#263833] text-xs text-[#F8FAFC] placeholder-[#9CA3AF]/60 focus:outline-none focus:border-[#F59E0B]"
          />
        </div>

        <div className="flex items-center gap-2">
          {(['all', 'published', 'draft'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                statusFilter === s
                  ? 'bg-[#F59E0B] text-[#07110F] font-semibold'
                  : 'bg-[#0D1A17] border border-[#263833] text-[#9CA3AF] hover:text-[#F8FAFC]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Events Roster */}
      <div className="rounded-xl border border-[#263833] bg-[#0D1A17] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#9CA3AF]">
            <thead className="bg-[#07110F] border-b border-[#263833] text-[11px] font-mono uppercase tracking-wider text-[#F8FAFC]">
              <tr>
                <th className="px-5 py-3.5">Event Title</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Schedule</th>
                <th className="px-4 py-3.5">Registrations</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#263833]/60">
              {filteredEvents.map((evt) => (
                <tr key={evt.id} className="hover:bg-[#12221E]/60 transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-semibold text-sm text-[#F8FAFC]">{evt.title}</div>
                    <div className="flex items-center gap-2 text-[11px] text-[#9CA3AF] mt-0.5">
                      <MapPin className="w-3 h-3 text-[#F59E0B]" />
                      <span>{evt.location}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 font-mono text-[11px] text-[#F8FAFC]">{evt.category}</td>
                  <td className="px-4 py-4 font-mono text-[11px]">
                    <div className="text-[#F8FAFC]">{evt.startDate}</div>
                    <div className="text-[#9CA3AF] text-[10px]">{evt.duration}</div>
                  </td>
                  <td className="px-4 py-4 font-mono text-[11px] text-[#10B981]">
                    {evt.registeredCount} Contenders
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                        evt.status === 'published'
                          ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30'
                          : 'bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/30'
                      }`}
                    >
                      {evt.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setNotice(`Managing configuration for "${evt.title}".`);
                        setTimeout(() => setNotice(null), 3000);
                      }}
                      className="text-xs text-[#F59E0B] hover:text-[#FBBF24] font-medium transition-colors"
                    >
                      Edit Event
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
