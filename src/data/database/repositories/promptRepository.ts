/**
 * 提示词仓库
 */
import { Prompt } from '../types/prompt';
import { dbOperations } from '../core/operations';
import { DB_CONFIG } from '../config';
import { encryptPrompt, decryptPrompt, decryptPrompts } from '@/lib/promptEncryptionManager';

const { MAIN } = DB_CONFIG.NAMES;
const { PROMPTS } = DB_CONFIG.STORES.MAIN;

/**
 * 添加提示词
 * @param prompt 提示词
 * @returns 添加后的提示词
 */
export const addPrompt = async (prompt: Omit<Prompt, 'id'>): Promise<Prompt> => {
  // 加密提示词内容（本地存储用）
  const encryptedPrompt = await encryptPrompt(prompt) as Omit<Prompt, 'id'>;

  // 使用本地存储
  return dbOperations.add<Prompt>(MAIN, PROMPTS, encryptedPrompt);
};

/**
 * 获取所有提示词
 * @param decryptContents 是否解密内容
 * @returns 所有提示词
 */
export const getAllPrompts = async (decryptContents: boolean = false): Promise<Prompt[]> => {
  // 使用本地存储
  const prompts = await dbOperations.getAll<Prompt>(MAIN, PROMPTS);

  // 按更新日期排序，最新的在前面
  const sortedPrompts = prompts.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  // 如果需要解密内容
  if (decryptContents) {
    return await decryptPrompts(sortedPrompts);
  }

  return sortedPrompts;
};



/**
 * 根据类型获取提示词
 * @param type 提示词类型
 * @param decryptContents 是否解密内容
 * @returns 指定类型的提示词
 */
export const getPromptsByType = async (type: Prompt['type'], decryptContents: boolean = false): Promise<Prompt[]> => {
  // 使用本地存储
  const prompts = await dbOperations.getAll<Prompt>(MAIN, PROMPTS);
  const filteredPrompts = prompts.filter(prompt => prompt.type === type);

  // 如果需要解密内容
  if (decryptContents) {
    return await decryptPrompts(filteredPrompts);
  }

  return filteredPrompts;
};

/**
 * 根据ID获取提示词
 * @param id 提示词ID
 * @param decryptContent 是否解密内容
 * @returns 提示词或null
 */
export const getPromptById = async (id: string, decryptContent: boolean = false): Promise<Prompt | null> => {
  // 使用本地存储
  const prompt = await dbOperations.getById<Prompt>(MAIN, PROMPTS, id);

  // 如果找不到提示词
  if (!prompt) return null;

  // 如果需要解密内容
  if (decryptContent) {
    return await decryptPrompt(prompt);
  }

  return prompt;
};

/**
 * 更新提示词
 * @param prompt 提示词
 * @returns 更新后的提示词
 */
export const updatePrompt = async (prompt: Prompt): Promise<Prompt> => {
  if (!prompt.id) throw new Error('Prompt ID is required');

  // 加密提示词内容（本地存储用）
  const encryptedPrompt = await encryptPrompt(prompt) as Prompt;

  // 使用本地存储
  return dbOperations.update<Prompt>(MAIN, PROMPTS, encryptedPrompt);
};

/**
 * 删除提示词
 * @param id 提示词ID
 */
export const deletePrompt = async (id: string): Promise<void> => {
  // 使用本地存储
  return dbOperations.remove(MAIN, PROMPTS, id);
};

/**
 * 获取当前用户的提示词
 * @param decryptContents 是否解密内容
 * @returns 当前用户的提示词
 */
export const getUserPrompts = async (decryptContents: boolean = false): Promise<Prompt[]> => {
  return getAllPrompts(decryptContents);
};

/**
 * 获取当前用户指定类型的提示词
 * @param type 提示词类型
 * @param decryptContents 是否解密内容
 * @returns 当前用户指定类型的提示词
 */
export const getUserPromptsByType = async (type: Prompt['type'], decryptContents: boolean = false): Promise<Prompt[]> => {
  return getPromptsByType(type, decryptContents);
};

/**
 * 检查提示词是否属于当前用户
 * @param promptId 提示词ID
 * @returns 是否属于当前用户
 */
export const isUserPrompt = async (promptId: string): Promise<boolean> => {
  // 本地存储中所有提示词都属于当前用户
  return true;
};

/**
 * 获取AI界面下拉菜单中的提示词
 * @param type 提示词类型
 * @param decryptContents 是否解密内容
 * @returns 用户可用的提示词
 */
export const getAIInterfacePromptsByType = async (type: Prompt['type'], decryptContents: boolean = false): Promise<Prompt[]> => {
  // 使用本地存储
  const prompts = await dbOperations.getAll<Prompt>(MAIN, PROMPTS);
  // 严格过滤确保只返回指定类型的提示词
  const filteredPrompts = prompts.filter(prompt => prompt.type === type);

  // 如果需要解密内容
  if (decryptContents) {
    return await decryptPrompts(filteredPrompts);
  }

  return filteredPrompts;
};
