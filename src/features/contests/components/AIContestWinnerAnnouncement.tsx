/**
 * AI Contest Winner Announcement & Top 3 Podium Component
 * Renders high-impact gold/silver/bronze podium with AI-generated commentary,
 * provider toggle (Groq / OpenRouter), and 1-click certificate issuance.
 */

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Trophy,
  Medal,
  Sparkles,
  Bot,
  RefreshCw,
  Award,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  ExternalLink,
  Zap,
  ShieldCheck,
} from "lucide-react";
import {
  aiContestService,
  AIContestAnnouncementResult,
  WinnerPodiumItem,
} from "@/src/services/ai/aiContestService";
import type { ContestLeaderboardRow } from "../types";

interface AIContestWinnerAnnouncementProps {
  contestTitle: string;
  problemCount: number;
  standings: ContestLeaderboardRow[];
  contestEnded: boolean;
}

export function AIContestWinnerAnnouncement({
  contestTitle,
  problemCount,
  standings,
  contestEnded,
}: AIContestWinnerAnnouncementProps) {
  const [announcement, setAnnouncement] = useState<AIContestAnnouncementResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showHighlights, setShowHighlights] = useState(true);

  const runAnnouncement = async () => {
    setIsGenerating(true);
    try {
      const topParticipants = standings.slice(0, 5).map((row, idx) => ({
        rank: idx + 1,
        displayName: row.displayName || "Contender",
        collegeId: row.collegeId,
        totalScore: row.totalScore || 0,
        penaltyTime: row.penaltyTime || 0,
        solvedCount: row.solvedCount || 0,
      }));

      const res = await aiContestService.generateAnnouncement({
        contestTitle,
        problemCount,
        participants: topParticipants,
      });
      setAnnouncement(res);
    } catch (err) {
      console.error("Failed to generate AI announcement", err);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    runAnnouncement();
  }, [contestTitle, standings.length]);

  if (!announcement) {
    return (
      <div className="rounded-3xl bg-[#0E0B28] border border-[#241D4D] p-6 text-center space-y-3">
        <Sparkles className="w-8 h-8 text-[#F59E0B] animate-spin mx-auto" />
        <p className="text-xs text-[#94A3B8]">AI Tournament Arbiter is synthesizing final podium...</p>
      </div>
    );
  }

  const { podium, headline, summary, highlights, signOff, modelName } = announcement;

  return (
    <div className="rounded-3xl bg-gradient-to-b from-[#130E38] via-[#0E0B28] to-[#08051A] border-2 border-[#7C3AED]/40 p-6 sm:p-8 space-y-8 shadow-2xl shadow-[#7C3AED]/10 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-[#F59E0B]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-[#7C3AED]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#241D4D]/80 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#F59E0B]/20 text-[#FBBF24] border border-[#F59E0B]/40">
              <Bot className="w-3.5 h-3.5" />
              AI Arbiter Official Announcement
            </span>
            <span className="text-[11px] font-mono text-[#94A3B8] hidden sm:inline">
              Powered by {modelName}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC] tracking-tight flex items-center gap-2.5">
            <Trophy className="w-7 h-7 text-[#F59E0B]" />
            <span>{headline}</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#94A3B8] max-w-3xl leading-relaxed">
            {summary}
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
          <button
            onClick={() => runAnnouncement()}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold font-mono bg-[#7C3AED] hover:bg-[#8B5CF6] text-white transition-all shadow-md shadow-[#7C3AED]/25 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin" : ""}`} />
            <span>{isGenerating ? "Analyzing..." : "Regenerate AI Speech"}</span>
          </button>
        </div>
      </div>

      {/* ── Podium Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end pt-2">
        {/* 2nd Place (Silver) */}
        {podium.second && (
          <PodiumCard
            item={podium.second}
            medalColor="silver"
            badge="2nd Place • Runner-Up"
            gradient="from-[#334155]/60 to-[#1e293b]/80"
            border="border-[#94A3B8]/40"
            badgeColor="text-[#E2E8F0] bg-[#475569]/30 border-[#94A3B8]/40"
            trophyIcon={<Medal className="w-6 h-6 text-[#CBD5E1]" />}
            height="min-h-[300px]"
            contestTitle={contestTitle}
          />
        )}

        {/* 1st Place (Gold Champion — Centered & Highlighted) */}
        {podium.first && (
          <PodiumCard
            item={podium.first}
            medalColor="gold"
            badge="🏆 Grand 1st Place Champion"
            gradient="from-[#78350F]/40 via-[#B45309]/20 to-[#15103A]"
            border="border-[#F59E0B] shadow-xl shadow-[#F59E0B]/20"
            badgeColor="text-[#FBBF24] bg-[#F59E0B]/20 border-[#F59E0B]/50 font-extrabold"
            trophyIcon={<Trophy className="w-8 h-8 text-[#FBBF24] animate-bounce" />}
            height="min-h-[340px] md:-translate-y-4"
            isChampion
            contestTitle={contestTitle}
          />
        )}

        {/* 3rd Place (Bronze) */}
        {podium.third && (
          <PodiumCard
            item={podium.third}
            medalColor="bronze"
            badge="3rd Place • Bronze"
            gradient="from-[#451A03]/50 to-[#1e142e]/80"
            border="border-[#D97706]/40"
            badgeColor="text-[#FDBA74] bg-[#7C2D12]/30 border-[#EA580C]/40"
            trophyIcon={<Medal className="w-6 h-6 text-[#FB923C]" />}
            height="min-h-[290px]"
            contestTitle={contestTitle}
          />
        )}
      </div>

      {/* ── Key Tactical Feats & Highlights ── */}
      <div className="rounded-2xl bg-[#08051A]/80 border border-[#241D4D] overflow-hidden">
        <button
          onClick={() => setShowHighlights(!showHighlights)}
          className="w-full flex items-center justify-between p-4 text-xs font-bold text-[#F8FAFC] hover:bg-[#15103A]/50 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#F59E0B]" />
            <span>AI Tournament Insights &amp; Tactical Feats</span>
          </span>
          {showHighlights ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showHighlights && (
          <div className="p-4 pt-0 space-y-2 border-t border-[#241D4D]/50 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
              {highlights.map((hl, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-[#120D2F] border border-[#241D4D] text-[#CBD5E1] flex items-start gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                  <span className="leading-snug">{hl}</span>
                </div>
              ))}
            </div>

            <div className="pt-3 text-[11px] font-mono text-[#94A3B8] flex items-center justify-between">
              <span>{signOff}</span>
              <span className="text-[#34D399] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified by Chapter Arbiter
              </span>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

/* ─────────────────────────────────────────────
   Individual Podium Card (1st / 2nd / 3rd)
───────────────────────────────────────────── */
function PodiumCard({
  item,
  badge,
  gradient,
  border,
  badgeColor,
  trophyIcon,
  height,
  isChampion = false,
  contestTitle,
}: {
  item: WinnerPodiumItem;
  medalColor: "gold" | "silver" | "bronze";
  badge: string;
  gradient: string;
  border: string;
  badgeColor: string;
  trophyIcon: React.ReactNode;
  height: string;
  isChampion?: boolean;
  contestTitle: string;
}) {
  return (
    <div
      className={`rounded-3xl bg-gradient-to-b ${gradient} border-2 ${border} p-6 flex flex-col justify-between space-y-4 ${height} transition-all relative overflow-hidden`}
    >
      {isChampion && (
        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-transparent via-[#F59E0B] to-transparent animate-pulse" />
      )}

      <div className="space-y-3">
        {/* Top badge & Trophy */}
        <div className="flex items-center justify-between">
          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono border ${badgeColor}`}>
            {badge}
          </span>
          {trophyIcon}
        </div>

        {/* Contender Name & College */}
        <div>
          <h3 className={`font-extrabold text-[#F8FAFC] tracking-tight ${isChampion ? "text-xl sm:text-2xl" : "text-lg"}`}>
            {item.displayName}
          </h3>
          <p className="text-xs text-[#94A3B8] font-mono">
            {item.collegeId || "GMRIT Student"} • {item.titleBadge}
          </p>
        </div>

        {/* Score & Penalty Pill */}
        <div className="flex items-center gap-2 pt-1 font-mono text-xs">
          <span className="px-2.5 py-1 rounded-lg bg-[#08051A]/60 border border-[#241D4D] text-[#34D399] font-bold">
            {item.totalScore} Pts
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-[#08051A]/60 border border-[#241D4D] text-[#94A3B8]">
            {item.penaltyTime}m Pen
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-[#08051A]/60 border border-[#241D4D] text-[#FBBF24]">
            {item.solvedCount} Solved
          </span>
        </div>

        {/* AI Citation */}
        <div className="p-3 rounded-2xl bg-[#08051A]/70 border border-[#241D4D] space-y-1">
          <div className="text-[10px] font-mono font-bold text-[#A855F7] flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            AI Citation
          </div>
          <p className="text-[11px] text-[#CBD5E1] italic leading-relaxed">
            &ldquo;{item.aiCitation}&rdquo;
          </p>
        </div>
      </div>

      {/* Direct Action: Issue Official Certificate */}
      <div className="pt-2 border-t border-[#241D4D]/60">
        <Link
          to={`/certificates/manage`}
          className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md ${
            isChampion
              ? "bg-[#F59E0B] hover:bg-[#FBBF24] text-[#08051A] shadow-[#F59E0B]/20"
              : "bg-[#15103A] hover:bg-[#1E174D] text-[#F8FAFC] border border-[#241D4D]"
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Issue {isChampion ? "Winner" : "Merit"} Certificate</span>
        </Link>
      </div>
    </div>
  );
}
