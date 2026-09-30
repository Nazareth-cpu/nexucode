/**
 * Nexus Code Dark Theme for Monaco Editor (Phase 4)
 *
 * Implements the platform design tokens:
 * - Background: #07110F
 * - Surface: #0D1A17
 * - Secondary Surface: #12221E
 * - Primary Amber: #F59E0B
 * - Bright Amber: #FBBF24
 * - Secondary Emerald: #10B981
 * - Dark Emerald: #047857
 * - Text: #F8FAFC
 * - Muted: #9CA3AF
 * - Border: #263833
 * - Error: #EF4444
 */

import type { editor } from 'monaco-editor';

export const NEXUS_CODE_THEME_NAME = 'nexus-code-dark';

export const nexusCodeMonacoTheme: editor.IStandaloneThemeData = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: '', foreground: 'F8FAFC', background: '07110F' },
    { token: 'comment', foreground: '6B7280', fontStyle: 'italic' },
    { token: 'keyword', foreground: 'F59E0B', fontStyle: 'bold' },
    { token: 'keyword.control', foreground: 'F59E0B', fontStyle: 'bold' },
    { token: 'keyword.operator', foreground: 'FBBF24' },
    { token: 'string', foreground: '10B981' },
    { token: 'string.escape', foreground: '34D399' },
    { token: 'number', foreground: '10B981' },
    { token: 'number.hex', foreground: '10B981' },
    { token: 'type', foreground: 'FBBF24', fontStyle: 'bold' },
    { token: 'type.identifier', foreground: 'FBBF24' },
    { token: 'class', foreground: 'FBBF24', fontStyle: 'bold' },
    { token: 'function', foreground: 'F8FAFC', fontStyle: 'bold' },
    { token: 'identifier', foreground: 'F8FAFC' },
    { token: 'delimiter', foreground: '9CA3AF' },
    { token: 'delimiter.bracket', foreground: 'F59E0B' },
    { token: 'tag', foreground: 'F59E0B' },
    { token: 'attribute.name', foreground: 'FBBF24' },
    { token: 'attribute.value', foreground: '10B981' },
    { token: 'variable', foreground: 'F8FAFC' },
    { token: 'variable.predefined', foreground: 'F59E0B' },
  ],
  colors: {
    // Editor Surface
    'editor.background': '#07110F',
    'editor.foreground': '#F8FAFC',
    'editor.lineHighlightBackground': '#12221E55',
    'editor.lineHighlightBorder': '#26383344',
    'editor.selectionBackground': '#F59E0B33',
    'editor.inactiveSelectionBackground': '#F59E0B1A',
    'editor.selectionHighlightBackground': '#10B98122',
    
    // Gutter & Line Numbers
    'editorGutter.background': '#07110F',
    'editorLineNumber.foreground': '#9CA3AF55',
    'editorLineNumber.activeForeground': '#F59E0B',
    
    // Cursor
    'editorCursor.foreground': '#F59E0B',
    
    // Indentation Guides
    'editorIndentGuide.background': '#26383366',
    'editorIndentGuide.activeBackground': '#F59E0B88',
    
    // Brackets
    'editorBracketMatch.background': '#10B98126',
    'editorBracketMatch.border': '#10B981',
    
    // Widgets & Overlays
    'editorWidget.background': '#0D1A17',
    'editorWidget.border': '#263833',
    'editorSuggestWidget.background': '#0D1A17',
    'editorSuggestWidget.border': '#263833',
    'editorSuggestWidget.foreground': '#F8FAFC',
    'editorSuggestWidget.selectedBackground': '#12221E',
    'editorSuggestWidget.highlightForeground': '#F59E0B',
    
    // Scrollbar
    'scrollbarSlider.background': '#26383366',
    'scrollbarSlider.hoverBackground': '#263833AA',
    'scrollbarSlider.activeBackground': '#F59E0B88',
    
    // Find Widget
    'editor.findMatchBackground': '#F59E0B55',
    'editor.findMatchHighlightBackground': '#F59E0B22',
    
    // Errors & Warnings
    'editorError.foreground': '#EF4444',
    'editorWarning.foreground': '#F59E0B',
    'editorInfo.foreground': '#10B981',
  },
};
