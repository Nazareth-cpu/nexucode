/**
 * Monaco Coding Workspace Editor Surface — Exact Implementation of Reference Panel 04
 *
 * Professional code editor configured for competitive programming.
 * Implements the Nexus Code dark theme, purple/amber controls, and auto-save indicators.
 */

import React, { useRef, useState, useCallback } from 'react';
import Editor, { OnMount, BeforeMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import {
  RefreshCw,
  RotateCcw,
  Maximize2,
  Minimize2,
  Settings,
  Terminal,
  CheckCircle2,
  Play,
  Send,
} from 'lucide-react';
import type { SupportedWorkspaceLanguage, EditorSettings } from '../types';
import { WORKSPACE_LANGUAGES } from '../types';
import {
  NEXUS_CODE_THEME_NAME,
  nexusCodeMonacoTheme,
} from '../themes/nexusCodeTheme';

interface MonacoWorkspaceEditorProps {
  language: SupportedWorkspaceLanguage;
  code: string;
  onChange: (value: string) => void;
  onResetStarter: () => void;
  isCustomCode: boolean;
  problemId?: string;
  isReadOnly?: boolean;
  onRun?: () => void;
  onSubmit?: () => void;
  isPending?: boolean;
}

export function MonacoWorkspaceEditor({
  language,
  code,
  onChange,
  onResetStarter,
  isCustomCode,
  problemId,
  isReadOnly = false,
  onRun,
  onSubmit,
  isPending = false,
}: MonacoWorkspaceEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<any>(null);

  const [cursorPos, setCursorPos] = useState({ line: 1, column: 1 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<EditorSettings>({
    fontSize: 14,
    tabSize: 4,
    minimap: false,
    wordWrap: 'off',
    lineNumbers: 'on',
  });

  const langDef = WORKSPACE_LANGUAGES[language] || {
    id: 'python',
    label: 'Python 3',
    monacoLang: 'python',
    fileExtension: 'py',
  };

  // Theme definition before Monaco mounts
  const handleEditorWillMount: BeforeMount = (monaco) => {
    monaco.editor.defineTheme(NEXUS_CODE_THEME_NAME, nexusCodeMonacoTheme);
  };

  // Editor configuration on mount
  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Apply custom theme immediately
    monaco.editor.setTheme(NEXUS_CODE_THEME_NAME);

    // Track cursor position for status bar
    editor.onDidChangeCursorPosition((e: editor.ICursorPositionChangedEvent) => {
      setCursorPos({
        line: e.position.lineNumber,
        column: e.position.column,
      });
    });

    // Initial focus
    editor.focus();
  };

  const handleFormatCode = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument')?.run();
    }
  }, []);

  return (
    <div
      className={`flex flex-col rounded-2xl border border-[#241D4D] bg-[#08051A] overflow-hidden transition-all duration-150 ${
        isFullscreen
          ? 'fixed inset-4 z-50 shadow-2xl border-[#7C3AED]/70'
          : 'h-full min-h-[480px]'
      }`}
    >
      {/* Editor Sub-Header Toolbar (Panel 04) */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#241D4D] bg-[#0E0B28] text-xs select-none">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#F59E0B]" />
          <span className="font-mono text-[#F8FAFC] font-bold">
            solution.{langDef.fileExtension}
          </span>
          {isCustomCode && (
            <span className="text-[10px] text-[#A855F7] bg-[#7C3AED]/20 px-2 py-0.5 rounded-full border border-[#7C3AED]/40 font-mono font-bold">
              Edited
            </span>
          )}
        </div>

        {/* Action Controls & Run/Submit if provided */}
        <div className="flex items-center gap-2">
          {onRun && (
            <button
              type="button"
              onClick={onRun}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#241D4D] bg-[#15103A] hover:bg-[#1E174E] text-[#F8FAFC] font-bold text-xs transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              <Play className="w-3 h-3 text-[#10B981] fill-[#10B981]/20" />
              <span>Run</span>
            </button>
          )}

          {onSubmit && (
            <button
              type="button"
              onClick={onSubmit}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#7C3AED] hover:bg-[#A855F7] text-white font-bold text-xs transition-all shadow-md shadow-[#7C3AED]/20 active:scale-95 disabled:opacity-50"
            >
              <Send className="w-3 h-3" />
              <span>Submit</span>
            </button>
          )}

          {isCustomCode && (
            <button
              type="button"
              onClick={onResetStarter}
              title="Reset code to original starter template"
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] text-[#94A3B8] hover:text-[#EF4444] hover:bg-[#15103A] transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleFormatCode}
            title="Auto-format code document"
            className="px-2.5 py-1 rounded-lg text-[11px] text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#15103A] transition-colors"
          >
            Format
          </button>

          {/* Settings */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              title="Editor Display Settings"
              className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#15103A] transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>

            {showSettings && (
              <div className="absolute right-0 z-50 mt-1 w-48 rounded-xl border border-[#241D4D] bg-[#0E0B28] p-3 text-xs shadow-2xl space-y-3">
                <div className="font-mono text-[10px] uppercase text-[#F59E0B] font-bold">
                  Editor Settings
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#94A3B8]">Font Size:</span>
                  <div className="flex items-center gap-1">
                    {[12, 14, 16].map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setSettings((s) => ({ ...s, fontSize: sz }))}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                          settings.fontSize === sz
                            ? 'bg-[#7C3AED] text-white font-bold'
                            : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#94A3B8]">Minimap:</span>
                  <button
                    type="button"
                    onClick={() => setSettings((s) => ({ ...s, minimap: !s.minimap }))}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                      settings.minimap
                        ? 'bg-[#7C3AED]/20 text-[#A855F7] border border-[#7C3AED]/40'
                        : 'text-[#94A3B8] bg-[#08051A]'
                    }`}
                  >
                    {settings.minimap ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Editor'}
            className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#15103A] transition-colors"
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5 text-[#F59E0B]" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Monaco Container */}
      <div className="flex-1 relative min-h-[360px] bg-[#08051A]">
        <Editor
          height="100%"
          path={`${problemId ? `problem_${problemId}_` : ''}solution_${language}.${langDef.fileExtension}`}
          language={langDef.monacoLang}
          value={code}
          onChange={(val) => onChange(val || '')}
          theme={NEXUS_CODE_THEME_NAME}
          beforeMount={handleEditorWillMount}
          onMount={handleEditorDidMount}
          loading={
            <div className="h-full flex items-center justify-center space-y-2 bg-[#08051A] text-xs text-[#94A3B8]">
              <RefreshCw className="w-5 h-5 animate-spin text-[#7C3AED] mx-auto" />
              <p className="font-mono">Initializing Monaco Workspace...</p>
            </div>
          }
          options={{
            readOnly: isReadOnly,
            fontSize: settings.fontSize,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontLigatures: true,
            tabSize: settings.tabSize,
            minimap: { enabled: settings.minimap },
            wordWrap: settings.wordWrap,
            lineNumbers: settings.lineNumbers,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            bracketPairColorization: { enabled: true },
            matchBrackets: 'always',
            autoClosingBrackets: 'always',
            autoClosingQuotes: 'always',
            formatOnPaste: true,
            formatOnType: false,
            folding: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            smoothScrolling: true,
            padding: { top: 12, bottom: 12 },
            renderLineHighlight: 'all',
            overviewRulerBorder: false,
            hideCursorInOverviewRuler: true,
            contextmenu: true,
          }}
        />
      </div>

      {/* Editor Status Bar Footer (Panel 04: Auto-save enabled) */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-[#241D4D] bg-[#0E0B28] text-[11px] font-mono text-[#94A3B8] select-none">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-[#10B981] font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Auto-save enabled</span>
          </span>
          <span className="text-[#241D4D]">|</span>
          <span>
            Ln {cursorPos.line}, Col {cursorPos.column}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[#F59E0B] font-bold">{langDef.label}</span>
          <span className="text-[#241D4D]">|</span>
          <span>UTF-8</span>
          <span className="text-[#241D4D]">|</span>
          <span>Spaces: {settings.tabSize}</span>
        </div>
      </div>
    </div>
  );
}
