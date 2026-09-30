/**
 * Monaco Coding Workspace Editor Surface (Phase 4)
 *
 * Professional code editor configured for competitive programming.
 * Implements the Nexus Code dark theme, font hierarchy, and language switching.
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
  isReadOnly?: boolean;
}

export function MonacoWorkspaceEditor({
  language,
  code,
  onChange,
  onResetStarter,
  isCustomCode,
  isReadOnly = false,
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

  const langDef = WORKSPACE_LANGUAGES[language];

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
    editor.onDidChangeCursorPosition((e) => {
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
      className={`flex flex-col rounded-xl border border-[#263833] bg-[#07110F] overflow-hidden transition-all duration-150 ${
        isFullscreen
          ? 'fixed inset-4 z-50 shadow-2xl border-[#F59E0B]/50'
          : 'h-full min-h-[480px]'
      }`}
    >
      {/* Editor Sub-Header Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#263833] bg-[#0D1A17] text-xs select-none">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-[#F59E0B]" />
          <span className="font-mono text-[#F8FAFC] font-semibold">
            solution.{langDef.fileExtension}
          </span>
          {isCustomCode && (
            <span className="text-[10px] text-[#10B981] bg-[#10B981]/10 px-1.5 py-0.2 rounded border border-[#10B981]/30 font-mono">
              Edited
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {isCustomCode && (
            <button
              type="button"
              onClick={onResetStarter}
              title="Reset code to original starter template"
              className="flex items-center gap-1 px-2 py-1 rounded text-[11px] text-[#9CA3AF] hover:text-[#EF4444] hover:bg-[#12221E] transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleFormatCode}
            title="Auto-format code document"
            className="px-2 py-1 rounded text-[11px] text-[#9CA3AF] hover:text-[#F8FAFC] hover:bg-[#12221E] transition-colors"
          >
            Format
          </button>

          {/* Quick Settings Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              title="Editor Display Settings"
              className="p-1 rounded text-[#9CA3AF] hover:text-[#F8FAFC] hover:bg-[#12221E] transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>

            {showSettings && (
              <div className="absolute right-0 z-50 mt-1 w-48 rounded-xl border border-[#263833] bg-[#0D1A17] p-3 text-xs shadow-2xl space-y-3">
                <div className="font-mono text-[10px] uppercase text-[#F59E0B] font-bold">
                  Editor Settings
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#9CA3AF]">Font Size:</span>
                  <div className="flex items-center gap-1">
                    {[12, 14, 16].map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setSettings((s) => ({ ...s, fontSize: sz }))}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                          settings.fontSize === sz
                            ? 'bg-[#F59E0B] text-[#07110F] font-bold'
                            : 'text-[#9CA3AF] hover:text-[#F8FAFC]'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#9CA3AF]">Minimap:</span>
                  <button
                    type="button"
                    onClick={() => setSettings((s) => ({ ...s, minimap: !s.minimap }))}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                      settings.minimap
                        ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40'
                        : 'text-[#9CA3AF] bg-[#07110F]'
                    }`}
                  >
                    {settings.minimap ? 'ON' : 'OFF'}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#9CA3AF]">Word Wrap:</span>
                  <button
                    type="button"
                    onClick={() =>
                      setSettings((s) => ({
                        ...s,
                        wordWrap: s.wordWrap === 'on' ? 'off' : 'on',
                      }))
                    }
                    className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                      settings.wordWrap === 'on'
                        ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40'
                        : 'text-[#9CA3AF] bg-[#07110F]'
                    }`}
                  >
                    {settings.wordWrap.toUpperCase()}
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Editor'}
            className="p-1 rounded text-[#9CA3AF] hover:text-[#F8FAFC] hover:bg-[#12221E] transition-colors"
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
      <div className="flex-1 relative min-h-[360px] bg-[#07110F]">
        <Editor
          height="100%"
          language={langDef.monacoLang}
          value={code}
          onChange={(val) => onChange(val || '')}
          theme={NEXUS_CODE_THEME_NAME}
          beforeMount={handleEditorWillMount}
          onMount={handleEditorDidMount}
          loading={
            <div className="h-full flex items-center justify-center space-y-2 bg-[#07110F] text-xs text-[#9CA3AF]">
              <RefreshCw className="w-5 h-5 animate-spin text-[#F59E0B] mx-auto" />
              <p className="font-mono">Initializing Monaco Workspace...</p>
            </div>
          }
          options={{
            readOnly: isReadOnly,
            fontSize: settings.fontSize,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
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

      {/* Editor Status Bar Footer */}
      <div className="flex items-center justify-between px-3 py-1.5 border-t border-[#263833] bg-[#0D1A17] text-[11px] font-mono text-[#9CA3AF] select-none">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-[#10B981]">
            <CheckCircle2 className="w-3 h-3" />
            <span>Monaco Ready</span>
          </span>
          <span className="text-[#263833]">|</span>
          <span>
            Ln {cursorPos.line}, Col {cursorPos.column}
          </span>
          <span className="text-[#263833]">|</span>
          <span>{code.length} chars</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[#F59E0B] font-semibold">{langDef.label}</span>
          <span className="text-[#263833]">|</span>
          <span>UTF-8</span>
          <span className="text-[#263833]">|</span>
          <span>Spaces: {settings.tabSize}</span>
        </div>
      </div>
    </div>
  );
}
