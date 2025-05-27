/**
 * 提示词类型定义
 */

// 提示词类型
export interface Prompt {
  id?: string; // 统一使用字符串ID
  title: string;
  type: 'ai_writing' | 'ai_polishing' | 'ai_analysis' | 'worldbuilding' | 'character' | 'plot' | 'introduction' | 'outline' | 'detailed_outline' | 'book_tool';
  content: string;
  description?: string;
  examples?: string[] | any[]; // 支持字符串数组和JSONB
  createdAt: Date;
  updatedAt: Date;
}

// 提示词类型常量
export const PROMPT_TYPES = {
  AI_WRITING: 'ai_writing',
  AI_POLISHING: 'ai_polishing',
  AI_ANALYSIS: 'ai_analysis',
  WORLDBUILDING: 'worldbuilding',
  CHARACTER: 'character',
  PLOT: 'plot',
  INTRODUCTION: 'introduction',
  OUTLINE: 'outline',
  DETAILED_OUTLINE: 'detailed_outline',
  BOOK_TOOL: 'book_tool'
} as const;

// 提示词类型标签
export const PROMPT_TYPE_LABELS = {
  [PROMPT_TYPES.AI_WRITING]: 'AI写作',
  [PROMPT_TYPES.AI_POLISHING]: 'AI润色',
  [PROMPT_TYPES.AI_ANALYSIS]: 'AI分析',
  [PROMPT_TYPES.WORLDBUILDING]: '世界观',
  [PROMPT_TYPES.CHARACTER]: '角色',
  [PROMPT_TYPES.PLOT]: '情节',
  [PROMPT_TYPES.INTRODUCTION]: '导语',
  [PROMPT_TYPES.OUTLINE]: '大纲',
  [PROMPT_TYPES.DETAILED_OUTLINE]: '细纲',
  [PROMPT_TYPES.BOOK_TOOL]: '一键拆书'
} as const;
