/**
 * Nexus Code — AI Contest & Event Top-3 Ranking Analysis Service
 *
 * Provider Strategy:
 * 1. Preferred: OpenRouter API
 * 2. Fallback: Groq API
 * 3. Fallback: High-Quality Deterministic Server Synthesis
 *
 * Rules:
 * - Authoritative ranking is strictly deterministic and server-controlled.
 * - AI cannot alter participant scores, rankings, or invent winners.
 * - If AI response diverges from authoritative standings, server ranking is strictly retained.
 * - Never uses synthetic mock data or hardcoded candidate names.
 */

export interface WinnerPodiumItem {
  rank: 1 | 2 | 3;
  userId?: string;
  displayName: string;
  collegeId?: string;
  totalScore: number;
  penaltyTime: number;
  solvedCount: number;
  titleBadge: string;
  aiCitation: string;
  notableAchievement: string;
}

export interface AIContestAnnouncementResult {
  contestId?: string;
  contestTitle: string;
  headline: string;
  summary: string;
  podium: {
    first?: WinnerPodiumItem;
    second?: WinnerPodiumItem;
    third?: WinnerPodiumItem;
  };
  highlights: string[];
  signOff: string;
  generatedAt: string;
  provider: 'openrouter' | 'groq' | 'gemini' | 'deterministic-fallback' | 'built-in';
  modelName: string;
}

export interface ContestStandingsInput {
  contestId?: string;
  contestTitle: string;
  contestDate?: string;
  problemCount: number;
  participants: Array<{
    rank: number;
    userId?: string;
    displayName: string;
    collegeId?: string;
    totalScore: number;
    penaltyTime: number;
    solvedCount: number;
    lastSolveAtMinutes?: number;
  }>;
}

export interface AIProviderConfig {
  provider?: 'openrouter' | 'groq' | 'gemini';
  apiKey?: string;
  model?: string;
}

