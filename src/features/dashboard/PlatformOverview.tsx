/**
 * Platform Overview — Pre-Authentication Product Experience
 * 
 * High-fidelity implementation matching the approved Nexus Code design:
 * - Deep dark purple canvas (#08051A)
 * - Amber (#F59E0B / #FBBF24) primary accent
 * - Purple (#7C3AED / #A855F7) secondary brand accents
 * - Plus Jakarta Sans typography
 * - Interactive Typewriter Effect
 * - 3D Coding Environment Mockups with Luminous Edge Sweep
 * - Auto-cycling Multi-Language Monaco Preview (C, C++, Java, Python 3, JavaScript)
 * - Animated Sequential Test Case Evaluation
 * - Staggered Contest Workflow & Feature Cards
 */

import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/src/features/auth';
import { NexusCodeLogo } from '@/src/components/common/NexusCodeLogo';
import {
  LogIn,
  UserPlus,
  ArrowRight,
  Play,
  CheckCircle2,
  Trophy,
  Code2,
  Layers,
  BarChart3,
  FileText,
  UserCheck,
  Sparkles,
  ChevronRight,
  Terminal,
  Cpu,
  ShieldCheck,
  Zap,
  Globe,
  Github,
  Linkedin,
  Youtube,
  MessageSquare,
  Users,
  Send,
  Flag,
  Check,
  XCircle,
  Clock,
  Laptop,
} from 'lucide-react';

const TYPEWRITER_MESSAGES = [
  'Build your skills. Compete with peers.',
  'Solve challenging algorithmic problems.',
  'Level up your technical confidence.',
  'Climb the chapter leaderboards.',
];

// Multi-language code showcase definitions
interface CodeLine {
  num: number;
  tokens: Array<{ text: string; color?: string }>;
  isHighlighted?: boolean;
}

interface LanguageSpec {
  id: string;
  name: string;
  short: string;
  file: string;
  lines: CodeLine[];
}

const SUPPORTED_LANGUAGES: LanguageSpec[] = [
  {
    id: 'c',
    name: 'C (C17)',
    short: 'C',
    file: 'solution.c',
    lines: [
      { num: 1, tokens: [{ text: '// Two Sum in C (C17 standard)', color: 'text-[#64748B]' }] },
      {
        num: 2,
        tokens: [
          { text: 'int*', color: 'text-[#60A5FA]' },
          { text: ' twoSum(' },
          { text: 'int*', color: 'text-[#60A5FA]' },
          { text: ' nums, ' },
          { text: 'int', color: 'text-[#60A5FA]' },
          { text: ' numsSize, ' },
          { text: 'int', color: 'text-[#60A5FA]' },
          { text: ' target, ' },
          { text: 'int*', color: 'text-[#60A5FA]' },
          { text: ' returnSize) {' },
        ],
      },
      { num: 3, tokens: [{ text: '    *returnSize = ' }, { text: '2', color: 'text-[#F59E0B]' }, { text: ';' }] },
      {
        num: 4,
        tokens: [
          { text: '    int*', color: 'text-[#60A5FA]' },
          { text: ' result = (' },
          { text: 'int*', color: 'text-[#60A5FA]' },
          { text: ')malloc(' },
          { text: '2', color: 'text-[#F59E0B]' },
          { text: ' * sizeof(' },
          { text: 'int', color: 'text-[#60A5FA]' },
          { text: '));' },
        ],
        isHighlighted: true,
      },
      { num: 5, tokens: [{ text: '    // Fast hash table index lookup' , color: 'text-[#64748B]' }] },
      { num: 6, tokens: [{ text: '    return', color: 'text-[#C084FC]' }, { text: ' result;' }] },
      { num: 7, tokens: [{ text: '}' }] },
    ],
  },
  {
    id: 'cpp',
    name: 'C++ 20',
    short: 'C++',
    file: 'solution.cpp',
    lines: [
      { num: 1, tokens: [{ text: '#include <unordered_map>', color: 'text-[#64748B]' }] },
      { num: 2, tokens: [{ text: 'class ', color: 'text-[#C084FC]' }, { text: 'Solution ', color: 'text-[#FBBF24]' }, { text: '{' }] },
      { num: 3, tokens: [{ text: 'public:', color: 'text-[#C084FC]' }] },
      {
        num: 4,
        tokens: [
          { text: '    vector<int> ', color: 'text-[#60A5FA]' },
          { text: 'twoSum(vector<int>& ' },
          { text: 'nums', color: 'text-[#E2E8F0]' },
          { text: ', int ' },
          { text: 'target', color: 'text-[#E2E8F0]' },
          { text: ') {' },
        ],
      },
      { num: 5, tokens: [{ text: '        unordered_map<int, int> seen;' }] },
      { num: 6, tokens: [{ text: '        for (int i = 0; i < nums.size(); ++i) {' }] },
      {
        num: 7,
        tokens: [
          { text: '            if (seen.count(target - nums[i]))' },
        ],
      },
      {
        num: 8,
        tokens: [
          { text: '                return', color: 'text-[#C084FC]' },
          { text: ' {seen[target - nums[i]], i};', color: 'text-[#34D399]' },
        ],
        isHighlighted: true,
      },
      { num: 9, tokens: [{ text: '            seen[nums[i]] = i;' }] },
      { num: 10, tokens: [{ text: '        }' }] },
      { num: 11, tokens: [{ text: '        return', color: 'text-[#C084FC]' }, { text: ' {};' }] },
      { num: 12, tokens: [{ text: '    }' }] },
      { num: 13, tokens: [{ text: '};' }] },
    ],
  },
  {
    id: 'java',
    name: 'Java 17',
    short: 'Java',
    file: 'Solution.java',
    lines: [
      { num: 1, tokens: [{ text: 'class ', color: 'text-[#C084FC]' }, { text: 'Solution ', color: 'text-[#FBBF24]' }, { text: '{' }] },
      {
        num: 2,
        tokens: [
          { text: '    public int[] ', color: 'text-[#C084FC]' },
          { text: 'twoSum(int[] ' },
          { text: 'nums', color: 'text-[#E2E8F0]' },
          { text: ', int ' },
          { text: 'target', color: 'text-[#E2E8F0]' },
          { text: ') {' },
        ],
      },
      { num: 3, tokens: [{ text: '        Map<Integer, Integer> map = new HashMap<>();' }] },
      { num: 4, tokens: [{ text: '        for (int i = 0; i < nums.length; i++) {' }] },
      { num: 5, tokens: [{ text: '            int complement = target - nums[i];' }] },
      {
        num: 6,
        tokens: [
          { text: '            if (map.containsKey(complement))', color: 'text-[#CBD5E1]' },
        ],
      },
      {
        num: 7,
        tokens: [
          { text: '                return', color: 'text-[#C084FC]' },
          { text: ' new int[] { map.get(complement), i };', color: 'text-[#34D399]' },
        ],
        isHighlighted: true,
      },
      { num: 8, tokens: [{ text: '            map.put(nums[i], i);' }] },
      { num: 9, tokens: [{ text: '        }' }] },
      { num: 10, tokens: [{ text: '        return', color: 'text-[#C084FC]' }, { text: ' new int[0];' }] },
      { num: 11, tokens: [{ text: '    }' }] },
      { num: 12, tokens: [{ text: '}' }] },
    ],
  },
  {
    id: 'python',
    name: 'Python 3',
    short: 'Python',
    file: 'solution.py',
    lines: [
      { num: 1, tokens: [{ text: '# Write your solution', color: 'text-[#64748B]' }] },
      { num: 2, tokens: [{ text: 'class ', color: 'text-[#C084FC]' }, { text: 'Solution', color: 'text-[#FBBF24]' }, { text: ':' }] },
      {
        num: 3,
        tokens: [
          { text: '    def ', color: 'text-[#C084FC]' },
          { text: 'twoSum', color: 'text-[#60A5FA]' },
          { text: '(self, nums: List[int], target: int) -> List[int]:' },
        ],
      },
      { num: 4, tokens: [{ text: '        seen = {}' }] },
      { num: 5, tokens: [{ text: '        for i, num in enumerate(nums):' }] },
      { num: 6, tokens: [{ text: '            if target - num in seen:' }] },
      {
        num: 7,
        tokens: [
          { text: '                return', color: 'text-[#C084FC]' },
          { text: ' [seen[target - num], i]', color: 'text-[#34D399]' },
        ],
        isHighlighted: true,
      },
      { num: 8, tokens: [{ text: '            seen[num] = i' }] },
      { num: 9, tokens: [{ text: '        return', color: 'text-[#C084FC]' }, { text: ' []' }] },
    ],
  },
  {
    id: 'javascript',
    name: 'JavaScript',
    short: 'JS',
    file: 'solution.js',
    lines: [
      { num: 1, tokens: [{ text: '/** @param {number[]} nums, {number} target */', color: 'text-[#64748B]' }] },
      {
        num: 2,
        tokens: [
          { text: 'const ', color: 'text-[#C084FC]' },
          { text: 'twoSum ', color: 'text-[#60A5FA]' },
          { text: '= (nums, target) => {' },
        ],
      },
      { num: 3, tokens: [{ text: '    const map = new Map();' }] },
      { num: 4, tokens: [{ text: '    for (let i = 0; i < nums.length; i++) {' }] },
      { num: 5, tokens: [{ text: '        const diff = target - nums[i];' }] },
      {
        num: 6,
        tokens: [
          { text: '        if (map.has(diff)) ', color: 'text-[#CBD5E1]' },
          { text: 'return', color: 'text-[#C084FC]' },
          { text: ' [map.get(diff), i];', color: 'text-[#34D399]' },
        ],
        isHighlighted: true,
      },
      { num: 7, tokens: [{ text: '        map.set(nums[i], i);' }] },
      { num: 8, tokens: [{ text: '    }' }] },
      { num: 9, tokens: [{ text: '    return', color: 'text-[#C084FC]' }, { text: ' [];' }] },
      { num: 10, tokens: [{ text: '};' }] },
    ],
  },
];

