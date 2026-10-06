/**
 * Nexus Code Monaco Editor Theme — Purple & Amber Edition
 *
 * Implements the approved visual system:
 * - Background: #08051A (Deep near-black purple)
 * - Surface / Sidebar: #0E0B28
 * - Primary Purple: #7C3AED / #A855F7
 * - Secondary Amber: #F59E0B / #FBBF24
 * - Emerald Accents: #10B981 / #34D399 (for strings & success)
 * - Text: #F8FAFC
 * - Muted: #94A3B8
 * - Border: #241D4D
 */

import type { editor } from 'monaco-editor';

export const NEXUS_CODE_THEME_NAME = 'nexus-code-dark';

export const nexusCodeMonacoTheme: editor.IStandaloneThemeData = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: '', foreground: 'F8FAFC', background: '08051A' },
    { token: 'comment', foreground: '64748B', fontStyle: 'italic' },
    { token: 'keyword', foreground: 'A855F7', fontStyle: 'bold' },
    { token: 'keyword.control', foreground: 'A855F7', fontStyle: 'bold' },
    { token: 'keyword.operator', foreground: 'FBBF24' },
    { token: 'string', foreground: '34D399' },
    { token: 'string.escape', foreground: 'FBBF24' },
    { token: 'number', foreground: 'F59E0B' },
    { token: 'number.hex', foreground: 'FBBF24' },
    { token: 'type', foreground: 'FBBF24', fontStyle: 'bold' },
    { token: 'type.identifier', foreground: 'FBBF24' },
    { token: 'class', foreground: 'FBBF24', fontStyle: 'bold' },
    { token: 'function', foreground: 'C084FC', fontStyle: 'bold' },
    { token: 'identifier', foreground: 'F8FAFC' },
    { token: 'delimiter', foreground: '94A3B8' },
    { token: 'delimiter.bracket', foreground: 'F59E0B' },
    { token: 'tag', foreground: 'A855F7' },
    { token: 'attribute.name', foreground: 'FBBF24' },
    { token: 'attribute.value', foreground: '34D399' },
    { token: 'variable', foreground: 'F8FAFC' },
    { token: 'variable.predefined', foreground: 'F59E0B' },
  ],
  colors: {
    // Editor Surface
    'editor.background': '#08051A',
    'editor.foreground': '#F8FAFC',
    'editor.lineHighlightBackground': '#15103A88',
    'editor.lineHighlightBorder': '#241D4D55',
    'editor.selectionBackground': '#7C3AED44',
    'editor.inactiveSelectionBackground': '#7C3AED22',
    'editor.selectionHighlightBackground': '#F59E0B22',

    // Gutter & Line Numbers
    'editorGutter.background': '#08051A',
    'editorLineNumber.foreground': '#64748B88',
    'editorLineNumber.activeForeground': '#F59E0B',

    // Cursor
    'editorCursor.foreground': '#F59E0B',

    // Indentation Guides
    'editorIndentGuide.background': '#241D4D66',
    'editorIndentGuide.activeBackground': '#7C3AED88',

    // Brackets
    'editorBracketMatch.background': '#7C3AED33',
    'editorBracketMatch.border': '#F59E0B',

    // Widgets & Overlays
    'editorWidget.background': '#0E0B28',
    'editorWidget.border': '#241D4D',
    'editorSuggestWidget.background': '#0E0B28',
    'editorSuggestWidget.border': '#241D4D',
    'editorSuggestWidget.foreground': '#F8FAFC',
    'editorSuggestWidget.selectedBackground': '#1C1548',
    'editorSuggestWidget.highlightForeground': '#F59E0B',

    // Scrollbar
    'scrollbarSlider.background': '#241D4D66',
    'scrollbarSlider.hoverBackground': '#7C3AED88',
    'scrollbarSlider.activeBackground': '#F59E0B88',

    // Find Widget
    'editor.findMatchBackground': '#7C3AED66',
    'editor.findMatchHighlightBackground': '#F59E0B44',

    // Errors & Warnings
    'editorError.foreground': '#EF4444',
    'editorWarning.foreground': '#F59E0B',
    'editorInfo.foreground': '#A855F7',
  },
};