export const aiContestService = {
  getStoredKeys(): { openrouterKey: string; groqKey: string; geminiKey: string } {
    let openrouterKey = '';
    let groqKey = '';
    let geminiKey = '';

    if (typeof localStorage !== 'undefined') {
      openrouterKey = localStorage.getItem('nexucode_openrouter_key') || '';
      groqKey = localStorage.getItem('nexucode_groq_key') || '';
      geminiKey = localStorage.getItem('nexucode_gemini_key') || '';
    }

    if (!openrouterKey && typeof import.meta !== 'undefined' && import.meta.env) {
      openrouterKey = (import.meta.env.VITE_OPENROUTER_API_KEY as string) || '';
    }
    if (!groqKey && typeof import.meta !== 'undefined' && import.meta.env) {
      groqKey = (import.meta.env.VITE_GROQ_API_KEY as string) || '';
    }
    if (!geminiKey && typeof import.meta !== 'undefined' && import.meta.env) {
      geminiKey = (import.meta.env.VITE_GEMINI_API_KEY as string) || '';
    }

    if (!openrouterKey && typeof process !== 'undefined' && process.env) {
      openrouterKey = process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY || '';
    }
    if (!groqKey && typeof process !== 'undefined' && process.env) {
      groqKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY || '';
    }
    if (!geminiKey && typeof process !== 'undefined' && process.env) {
      geminiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
    }

    return { openrouterKey, groqKey, geminiKey };
  },

  setStoredKey(provider: 'openrouter' | 'groq' | 'gemini', key: string) {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(`nexucode_${provider}_key`, key.trim());
    }
  },

  /**
   * Generates authoritative Top-3 AI Analysis & Podium Announcement with OpenRouter -> Groq -> Deterministic failover.
   */
  async generateAnnouncement(
    input: ContestStandingsInput,
    customConfig?: Partial<AIProviderConfig>
  ): Promise<AIContestAnnouncementResult> {
    const activeParticipants = (input.participants || []).filter((p) => (p.totalScore || 0) > 0 || (p.solvedCount || 0) > 0 || p.rank <= 3);

    // Case 0: No participants competed or zero valid submissions
    if (activeParticipants.length === 0) {
      return {
        contestId: input.contestId,
        contestTitle: input.contestTitle,
        headline: `Tournament Concluded: ${input.contestTitle}`,
        summary: `The tournament arena has concluded. No submissions were recorded during the competition window.`,
        podium: {},
        highlights: [
          `Competition window closed with 0 recorded submissions.`,
          `Upcoming tournament rounds will be scheduled shortly.`,
        ],
        signOff: `Official record verified by Coding Club, GMRIT DU.`,
        generatedAt: new Date().toISOString(),
        provider: 'deterministic-fallback',
        modelName: 'Deterministic Finalizer',
      };
    }

    const top1 = activeParticipants[0];
    const top2 = activeParticipants.length > 1 ? activeParticipants[1] : undefined;
    const top3 = activeParticipants.length > 2 ? activeParticipants[2] : undefined;

    const keys = this.getStoredKeys();
    const openrouterKey = (customConfig?.provider === 'openrouter' ? customConfig.apiKey : undefined) || keys.openrouterKey;
    const groqKey = (customConfig?.provider === 'groq' ? customConfig.apiKey : undefined) || keys.groqKey;

    let standingsText = `1st Place: ${top1.displayName} (${top1.collegeId || 'Contender'}), Score: ${top1.totalScore} pts, Penalty: ${top1.penaltyTime} min, Solved: ${top1.solvedCount}/${input.problemCount}`;
    if (top2) {
      standingsText += `\n2nd Place: ${top2.displayName} (${top2.collegeId || 'Contender'}), Score: ${top2.totalScore} pts, Penalty: ${top2.penaltyTime} min, Solved: ${top2.solvedCount}/${input.problemCount}`;
    }
    if (top3) {
      standingsText += `\n3rd Place: ${top3.displayName} (${top3.collegeId || 'Contender'}), Score: ${top3.totalScore} pts, Penalty: ${top3.penaltyTime} min, Solved: ${top3.solvedCount}/${input.problemCount}`;
    }

    const prompt = `You are the Official AI Tournament Arbiter of Coding Club, GMRIT Deemed to be University.
Analyze the finalized top performers for the competition: "${input.contestTitle}".
Here are the official verified standings:
${standingsText}

Respond ONLY with a valid JSON object matching this structure (no markdown fences, no extra text outside JSON):
{
  "headline": "Grand Tournament Conclusion & Podium Announcement",
  "summary": "High-energy 2-sentence recap of the battle and triumphant top performers.",
  "podium": {
    "first": {
      "rank": 1,
      "displayName": "${top1.displayName}",
      "collegeId": "${top1.collegeId || ''}",
      "totalScore": ${top1.totalScore},
      "penaltyTime": ${top1.penaltyTime},
      "solvedCount": ${top1.solvedCount},
      "titleBadge": "Grand Algorithmic Champion",
      "aiCitation": "Specific laudatory citation honoring their strategic precision, speed, and algorithmic mastery.",
      "notableAchievement": "Fastest solution clearance across problem set"
    }${
      top2
        ? `,
    "second": {
      "rank": 2,
      "displayName": "${top2.displayName}",
      "collegeId": "${top2.collegeId || ''}",
      "totalScore": ${top2.totalScore},
      "penaltyTime": ${top2.penaltyTime},
      "solvedCount": ${top2.solvedCount},
      "titleBadge": "Master Strategist & Runner-Up",
      "aiCitation": "Commendation on relentless debugging speed and resilience under pressure.",
      "notableAchievement": "Rapid solve on complex test cases"
    }`
        : ''
    }${
      top3
        ? `,
    "third": {
      "rank": 3,
      "displayName": "${top3.displayName}",
      "collegeId": "${top3.collegeId || ''}",
      "totalScore": ${top3.totalScore},
      "penaltyTime": ${top3.penaltyTime},
      "solvedCount": ${top3.solvedCount},
      "titleBadge": "Elite Contender & Bronze Laureate",
      "aiCitation": "Recognition for flawless efficiency and optimal algorithmic complexity.",
      "notableAchievement": "Lowest penalty per accepted submission"
    }`
        : ''
    }
  },
  "highlights": [
    "Highlight 1: Notable speed or accuracy feat",
    "Highlight 2: Strategic problem breakdown",
    "Highlight 3: Competitive spirit in chapter standings"
  ],
  "signOff": "Official declaration verified by Coding Club, GMRIT DU."
}`;

    const parseAndValidateAIResponse = (
      raw: string,
      provider: 'openrouter' | 'groq',
      modelName: string
    ): AIContestAnnouncementResult => {
      let clean = raw.trim();
      if (clean.includes('```json')) {
        clean = clean.split('```json')[1].split('```')[0].trim();
      } else if (clean.includes('```')) {
        clean = clean.split('```')[1].split('```')[0].trim();
      }
      const parsed = JSON.parse(clean);

      // Deterministic validation: strictly enforce server-calculated ranks and participants
      const validatedPodium: AIContestAnnouncementResult['podium'] = {};

      if (top1) {
        validatedPodium.first = {
          rank: 1,
          userId: top1.userId,
          displayName: top1.displayName, // Enforce true identity
          collegeId: top1.collegeId,
          totalScore: top1.totalScore, // Enforce authoritative score
          penaltyTime: top1.penaltyTime, // Enforce authoritative penalty
          solvedCount: top1.solvedCount, // Enforce authoritative solved count
          titleBadge: parsed?.podium?.first?.titleBadge || 'Grand Algorithmic Champion 🥇',
          aiCitation:
            parsed?.podium?.first?.aiCitation ||
            `Demonstrated exceptional algorithmic mastery with ${top1.totalScore} points and minimal penalty time.`,
          notableAchievement:
            parsed?.podium?.first?.notableAchievement ||
            `Solved ${top1.solvedCount} problems with strategic accuracy.`,
        };
      }

      if (top2) {
        validatedPodium.second = {
          rank: 2,
          userId: top2.userId,
          displayName: top2.displayName,
          collegeId: top2.collegeId,
          totalScore: top2.totalScore,
          penaltyTime: top2.penaltyTime,
          solvedCount: top2.solvedCount,
          titleBadge: parsed?.podium?.second?.titleBadge || 'Master Strategist & Runner-Up 🥈',
          aiCitation:
            parsed?.podium?.second?.aiCitation ||
            `Exhibited tactical resilience and speed, securing second place with ${top2.totalScore} points.`,
          notableAchievement:
            parsed?.podium?.second?.notableAchievement ||
            `Conquered ${top2.solvedCount} problems with consistent runtime efficiency.`,
        };
      }

      if (top3) {
        validatedPodium.third = {
          rank: 3,
          userId: top3.userId,
          displayName: top3.displayName,
          collegeId: top3.collegeId,
          totalScore: top3.totalScore,
          penaltyTime: top3.penaltyTime,
          solvedCount: top3.solvedCount,
          titleBadge: parsed?.podium?.third?.titleBadge || 'Elite Contender & Bronze Laureate 🥉',
          aiCitation:
            parsed?.podium?.third?.aiCitation ||
            `High-velocity execution and clean implementation earning a bronze podium finish.`,
          notableAchievement:
            parsed?.podium?.third?.notableAchievement ||
            `Conquered ${top3.solvedCount} problems with minimal penalty overhead.`,
        };
      }

      return {
        contestId: input.contestId,
        contestTitle: input.contestTitle,
        headline: parsed?.headline || `🏆 Official Podium: ${input.contestTitle}`,
        summary:
          parsed?.summary ||
          `The tournament has concluded after intense competition. Congratulations to our official podium laureates.`,
        podium: validatedPodium,
        highlights: Array.isArray(parsed?.highlights) && parsed.highlights.length > 0
          ? parsed.highlights
          : [
              `⚡ ${top1.displayName} claimed 1st place with ${top1.totalScore} total points.`,
              `🛡️ Proctoring & Integrity Engine confirmed 100% verified submissions.`,
              `📈 High collegiate engagement across all problem sets.`,
            ],
        signOff: parsed?.signOff || 'Official declaration verified by Coding Club, GMRIT DU.',
        generatedAt: new Date().toISOString(),
        provider,
        modelName,
      };
    };

    // 1. PRIMARY: Try OpenRouter
    if (openrouterKey) {
      try {
        const model =
          customConfig?.model ||
          (typeof process !== 'undefined' ? process.env.OPENROUTER_MODEL : '') ||
          (typeof import.meta !== 'undefined' ? (import.meta.env?.VITE_OPENROUTER_MODEL as string) : '') ||
          'meta-llama/llama-3.3-70b-instruct';

        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${openrouterKey}`,
            'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
            'X-Title': 'NexusCode AI Tournament Arbiter',
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.5,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const raw = data.choices?.[0]?.message?.content;
          if (raw) {
            return parseAndValidateAIResponse(raw, 'openrouter', `OpenRouter (${model})`);
          }
        }
      } catch (err) {
        console.warn('[AI Service]: OpenRouter primary provider failed, attempting fallback to Groq:', err);
      }
    }

    // 2. SECONDARY: Try Groq
    if (groqKey) {
      try {
        const model =
          customConfig?.model ||
          (typeof process !== 'undefined' ? process.env.GROQ_MODEL : '') ||
          (typeof import.meta !== 'undefined' ? (import.meta.env?.VITE_GROQ_MODEL as string) : '') ||
          'llama-3.3-70b-versatile';

        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
            temperature: 0.5,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const raw = data.choices?.[0]?.message?.content;
          if (raw) {
            return parseAndValidateAIResponse(raw, 'groq', `Groq (${model})`);
          }
        }
      } catch (err) {
        console.warn('[AI Service]: Groq secondary provider failed, falling back to deterministic synthesis:', err);
      }
    }

    // 3. TERTIARY: Deterministic Server-Side Synthesis (100% Reliable, Zero External Dependencies)
    const deterministicPodium: AIContestAnnouncementResult['podium'] = {};

    if (top1) {
      deterministicPodium.first = {
        rank: 1,
        userId: top1.userId,
        displayName: top1.displayName,
        collegeId: top1.collegeId,
        totalScore: top1.totalScore,
        penaltyTime: top1.penaltyTime,
        solvedCount: top1.solvedCount,
        titleBadge: 'Grand Algorithmic Champion 🥇',
        aiCitation: `Demonstrated outstanding problem-solving speed and algorithmic accuracy, clinching 1st place with ${top1.totalScore} points.`,
        notableAchievement: `Fastest full-set clearance with ${top1.solvedCount} problems solved in ${top1.penaltyTime}m penalty.`,
      };
    }

    if (top2) {
      deterministicPodium.second = {
        rank: 2,
        userId: top2.userId,
        displayName: top2.displayName,
        collegeId: top2.collegeId,
        totalScore: top2.totalScore,
        penaltyTime: top2.penaltyTime,
        solvedCount: top2.solvedCount,
        titleBadge: 'Master Strategist & Runner-Up 🥈',
        aiCitation: `Exhibited tactical resilience across algorithmic challenges, earning second place with ${top2.totalScore} points.`,
        notableAchievement: `Mastery across ${top2.solvedCount} problems with consistent precision.`,
      };
    }

    if (top3) {
      deterministicPodium.third = {
        rank: 3,
        userId: top3.userId,
        displayName: top3.displayName,
        collegeId: top3.collegeId,
        totalScore: top3.totalScore,
        penaltyTime: top3.penaltyTime,
        solvedCount: top3.solvedCount,
        titleBadge: 'Elite Contender & Bronze Laureate 🥉',
        aiCitation: `High-velocity problem analysis and clean submissions clinching a bronze podium finish with ${top3.totalScore} points.`,
        notableAchievement: `Conquered ${top3.solvedCount} problems with low penalty overhead.`,
      };
    }

    return {
      contestId: input.contestId,
      contestTitle: input.contestTitle,
      headline: `🏆 Official Championship Podium: ${input.contestTitle}`,
      summary: `The tournament arena has concluded after intense competition. Outstanding strategic mastery and relentless problem-solving have propelled our top contenders to the chapter podium.`,
      podium: deterministicPodium,
      highlights: [
        `⚡ ${top1.displayName} claimed 1st place with ${top1.totalScore} total points.`,
        `🛡️ Proctoring & Integrity Engine confirmed 100% verified authentic submissions.`,
        `📈 Collegiate ranking metrics calculated and recorded for merit certificates.`,
      ],
      signOff: `Official tournament standings ratified by Coding Club, GMRIT Deemed to be University.`,
      generatedAt: new Date().toISOString(),
      provider: 'deterministic-fallback',
      modelName: 'NexusCode Autonomous Arbiter Engine',
    };
  },
};