interface TestCaseSpec {
  id: string;
  name: string;
  input: string;
  status: 'Accepted' | 'Wrong Answer';
  runtime: string;
}

const DEMO_TEST_CASES: TestCaseSpec[] = [
  { id: 'case-1', name: 'Case 1', input: 'nums = [2,7,11,15], target = 9', status: 'Accepted', runtime: '0 ms' },
  { id: 'case-2', name: 'Case 2', input: 'nums = [3,2,4], target = 6', status: 'Wrong Answer', runtime: '-' },
  { id: 'case-3', name: 'Case 3', input: 'nums = [3,3], target = 6', status: 'Accepted', runtime: '2 ms' },
];

export function PlatformOverview() {
  const { isLoading, isAuthenticated, user, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Typewriter effect state
  const [textIndex, setTextIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Multi-language showcase state
  const [selectedLangIndex, setSelectedLangIndex] = useState(3); // Default Python 3
  const [isAutoLangPaused, setIsAutoLangPaused] = useState(false);
  const [langTransitionEffect, setLangTransitionEffect] = useState(false);

  // Test cases sequential active cycle
  const [activeTestCaseIndex, setActiveTestCaseIndex] = useState(0);
  const [testCyclePaused, setTestCyclePaused] = useState(false);

  // Simulated button execution feedback
  const [executionState, setExecutionState] = useState<'idle' | 'running' | 'done'>('idle');

  // Handle scroll for sticky navbar blur & backdrop
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Typewriter logic
  useEffect(() => {
    const targetText = TYPEWRITER_MESSAGES[textIndex];

    const timer = setTimeout(() => {
      if (!isDeleting) {
        setCurrentText(targetText.substring(0, currentText.length + 1));
        if (currentText === targetText) {
          setTimeout(() => setIsDeleting(true), 2400);
        }
      } else {
        setCurrentText(targetText.substring(0, currentText.length - 1));
        if (currentText === '') {
          setIsDeleting(false);
          setTextIndex((prev) => (prev + 1) % TYPEWRITER_MESSAGES.length);
        }
      }
    }, isDeleting ? 35 : 75);

    return () => clearTimeout(timer);
  }, [currentText, isDeleting, textIndex]);

  // Language auto-cycle timer (every 4 seconds if not paused)
  useEffect(() => {
    if (isAutoLangPaused) return;

    const interval = setInterval(() => {
      setLangTransitionEffect(true);
      setTimeout(() => {
        setSelectedLangIndex((prev) => (prev + 1) % SUPPORTED_LANGUAGES.length);
        setLangTransitionEffect(false);
      }, 200);
    }, 4200);

    return () => clearInterval(interval);
  }, [isAutoLangPaused]);

  // Test-case sequential highlight cycle timer (every 2.6 seconds if not paused)
  useEffect(() => {
    if (testCyclePaused) return;

    const interval = setInterval(() => {
      setActiveTestCaseIndex((prev) => (prev + 1) % DEMO_TEST_CASES.length);
    }, 2600);

    return () => clearInterval(interval);
  }, [testCyclePaused]);

  const handleManualLangChange = (index: number) => {
    setIsAutoLangPaused(true);
    setLangTransitionEffect(true);
    setTimeout(() => {
      setSelectedLangIndex(index);
      setLangTransitionEffect(false);
    }, 150);

    // Resume auto-cycle after 10 seconds of inactivity
    setTimeout(() => setIsAutoLangPaused(false), 10000);
  };

  const handleSimulateRun = (mode: 'run' | 'submit') => {
    setExecutionState('running');
    setTimeout(() => {
      setExecutionState('done');
      setTimeout(() => setExecutionState('idle'), 3000);
    }, 700);
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
    } finally {
      setIsSigningOut(false);
    }
  };

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const currentLanguage = SUPPORTED_LANGUAGES[selectedLangIndex];

  return (
    <div className="min-h-screen bg-[#08051A] text-[#F8FAFC] flex flex-col font-sans selection:bg-[#F59E0B] selection:text-[#08051A] overflow-x-hidden relative">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] bg-[#7C3AED]/12 rounded-full blur-[140px]" />
        <div className="absolute top-[40%] right-[-5%] w-[500px] h-[500px] bg-[#F59E0B]/8 rounded-full blur-[160px]" />
        <div className="absolute bottom-[10%] left-[10%] w-[700px] h-[700px] bg-[#4C1D95]/15 rounded-full blur-[180px]" />
      </div>

      {/* ========================================================================= */}
      {/* 1. PUBLIC NAVBAR */}
      {/* ========================================================================= */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[#08051A]/85 backdrop-blur-xl border-b border-[#241D4D]/70 shadow-lg shadow-[#08051A]/60 py-3'
            : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 focus:outline-none group">
            <NexusCodeLogo variant="full" size="md" />
          </Link>

          {/* Center Links */}
          <nav className="hidden md:flex items-center gap-8" aria-label="Main Navigation">
            {[
              { label: 'How It Works', href: '#how-it-works' },
              { label: 'Features', href: '#features' },
              { label: 'Contests', href: '#contests' },
              { label: 'Why Us', href: '#why-us' },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={(e) => scrollToSection(e, item.href.slice(1))}
                className="text-xs font-semibold text-[#94A3B8] hover:text-[#F59E0B] transition-colors tracking-wide"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Right Auth Buttons */}
          <div className="flex items-center gap-3">
            {isLoading ? (
              <span className="text-xs text-[#94A3B8] animate-pulse">Checking session...</span>
            ) : isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F59E0B] hover:bg-[#FBBF24] text-[#08051A] font-bold text-xs transition-all shadow-md shadow-[#F59E0B]/20 hover:-translate-y-0.5 active:translate-y-0"
                >
                  Go to Dashboard
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#15103A] border border-transparent hover:border-[#241D4D] transition-all"
                >
                  {isSigningOut ? 'Signing out...' : 'Sign Out'}
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-[#F8FAFC] hover:text-[#F59E0B] bg-[#110D30]/80 hover:bg-[#181342] border border-[#241D4D] hover:border-[#F59E0B]/40 transition-all hover:-translate-y-0.5"
                >
                  <LogIn className="w-3.5 h-3.5 text-[#A855F7]" />
                  Login
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F59E0B] hover:bg-[#FBBF24] text-[#08051A] font-extrabold text-xs transition-all shadow-lg shadow-[#F59E0B]/25 hover:-translate-y-0.5 active:scale-95"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 z-10 pt-28 pb-20 space-y-28 sm:space-y-36">
        {/* ========================================================================= */}
        {/* 2. HERO SECTION */}
        {/* ========================================================================= */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Content */}
            <div className="lg:col-span-6 space-y-6">
              {/* Eyebrow Pill */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#7C3AED]/15 border border-[#7C3AED]/40 text-[#FBBF24] text-[11px] font-bold tracking-wider uppercase shadow-inner">
                <Sparkles className="w-3.5 h-3.5 text-[#F59E0B] animate-pulse" />
                <span>Chapter-Owned Competitive Coding Platform</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#F8FAFC] leading-[1.1]">
                Code. Compete.{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F59E0B] to-[#FBBF24]">
                  Improve.
                </span>
              </h1>

              {/* Typewriter Subtitle */}
              <div className="h-8 flex items-center">
                <p className="text-lg sm:text-xl font-medium text-[#CBD5E1]">
                  {currentText}
                  <span className="inline-block w-0.5 h-5 ml-1 bg-[#F59E0B] animate-pulse align-middle" />
                </p>
              </div>

              {/* Description */}
              <p className="text-sm sm:text-base text-[#94A3B8] leading-relaxed max-w-xl">
                Nexus Code is a competitive coding platform for students, featuring
                chapter-based contests, an interactive coding environment, automated evaluation,
                and real-time leaderboards.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#F59E0B] hover:bg-[#FBBF24] text-[#08051A] font-extrabold text-sm transition-all shadow-xl shadow-[#F59E0B]/25 hover:-translate-y-0.5 active:scale-95 group"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>

                <a
                  href="#how-it-works"
                  onClick={(e) => scrollToSection(e, 'how-it-works')}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#130F35]/90 hover:bg-[#1A1448] text-[#F8FAFC] hover:text-[#F59E0B] font-bold text-sm border border-[#241D4D] hover:border-[#7C3AED]/60 transition-all hover:-translate-y-0.5"
                >
                  <Play className="w-3.5 h-3.5 fill-current text-[#F59E0B]" />
                  Explore How It Works
                </a>
              </div>

              {/* Metrics / Social Proof Badges */}
              <div className="grid grid-cols-3 gap-3 pt-6 max-w-lg">
                <div className="p-3 rounded-xl bg-[#110D30]/70 border border-[#241D4D]/80 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-[#A855F7] mb-1">
                    <Users className="w-4 h-4" />
                    <span className="text-base font-extrabold text-[#F8FAFC]">500+</span>
                  </div>
                  <p className="text-[11px] text-[#94A3B8] font-medium leading-tight">
                    Student Developers
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#110D30]/70 border border-[#241D4D]/80 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-[#7C3AED] mb-1">
                    <Code2 className="w-4 h-4" />
                    <span className="text-base font-extrabold text-[#F8FAFC]">100+</span>
                  </div>
                  <p className="text-[11px] text-[#94A3B8] font-medium leading-tight">
                    Curated Problems
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#110D30]/70 border border-[#241D4D]/80 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-[#F59E0B] mb-1">
                    <Trophy className="w-4 h-4" />
                    <span className="text-base font-extrabold text-[#F8FAFC]">20+</span>
                  </div>
                  <p className="text-[11px] text-[#94A3B8] font-medium leading-tight">
                    Chapter Contests
                  </p>
                </div>
              </div>
            </div>

            {/* Right: 3D Angled Perspective Tablet Device Frame with Visible Pure Amber 3D Edge */}
            <div className="lg:col-span-6 relative">
              {/* Warm Amber & Purple Ambient Glow Beneath Device */}
              <div className="absolute -inset-8 bg-gradient-to-tr from-[#7C3AED]/40 via-[#F59E0B]/35 to-[#FBBF24]/25 rounded-[48px] filter blur-3xl opacity-80 pointer-events-none" />

              {/* Tablet Outer Shell with 3D Perspective Tilt and Extruded Pure Amber Rim */}
              <div 
                className="relative rounded-[32px] p-[3px] transition-all duration-500 hover:rotate-0 hover:scale-[1.02] group/tablet"
                style={{
                  transform: 'perspective(1100px) rotateY(-13deg) rotateX(9deg) rotateZ(-1.5deg)',
                  transformStyle: 'preserve-3d',
                  background: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 35%, #D97706 70%, #7C3AED 100%)',
                  boxShadow: '1px 1px 0px #FDE68A, 2px 2px 0px #FBBF24, 4px 4px 0px #F59E0B, 6px 6px 0px #D97706, 8px 8px 0px #B45309, 10px 10px 0px #78350F, 12px 12px 1px rgba(0,0,0,0.7), 18px 22px 45px rgba(0,0,0,0.95), 0 0 60px rgba(245,158,11,0.45)',
                }}
              >
                {/* Visible 3D Extruded Bevel & Inner Chassis */}
                <div className="rounded-[29px] bg-[#120D2D] p-3 sm:p-4 border-r-[3px] border-b-[3px] border-[#F59E0B]/80 shadow-[inset_-2px_-2px_12px_rgba(245,158,11,0.3),inset_1px_1px_4px_rgba(255,255,255,0.1)] relative">
                  {/* Tablet Top Camera Notch */}
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-30">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#08051A] border border-[#F59E0B]/40" />
                  </div>

                  {/* Inner Tablet Display Screen */}
                  <div className="rounded-[20px] bg-[#0A071E] border border-[#241D4D] overflow-hidden text-xs shadow-inner">
                    {/* Top Bar inside Screen */}
                    <div className="flex items-center justify-between px-3 py-2 bg-[#0E0B28] border-b border-[#241D4D]">
                      <div className="flex items-center gap-2">
                        <NexusCodeLogo variant="compact" size="sm" />
                        <span className="font-extrabold text-[11px] tracking-wider text-[#F8FAFC]">
                          NEXUS <span className="text-[#F59E0B] font-medium">— CODE —</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                          <span className="text-[10px] text-[#94A3B8] font-mono">Live Arena</span>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-[#94A3B8]/40" />
                      </div>
                    </div>

                    {/* 3-Column Layout inside the Tablet */}
                    <div className="grid grid-cols-12 min-h-[340px]">
                      {/* 1. Left Problem List Drawer (2.5 cols) */}
                      <div className="col-span-3 bg-[#08051A] border-r border-[#241D4D] p-2 space-y-1">
                        <div className="text-[9px] font-bold text-[#64748B] px-1.5 py-0.5 uppercase tracking-wider">
                          Problems
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-[#F59E0B]/15 border border-[#F59E0B]/40 text-[#FBBF24] font-bold text-[10px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
                            <span className="truncate">Two Sum</span>
                          </div>
                          {[
                            'Valid Parentheses',
                            'Merge Intervals',
                            'Binary Search',
                            'Graph Paths',
                          ].map((prob) => (
                            <div
                              key={prob}
                              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[#94A3B8] hover:text-[#CBD5E1] hover:bg-[#130F35] text-[10px] transition-colors"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-[#332768]" />
                              <span className="truncate">{prob}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 2. Center Problem Statement Pane (4.5 cols) */}
                      <div className="col-span-4 bg-[#0B0824] border-r border-[#241D4D] p-2.5 space-y-2 flex flex-col justify-between">
                        <div className="space-y-2">
                          {/* Title & Difficulty Badge */}
                          <div className="flex items-center justify-between">
                            <h4 className="font-extrabold text-[#F8FAFC] text-[12px]">Two Sum</h4>
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#10B981]/20 text-[#34D399] border border-[#10B981]/30">
                              Easy
                            </span>
                          </div>

                          {/* Tags */}
                          <div className="flex flex-wrap gap-1">
                            <span className="text-[8px] px-1.5 py-0.5 rounded bg-[#1A1448] text-[#A855F7] font-semibold">
                              Array
                            </span>
                            <span className="text-[8px] px-1.5 py-0.5 rounded bg-[#1A1448] text-[#A855F7] font-semibold">
                              Hash Map
                            </span>
                          </div>

                          {/* Tabs */}
                          <div className="flex items-center gap-2 border-b border-[#241D4D] pb-1 text-[9px]">
                            <span className="text-[#F59E0B] font-bold border-b border-[#F59E0B] pb-0.5">
                              Description
                            </span>
                            <span className="text-[#64748B]">Examples</span>
                            <span className="text-[#64748B]">Constraints</span>
                          </div>

                          {/* Problem Text */}
                          <p className="text-[9.5px] text-[#94A3B8] leading-tight">
                            Given an array of integers <span className="text-[#FBBF24] font-mono">nums</span> and an integer{' '}
                            <span className="text-[#FBBF24] font-mono">target</span>, return indices of the two numbers such that they add up to target.
                          </p>

                          {/* Example Box */}
                          <div className="bg-[#08051A] rounded-lg p-2 border border-[#241D4D] text-[8.5px] font-mono space-y-0.5">
                            <div className="text-[#A855F7] font-bold">Example 1:</div>
                            <div className="text-[#CBD5E1]">Input: nums = [2,7,11,15], target = 9</div>
                            <div className="text-[#34D399]">Output: [0,1]</div>
                            <div className="text-[#64748B] text-[7.5px] leading-tight pt-0.5">
                              Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 3. Right Monaco Code Workspace Pane (5 cols) */}
                      <div className="col-span-5 bg-[#08051A] p-2.5 flex flex-col justify-between space-y-2">
                        {/* Editor Controls */}
                        <div className="flex items-center justify-between border-b border-[#241D4D] pb-1.5">
                          <div className="flex items-center gap-1">
                            <span className="px-1.5 py-0.5 rounded bg-[#15103A] border border-[#2D245E] text-[#FBBF24] font-mono text-[9px] font-bold">
                              Python 3 ▾
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              className="px-2 py-0.5 rounded bg-[#7C3AED] hover:bg-[#8B5CF6] text-white font-bold text-[9px] flex items-center gap-1 shadow-sm transition-all"
                            >
                              <Play className="w-2 h-2 fill-current" />
                              Run
                            </button>
                          </div>
                        </div>

                        {/* Code Content */}
                        <div className="font-mono text-[9px] leading-relaxed text-[#E2E8F0] space-y-0.5 select-none py-1">
                          <div><span className="text-[#475569]">1 </span><span className="text-[#64748B]"># write your code here</span></div>
                          <div><span className="text-[#475569]">2 </span><span className="text-[#C084FC]">class</span> <span className="text-[#FBBF24]">Solution</span>:</div>
                          <div><span className="text-[#475569]">3 </span>    <span className="text-[#C084FC]">def</span> <span className="text-[#60A5FA]">twoSum</span>(self, nums, target):</div>
                          <div><span className="text-[#475569]">4 </span>        <span className="text-[#64748B]"># Write your solution here</span></div>
                          <div><span className="text-[#475569]">5 </span>        <span className="text-[#A855F7]">pass</span></div>
                          <div><span className="text-[#475569]">6 </span></div>
                        </div>

                        {/* Bottom Test Cases / Results */}
                        <div className="bg-[#0E0B28] rounded-lg p-1.5 border border-[#241D4D] space-y-1">
                          <div className="flex items-center justify-between text-[8.5px] border-b border-[#241D4D] pb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[#F59E0B] font-bold">Test Cases</span>
                              <span className="text-[#64748B]">Results</span>
                            </div>
                          </div>

                          {/* Test Case Items */}
                          <div className="space-y-1 font-mono text-[8px]">
                            <div className="flex items-center justify-between">
                              <span className="text-[#CBD5E1] truncate max-w-[100px]">Case 1: nums = [2,7,11,15], target = 9</span>
                              <span className="px-1.5 py-0.2 rounded bg-[#10B981]/20 text-[#34D399] font-bold text-[7.5px] border border-[#10B981]/30">
                                Accepted
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[#CBD5E1] truncate max-w-[100px]">Case 2: nums = [3,2,4], target = 6</span>
                              <span className="px-1.5 py-0.2 rounded bg-[#7C3AED]/20 text-[#C084FC] font-bold text-[7.5px] border border-[#7C3AED]/30">
                                Run
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Handwritten Callout with Glow and Curved Pointer */}
                  <div className="absolute -bottom-10 -right-2 flex items-center gap-1.5 text-[#FBBF24] font-semibold text-xs transform rotate-[-4deg] drop-shadow-[0_2px_8px_rgba(245,158,11,0.5)]">
                    <span className="italic tracking-wider font-mono">Code · Compete · Grow</span>
                    <span className="text-base text-[#F59E0B] font-bold">↗</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. HOW IT WORKS SECTION */}
        {/* ========================================================================= */}
        <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
          <div className="text-center space-y-3 mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#F8FAFC]">
              How <span className="text-[#F59E0B]">It Works</span>
            </h2>
            <p className="text-sm sm:text-base text-[#94A3B8] max-w-xl mx-auto">
              Get started in minutes and join a community of passionate problem solvers.
            </p>
          </div>

          {/* 4 Connected Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {[
              {
                step: '1',
                icon: UserPlus,
                title: 'Create Account',
                description: 'Register in seconds and join your college chapter.',
                color: '#A855F7',
              },
              {
                step: '2',
                icon: Code2,
                title: 'Solve Problems',
                description: 'Practice with a rich library of curated problems.',
                color: '#7C3AED',
              },
              {
                step: '3',
                icon: Trophy,
                title: 'Join Contests',
                description: 'Participate in chapter tournaments and special events.',
                color: '#F59E0B',
              },
              {
                step: '4',
                icon: BarChart3,
                title: 'Track Progress',
                description: 'View analytics, improve skills and climb leaderboards.',
                color: '#10B981',
              },
            ].map((card, idx) => {
              const IconComponent = card.icon;
              return (
                <div
                  key={card.step}
                  className="group relative rounded-2xl bg-[#0E0B28]/90 border border-[#241D4D] hover:border-[#F59E0B]/60 p-6 flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-[#F59E0B]/10 backdrop-blur-sm"
                >
                  {/* Step Number Badge */}
                  <div className="w-8 h-8 rounded-full bg-[#F59E0B] text-[#08051A] font-extrabold text-xs flex items-center justify-center mb-5 shadow-md shadow-[#F59E0B]/30 group-hover:scale-110 transition-transform">
                    {card.step}
                  </div>

                  {/* Icon Container */}
                  <div className="w-14 h-14 rounded-2xl bg-[#15103A] border border-[#2D245E] flex items-center justify-center text-[#F59E0B] mb-5 group-hover:bg-[#F59E0B]/10 group-hover:border-[#F59E0B]/40 group-hover:scale-105 transition-all">
                    <IconComponent className="w-7 h-7" />
                  </div>

                  {/* Content */}
                  <h3 className="text-base font-bold text-[#F8FAFC] group-hover:text-[#FBBF24] transition-colors mb-2">
                    {card.title}
                  </h3>
                  <p className="text-xs text-[#94A3B8] leading-relaxed">
                    {card.description}
                  </p>

                  {/* Connector Arrow for desktop */}
                  {idx < 3 && (
                    <div className="hidden lg:block absolute -right-3.5 top-1/2 -translate-y-1/2 z-20 text-[#332768] group-hover:text-[#F59E0B] transition-colors">
                      <ChevronRight className="w-7 h-7" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. POWERFUL FEATURES SECTION */}
        {/* ========================================================================= */}
        <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
          <div className="text-center space-y-3 mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#F8FAFC]">
              Powerful <span className="text-[#F59E0B]">Features</span> for Student Developers
            </h2>
            <p className="text-sm sm:text-base text-[#94A3B8] max-w-xl mx-auto">
              Everything you need to practice, compete, and grow — all in one place.
            </p>
          </div>

          {/* 6 Feature Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Trophy,
                title: 'Competitive Coding',
                description: 'Chapter-based contests, hackathons and regular competitive events with strict anti-cheat verification.',
                tag: 'Tournaments',
              },
              {
                icon: Terminal,
                title: 'Monaco Code Editor',
                description: 'A powerful, modern coding environment with IntelliSense syntax highlighting, keybindings, and custom themes.',
                tag: 'IDE Grade',
              },
              {
                icon: Layers,
                title: 'Multiple Languages',
                description: 'Full compilation & execution support for C, C++, Java, Python, and JavaScript powered by Judge0 backend.',
                tag: 'Multi-Runtime',
              },
              {
                icon: BarChart3,
                title: 'Real-Time Leaderboards',
                description: 'Live contest standings, deterministic scoring, and tie-breaking algorithms streaming rank updates live.',
                tag: 'Live Sync',
              },
              {
                icon: FileText,
                title: 'Submission Tracking',
                description: 'Detailed execution logs, per-testcase feedback, memory consumption, execution runtime, and verdict analytics.',
                tag: 'Analytics',
              },
              {
                icon: UserCheck,
                title: 'Student Profiles',
                description: 'Track your coding journey, showcase badges, view solve history, and earn verified chapter certificates.',
                tag: 'Portfolio',
              },
            ].map((feat) => {
              const IconComp = feat.icon;
              return (
                <div
                  key={feat.title}
                  className="group rounded-2xl bg-[#0E0B28]/80 border border-[#241D4D] hover:border-[#F59E0B]/50 p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-[#F59E0B]/10 backdrop-blur-sm relative overflow-hidden"
                >
                  {/* Subtle hover gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#7C3AED]/0 via-transparent to-[#F59E0B]/0 group-hover:from-[#7C3AED]/5 group-hover:to-[#F59E0B]/5 transition-all duration-300 pointer-events-none" />

                  <div className="space-y-4 relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-xl bg-[#16103D] border border-[#2D245E] flex items-center justify-center text-[#F59E0B] group-hover:bg-[#F59E0B] group-hover:text-[#08051A] transition-all duration-300">
                        <IconComp className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#A855F7] bg-[#7C3AED]/15 px-2.5 py-1 rounded-full border border-[#7C3AED]/30">
                        {feat.tag}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-[#F8FAFC] group-hover:text-[#FBBF24] transition-colors">
                      {feat.title}
                    </h3>

                    <p className="text-xs text-[#94A3B8] leading-relaxed">
                      {feat.description}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-[#241D4D]/60 flex items-center justify-between text-xs font-semibold text-[#CBD5E1] group-hover:text-[#F59E0B] transition-colors relative z-10">
                    <span>Learn more</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 5. CONTEST WORKFLOW SECTION */}
        {/* ========================================================================= */}
        <section id="contests" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
          <div className="text-center space-y-3 mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#F8FAFC]">
              From Problem to <span className="text-[#F59E0B]">Leaderboard</span>
            </h2>
            <p className="text-sm sm:text-base text-[#94A3B8] max-w-xl mx-auto">
              A seamless contest experience, built for students.
            </p>
          </div>

          {/* 6 Step Flow Badges */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { icon: FileText, title: 'Register', sub: 'Join upcoming contests' },
              { icon: Code2, title: 'Solve Problems', sub: 'Access multiple problems' },
              { icon: Terminal, title: 'Code', sub: 'Use the online editor' },
              { icon: Send, title: 'Submit', sub: 'Get instant evaluation' },
              { icon: BarChart3, title: 'View Score', sub: 'Check your rank in real-time' },
              { icon: Trophy, title: 'Climb Leaderboard', sub: 'Compete and grow' },
            ].map((flow, i) => {
              const FlowIcon = flow.icon;
              return (
                <div
                  key={flow.title}
                  className="group rounded-xl bg-[#0E0B28] border border-[#241D4D] hover:border-[#F59E0B]/60 p-4 flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#F59E0B]/10"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#140F38] border border-[#2B225C] flex items-center justify-center text-[#A855F7] group-hover:text-[#F59E0B] group-hover:border-[#F59E0B]/40 transition-all mb-3">
                    <FlowIcon className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-[#F8FAFC] group-hover:text-[#FBBF24] transition-colors mb-1">
                    {flow.title}
                  </h4>
                  <p className="text-[11px] text-[#94A3B8] leading-tight">
                    {flow.sub}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 6. A SEAMLESS CODING EXPERIENCE (INTERACTIVE POLISHED IDE PREVIEW) */}
        {/* ========================================================================= */}
        <section id="why-us" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
          <div className="rounded-3xl bg-gradient-to-br from-[#0E0B28] via-[#110D33] to-[#08051A] border border-[#241D4D] p-6 sm:p-10 lg:p-12 shadow-2xl relative overflow-hidden group/container">
            {/* Ambient Corner Lighting & Glow */}
            <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-[#7C3AED]/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-1/4 w-[350px] h-[350px] bg-[#F59E0B]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
              {/* Left Column: Monaco IDE Shell with Luminous Animated Edge Sweep */}
              <div className="lg:col-span-7 relative">
                {/* Luminous Sweep Border Ring */}
                <div className="relative rounded-2xl bg-gradient-to-r from-[#7C3AED]/60 via-[#F59E0B]/50 to-[#A855F7]/60 p-[1.5px] shadow-[0_15px_45px_rgba(0,0,0,0.8),0_0_30px_rgba(124,58,237,0.2)] animate-luminous-edge transition-all duration-300 group-hover/container:shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_40px_rgba(245,158,11,0.25)]">
                  <div className="rounded-2xl bg-[#08051A] p-4 shadow-xl font-mono text-xs">
                    {/* Editor Header Bar with Tabs & Language Dropdown */}
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#241D4D]">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#EF4444] transition-transform hover:scale-125" />
                        <div className="w-3 h-3 rounded-full bg-[#F59E0B] transition-transform hover:scale-125" />
                        <div className="w-3 h-3 rounded-full bg-[#10B981] transition-transform hover:scale-125" />
                        <span className="text-[11px] text-[#94A3B8] ml-2 flex items-center gap-1.5 font-mono">
                          <Terminal className="w-3 h-3 text-[#7C3AED]" />
                          <span className="text-[#F8FAFC]">{currentLanguage.file}</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#7C3AED]/20 text-[#C084FC]">
                            {currentLanguage.short}
                          </span>
                        </span>
                      </div>

                      {/* Language Switcher Buttons & Controls */}
                      <div className="flex items-center gap-1.5">
                        {/* Interactive Language Selector Tabs */}
                        <div className="flex items-center bg-[#110D30] rounded-lg p-0.5 border border-[#2D245E]">
                          {SUPPORTED_LANGUAGES.map((lang, idx) => (
                            <button
                              key={lang.id}
                              type="button"
                              onClick={() => handleManualLangChange(idx)}
                              className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold transition-all ${
                                selectedLangIndex === idx
                                  ? 'bg-[#F59E0B] text-[#08051A] shadow-sm shadow-[#F59E0B]/30 scale-105'
                                  : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#181342]'
                              }`}
                            >
                              {lang.short}
                            </button>
                          ))}
                        </div>

                        {/* Run Button with Micro-interactions */}
                        <button
                          type="button"
                          onClick={() => handleSimulateRun('run')}
                          disabled={executionState === 'running'}
                          className="px-2.5 py-1 rounded-lg bg-[#7C3AED] hover:bg-[#8B5CF6] text-white font-sans font-bold text-[11px] transition-all flex items-center gap-1 shadow-md shadow-[#7C3AED]/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
                        >
                          <Play className={`w-2.5 h-2.5 fill-current ${executionState === 'running' ? 'animate-spin' : ''}`} />
                          <span>Run</span>
                        </button>

                        {/* Submit Button */}
                        <button
                          type="button"
                          onClick={() => handleSimulateRun('submit')}
                          disabled={executionState === 'running'}
                          className="px-3 py-1 rounded-lg bg-[#F59E0B] hover:bg-[#FBBF24] text-[#08051A] font-sans font-extrabold text-[11px] transition-all shadow-md shadow-[#F59E0B]/25 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 flex items-center gap-1"
                        >
                          <Send className="w-2.5 h-2.5" />
                          <span>Submit</span>
                        </button>
                      </div>
                    </div>

                    {/* Execution Toast Notice if Triggered */}
                    {executionState !== 'idle' && (
                      <div className="mb-2 px-3 py-1.5 rounded-lg bg-[#10B981]/15 border border-[#10B981]/40 text-[#34D399] font-sans text-[11px] flex items-center justify-between animate-fade-in">
                        <span className="flex items-center gap-1.5 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {executionState === 'running' ? 'Compiling in Judge0 sandbox...' : 'All Test Cases Evaluated · 100% Score!'}
                        </span>
                        <span className="text-[10px] text-[#94A3B8] font-mono">0.02s runtime</span>
                      </div>
                    )}

                    {/* Editor Code Body with Syntax Highlighting & Line Highlight */}
                    <div
                      className={`py-2 space-y-1 text-[#E2E8F0] leading-relaxed select-none min-h-[190px] transition-opacity duration-200 ${
                        langTransitionEffect ? 'opacity-30' : 'opacity-100'
                      }`}
                    >
                      {currentLanguage.lines.map((line) => (
                        <div
                          key={line.num}
                          className={`flex items-start px-2 py-0.5 rounded transition-colors ${
                            line.isHighlighted
                              ? 'bg-[#7C3AED]/20 border-l-2 border-[#F59E0B]'
                              : 'hover:bg-[#130F35]/50'
                          }`}
                        >
                          <span className="text-[#64748B] w-6 shrink-0 select-none text-[11px]">
                            {line.num}
                          </span>
                          <div className="flex-1 overflow-x-auto">
                            {line.tokens.map((token, tIdx) => (
                              <span key={tIdx} className={token.color || 'text-[#E2E8F0]'}>
                                {token.text}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Test Results Table with Sequential Animation */}
                    <div className="mt-3 pt-3 border-t border-[#241D4D] space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-sans font-semibold text-[#94A3B8]">
                        <div className="flex items-center gap-2">
                          <span className="text-[#F8FAFC]">Test Cases</span>
                          <span className="text-[10px] text-[#A855F7] font-normal">
                            (Auto-evaluating live stream)
                          </span>
                        </div>
                        <span className="text-[#94A3B8]">Results & Latency</span>
                      </div>

                      <div className="space-y-1.5 font-sans">
                        {DEMO_TEST_CASES.map((tc, idx) => {
                          const isActive = activeTestCaseIndex === idx;
                          return (
                            <div
                              key={tc.id}
                              onMouseEnter={() => {
                                setTestCyclePaused(true);
                                setActiveTestCaseIndex(idx);
                              }}
                              onMouseLeave={() => setTestCyclePaused(false)}
                              className={`flex items-center justify-between p-2 rounded-xl transition-all duration-300 cursor-pointer ${
                                isActive
                                  ? 'bg-[#15103A] border border-[#F59E0B]/70 shadow-md shadow-[#F59E0B]/10 scale-[1.01]'
                                  : 'bg-[#0E0B28] border border-[#241D4D] opacity-75 hover:opacity-100 hover:border-[#7C3AED]/50'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <span
                                  className={`w-2 h-2 rounded-full transition-colors ${
                                    isActive ? 'bg-[#F59E0B] animate-ping' : 'bg-[#332768]'
                                  }`}
                                />
                                <span className="text-xs font-bold text-[#CBD5E1]">{tc.name}</span>
                                <span className="text-[10px] text-[#64748B] font-mono hidden sm:inline">
                                  {tc.input}
                                </span>
                              </div>

                              <div className="flex items-center gap-3">
                                {tc.status === 'Accepted' ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#10B981]/20 text-[#34D399] font-bold text-[10px] border border-[#10B981]/30">
                                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                                    Accepted
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#EF4444]/20 text-[#F87171] font-bold text-[10px] border border-[#EF4444]/30">
                                    <XCircle className="w-2.5 h-2.5 stroke-[3]" />
                                    Wrong Answer
                                  </span>
                                )}
                                <span className="text-[10px] text-[#94A3B8] font-mono w-10 text-right">
                                  {tc.runtime}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Feature Checklist & 3D Isometric Prism Badge */}
              <div className="lg:col-span-5 space-y-6 relative">
                {/* 3D Floating Isometric Code Badge */}
                <div className="absolute -top-4 right-0 hidden sm:block pointer-events-none animate-gentle-float">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#7C3AED] via-[#9333EA] to-[#F59E0B] p-[2px] shadow-xl shadow-[#7C3AED]/40">
                    <div className="w-full h-full rounded-[14px] bg-[#0E0B28] flex items-center justify-center text-[#FBBF24]">
                      <Code2 className="w-8 h-8 drop-shadow-[0_0_10px_rgba(245,158,11,0.6)]" />
                    </div>
                  </div>
                  {/* Amber reflection shadow */}
                  <div className="w-12 h-3 bg-[#F59E0B]/30 rounded-full blur-md mx-auto mt-2" />
                </div>

                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/40 text-[#C084FC] text-[11px] font-bold uppercase tracking-wider">
                  <Sparkles className="w-3 h-3 text-[#F59E0B]" />
                  <span>Interactive Coding Environment</span>
                </div>

                <h3 className="text-3xl sm:text-4xl font-extrabold text-[#F8FAFC] tracking-tight leading-tight">
                  A Seamless{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F59E0B] to-[#FBBF24]">
                    Coding Experience
                  </span>
                </h3>

                <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
                  Write, test and submit your code in a secure, isolated environment
                  powered by Judge0. Get instant feedback and focus on what matters — solving problems.
                </p>

                {/* Feature Checklist */}
                <ul className="space-y-3 pt-2">
                  {[
                    'Clean and modern Monaco editor',
                    'Real-time submission results',
                    'Supports multiple programming languages',
                    'Secure and isolated code execution',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-xs sm:text-sm font-semibold text-[#CBD5E1]">
                      <div className="w-5 h-5 rounded-full bg-[#F59E0B]/20 text-[#F59E0B] flex items-center justify-center flex-shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 7. BOTTOM BANNER CTA WITH MOUNTAIN MILESTONES (FOOT TO PEAK) */}
        {/* ========================================================================= */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#170B38] via-[#2D1268] to-[#12082C] border border-[#7C3AED]/40 p-6 sm:p-10 lg:p-12 shadow-2xl shadow-[#08051A]">
            {/* Ambient Background Glows */}
            <div className="absolute -top-12 -left-12 w-96 h-96 bg-[#F59E0B]/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -right-12 w-96 h-96 bg-[#7C3AED]/25 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Column: Mountain Peak with Milestone Journey (Foot to Peak) */}
              <div className="lg:col-span-6 relative rounded-2xl bg-[#09051E]/90 border border-[#332768] p-3 sm:p-4 overflow-hidden shadow-xl">
                {/* SVG Mountain Range Landscape with Glowing Trail & Peak Flag */}
                <div className="relative h-64 sm:h-72 w-full flex items-end justify-center overflow-hidden rounded-xl">
                  {/* Sunset Sky & Radiant Sun Behind Peak */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#200A45] via-[#4C1D95]/70 to-[#F59E0B]/20" />
                  <div className="absolute top-6 left-1/2 -translate-x-1/2 w-28 h-28 bg-[#FBBF24]/30 rounded-full blur-2xl animate-pulse pointer-events-none" />

                  {/* Mountain Vectors (Background, Midground, Foreground) */}
                  <svg
                    viewBox="0 0 500 300"
                    className="w-full h-full object-cover relative z-10"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient id="peakGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#F59E0B" />
                        <stop offset="100%" stopColor="#7C3AED" />
                      </linearGradient>
                      <linearGradient id="mountainBack" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#6D28D9" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#1E103E" stopOpacity="0.9" />
                      </linearGradient>
                      <linearGradient id="mountainMid" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#4C1D95" />
                        <stop offset="100%" stopColor="#110729" />
                      </linearGradient>
                      <linearGradient id="mountainFore" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#311068" />
                        <stop offset="100%" stopColor="#080418" />
                      </linearGradient>
                    </defs>

                    {/* Distant Mountain Peaks */}
                    <polygon points="50,300 160,110 270,300" fill="url(#mountainBack)" />
                    <polygon points="220,300 350,90 480,300" fill="url(#mountainBack)" />

                    {/* Central Majestic Peak (Summit) */}
                    <polygon points="100,300 250,45 400,300" fill="url(#mountainMid)" />
                    <polygon points="250,45 250,300 400,300" fill="#1C0A3B" opacity="0.6" />

                    {/* Foreground Foothills */}
                    <polygon points="0,300 110,180 230,300" fill="url(#mountainFore)" />
                    <polygon points="280,300 410,160 500,300" fill="url(#mountainFore)" />

                    {/* Glowing Ascent Path / Switchback Trail from Foot to Summit */}
                    <path
                      d="M 60,270 Q 140,240 160,200 T 320,150 T 220,100 T 250,50"
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth="3"
                      strokeDasharray="6 4"
                      className="animate-pulse"
                      opacity="0.85"
                    />

                    {/* Summit Golden Flag */}
                    <line x1="250" y1="45" x2="250" y2="18" stroke="#FBBF24" strokeWidth="2.5" />
                    <polygon points="250,18 280,26 250,34" fill="#F59E0B" />
                    <circle cx="250" cy="18" r="3" fill="#FBBF24" />
                  </svg>

                  {/* Milestone 1: Foot (Beginner) */}
                  <div className="absolute bottom-4 left-4 z-20 bg-[#0E0B28]/90 border border-[#241D4D] hover:border-[#F59E0B] px-2.5 py-1.5 rounded-lg text-[10px] backdrop-blur-md shadow-md transition-all">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                      <span className="font-bold text-[#F8FAFC]">01 · Beginner</span>
                    </div>
                    <span className="text-[8.5px] text-[#94A3B8]">Foot: Fundamentals</span>
                  </div>

                  {/* Milestone 2: Mid-Slope (Solver) */}
                  <div className="absolute bottom-20 left-1/4 z-20 hidden sm:block bg-[#0E0B28]/90 border border-[#241D4D] hover:border-[#F59E0B] px-2.5 py-1.5 rounded-lg text-[10px] backdrop-blur-md shadow-md transition-all">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#60A5FA]" />
                      <span className="font-bold text-[#F8FAFC]">02 · Problem Solver</span>
                    </div>
                    <span className="text-[8.5px] text-[#94A3B8]">Ridge: DSA & Algorithms</span>
                  </div>

                  {/* Milestone 3: High Ridge (Contender) */}
                  <div className="absolute bottom-32 right-1/4 z-20 hidden sm:block bg-[#0E0B28]/90 border border-[#241D4D] hover:border-[#F59E0B] px-2.5 py-1.5 rounded-lg text-[10px] backdrop-blur-md shadow-md transition-all">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#A855F7]" />
                      <span className="font-bold text-[#F8FAFC]">03 · Contender</span>
                    </div>
                    <span className="text-[8.5px] text-[#94A3B8]">Slope: Tournaments</span>
                  </div>

                  {/* Milestone 4: Peak Summit (Grandmaster / Lead the Pack) */}
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-[#F59E0B]/20 border border-[#F59E0B] px-3 py-1.5 rounded-full text-[11px] backdrop-blur-md shadow-lg shadow-[#F59E0B]/30 flex items-center gap-1.5 font-extrabold text-[#FBBF24] animate-bounce">
                    <Flag className="w-3 h-3 text-[#F59E0B]" />
                    <span>Peak: Grandmaster</span>
                  </div>
                </div>
              </div>

              {/* Right Column: CTA Content & Get Started Action */}
              <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F59E0B]/15 border border-[#F59E0B]/40 text-[#FBBF24] text-[11px] font-bold uppercase tracking-wider">
                  <Trophy className="w-3.5 h-3.5 text-[#F59E0B]" />
                  <span>Climb to the Peak of Chapter Rankings</span>
                </div>

                <h3 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#F8FAFC] tracking-tight leading-tight">
                  Ready to Start Your{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F59E0B] via-[#FBBF24] to-[#F59E0B]">
                    Coding Journey?
                  </span>
                </h3>

                <p className="text-xs sm:text-sm text-[#E2E8F0]/80 leading-relaxed max-w-xl mx-auto lg:mx-0">
                  Ascend from beginner to top-tier chapter champion. Practice curated problems, compete in real-time arenas, earn certificates, and lead the pack.
                </p>

                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#F59E0B] hover:bg-[#FBBF24] text-[#08051A] font-extrabold text-sm transition-all shadow-2xl shadow-[#F59E0B]/40 hover:-translate-y-0.5 active:scale-95"
                  >
                    Get Started Now
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 px-6 py-4 rounded-xl bg-[#110D30] hover:bg-[#191444] text-[#CBD5E1] hover:text-[#F8FAFC] font-bold text-sm border border-[#241D4D] transition-all hover:-translate-y-0.5"
                  >
                    <LogIn className="w-4 h-4 text-[#A855F7]" />
                    Login
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ========================================================================= */}
      {/* 8. PUBLIC MINIMAL FOOTER */}
      {/* ========================================================================= */}
      <footer className="border-t border-[#241D4D] bg-[#0A061E] py-8 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <NexusCodeLogo variant="full" size="sm" />
          </Link>

          {/* Quick Links */}
          <nav className="flex flex-wrap items-center gap-6 text-xs text-[#94A3B8]" aria-label="Footer Navigation">
            {[
              { label: 'How It Works', href: '#how-it-works' },
              { label: 'Features', href: '#features' },
              { label: 'Contests', href: '#contests' },
              { label: 'Why Us', href: '#why-us' },
            ].map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => scrollToSection(e, link.href.slice(1))}
                className="hover:text-[#F59E0B] transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Social Icons & Copyright */}
          <div className="flex flex-col sm:flex-row items-center gap-4 text-xs text-[#94A3B8]">
            <div className="flex items-center gap-4 text-[#94A3B8]">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#F59E0B] transition-colors" aria-label="GitHub">
                <Github className="w-4 h-4" />
              </a>
              <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#F59E0B] transition-colors" aria-label="Discord">
                <MessageSquare className="w-4 h-4" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#F59E0B] transition-colors" aria-label="LinkedIn">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#F59E0B] transition-colors" aria-label="YouTube">
                <Youtube className="w-4 h-4" />
              </a>
            </div>

            <span className="hidden sm:inline text-[#241D4D]">|</span>
            <span>&copy; {new Date().getFullYear()} Nexus Code. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
