'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createPortal } from 'react-dom';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import BackButton from '@/components/BackButton';
import { Prompt, getPromptsByType, deletePrompt, addPrompt, updatePrompt, isUserPrompt, getUserPromptsByType } from '@/data';
import { PromptDetailView } from '@/components/prompts';
import { Modal } from '@/components/common/modals';

// 提示词类型映射
const promptTypeMap = {
  'ai_writing': { label: 'AI写作', color: 'bg-[#5a9d6b] text-white', icon: 'create', group: 'novel', gradient: 'from-[#5a9d6b] to-[#4a8d5b]' },
  'ai_polishing': { label: 'AI润色', color: 'bg-[#7D85CC] text-white', icon: 'auto_fix_high', group: 'novel', gradient: 'from-[#7D85CC] to-[#6F9CE0]' },
  'ai_analysis': { label: 'AI分析', color: 'bg-[#9C6FE0] text-white', icon: 'analytics', group: 'novel', gradient: 'from-[#9C6FE0] to-[#7D85CC]' },
  'worldbuilding': { label: '世界观', color: 'bg-[#E06F9C] text-white', icon: 'public', group: 'creative', gradient: 'from-[#E06F9C] to-[#E0976F]' },
  'character': { label: '角色', color: 'bg-[#9C6FE0] text-white', icon: 'person', group: 'creative', gradient: 'from-[#9C6FE0] to-[#7D85CC]' },
  'plot': { label: '情节', color: 'bg-[#6F9CE0] text-white', icon: 'timeline', group: 'creative', gradient: 'from-[#6F9CE0] to-[#9C6FE0]' },
  'introduction': { label: '导语', color: 'bg-[#7D85CC] text-white', icon: 'format_quote', group: 'creative', gradient: 'from-[#7D85CC] to-[#6F9CE0]' },
  'outline': { label: '大纲', color: 'bg-[#E0976F] text-white', icon: 'format_list_bulleted', group: 'creative', gradient: 'from-[#E0976F] to-[#E0C56F]' },
  'detailed_outline': { label: '细纲', color: 'bg-[#E0C56F] text-white', icon: 'subject', group: 'creative', gradient: 'from-[#E0C56F] to-[#E0976F]' },
  'book_tool': { label: '一键拆书', color: 'bg-[#E0976F] text-white', icon: 'auto_stories', group: 'tools', gradient: 'from-[#E0976F] to-[#E0C56F]' }
} as const;

// 提示词类型
type PromptType = keyof typeof promptTypeMap;

// 验证提示词类型是否有效
const isValidPromptType = (type: any): type is PromptType => {
  return Object.keys(promptTypeMap).includes(type as string);
};

// 将类型颜色转换为胶带颜色
const getTypeColor = (type: string): string => {
  const colorText = promptTypeMap[type as keyof typeof promptTypeMap]?.color.split(' ')[1] || 'text-white';
  // 从 text-white 提取颜色代码
  return colorText.replace('text-', 'rgba(').replace(/\]/, ', 0.7)');
};

// 格式化日期显示
const formatDate = (date: Date | string | number) => {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// 提示词模板
const promptTemplates = {
  'ai_writing': '',
  'ai_polishing': '',
  'ai_analysis': '',
  'worldbuilding': '',
  'character': '',
  'plot': '',
  'introduction': '',
  'outline': '',
  'detailed_outline': '',
  'book_tool': `你是一位专业的文学分析师，擅长分析和拆解文学作品。现在，你需要对用户提供的小说章节进行深度分析和拆解。

请按照以下结构进行分析：

1. 内容概述：
   - 简要总结所提供章节的主要内容
   - 识别核心情节和关键场景

2. 人物分析：
   - 列出章节中出现的主要和次要人物
   - 分析人物性格、动机和行为模式
   - 探讨人物关系和互动

3. 情节结构：
   - 分析章节的情节架构和节奏
   - 指出高潮和转折点
   - 评估情节的合理性和吸引力

4. 主题探讨：
   - 识别章节中的主要主题和潜在寓意
   - 分析作者如何通过情节和人物表达这些主题

5. 写作技巧：
   - 评价作者的叙事手法和语言风格
   - 分析对话、描写和意象的使用
   - 指出特别有效或需要改进的写作元素

6. 改进建议：
   - 提供具体的改进建议，包括情节发展、人物塑造和写作技巧
   - 指出可能的情节漏洞或不一致之处
   - 建议如何增强读者体验

注意：你的分析应该尊重原文的创作意图，在提供改进建议时保持建设性和支持性的态度。`
};

// 截断内容 - 当前未使用，但保留以备将来使用
const truncateContent = (content: string, length: number = 120) => {
  if (!content) return '';
  if (content.length <= length) return content;
  return content.slice(0, length) + '...';
};

export default function PromptTypePage() {
  const router = useRouter();
  const params = useParams();
  const promptType = (params?.type as string) as PromptType;

  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<{
    title: string;
    type: PromptType;
    content: string;
    description: string;
  }>({
    title: '',
    type: promptType,
    content: promptTemplates[promptType as keyof typeof promptTemplates] || '',
    description: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState<Prompt | null>(null);



  // 卡片描述文本
  const descriptions = {
    'introduction': '创建引人入胜的开篇导语，为你的故事设定基调和氛围',
    'outline': '快速生成故事的主要框架和结构，帮助你规划创作方向',
    'detailed_outline': '基于大纲深入展开，为每个章节创建详细的内容规划',
    'character': '创建丰富多彩的角色，赋予他们独特的个性和背景故事',
    'worldbuilding': '构建完整的世界观，包括历史、地理、文化和社会结构',
    'plot': '设计引人入胜的情节，包括冲突、转折和高潮',
    'ai_analysis': '使用AI分析小说的结构、人物、情节和主题，提供深入见解',
    'ai_writing': '使用AI创作高质量的小说内容，生成各类风格的文学作品',
    'ai_polishing': '使用AI润色和优化已有文本，提升其文学性、可读性和吸引力',
    'book_tool': '一键上传TXT文件，AI智能分析文本内容，快速提取关键信息和创作灵感'
  };
  // 加载提示词数据
  useEffect(() => {
    const loadPrompts = async () => {
      try {
        setIsLoading(true);
        if (!promptType || !promptTypeMap[promptType as keyof typeof promptTypeMap]) {
          router.push('/prompts');
          return;
        }

        // 加载用户提示词
        const loadedPrompts = await getUserPromptsByType(promptType);
        setPrompts(loadedPrompts);
      } catch (error) {
        console.error('加载提示词失败:', error);
        setPrompts([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadPrompts();
  }, [promptType, router]);

  // 过滤用户提示词
  const filteredPrompts = prompts.filter(prompt => {
    const matchesSearch =
      prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prompt.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (prompt.description && prompt.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });


  // 处理输入变更
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // 重置表单数据
  const resetFormData = () => {
    setFormData({
      title: '',
      type: promptType,
      content: promptTemplates[promptType as keyof typeof promptTemplates] || '',
      description: ''
    });
  };

  // 打开创建提示词弹窗
  const openCreateModal = () => {
    resetFormData();
    setShowCreateModal(true);
  };

  // 打开删除提示词弹窗
  const openDeleteModal = (prompt: Prompt, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setSelectedPrompt(prompt);
    setShowDeleteModal(true);
  };

  // 处理提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const now = new Date();
      const promptData = {
        ...formData,
        createdAt: now,
        updatedAt: now,
        examples: [] // 保持兼容性，设为空数组
      };

      const newPrompt = await addPrompt(promptData);
      setPrompts(prev => [newPrompt, ...prev]);
      setShowCreateModal(false);

      // 刷新列表
      if (isValidPromptType(promptType)) {
        const updatedPrompts = await getPromptsByType(promptType);
        setPrompts(updatedPrompts);
      }
    } catch (error) {
      console.error('创建提示词失败:', error);
      alert('创建提示词失败，请重试');
    }
  };

  // 处理删除
  const handleDelete = async () => {
    if (!selectedPrompt || !selectedPrompt.id) return;

    try {
      await deletePrompt(selectedPrompt.id);
      setPrompts(prev => prev.filter(p => p.id !== selectedPrompt.id));
      setShowDeleteModal(false);
    } catch (error) {
      console.error('删除提示词失败:', error);
      alert('删除提示词失败，请重试');
    }
  };
  // 打开详情弹窗
  const openDetailModal = async (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    setShowDetailModal(true);

    // 直接进入编辑模式，创建一个深拷贝以避免直接修改原对象
    setIsEditing(true);
    setEditedPrompt({...prompt});
  };

  // 高亮搜索关键词
  const highlightMatch = (text: string, term: string) => {
    if (!term || !text) return text;
    const parts = text.split(new RegExp(`(${term})`, 'gi'));
    return parts.map((part: string, i: number) =>
      part.toLowerCase() === term.toLowerCase() ? <mark key={i} className="bg-yellow-100 px-1 rounded">{part}</mark> : part
    );
  };
  return (
    <div className="flex h-screen bg-bg-color animate-fadeIn overflow-hidden">
      {/* 背景网格 */}
      <div className="grid-background"></div>

      {/* 装饰元素，在小屏幕上减少数量 */}
      <div className="dot hidden md:block" style={{ top: "120px", left: "15%" }}></div>
      <div className="dot" style={{ bottom: "80px", right: "20%" }}></div>
      <div className="dot hidden md:block" style={{ top: "30%", right: "25%" }}></div>
      <div className="dot hidden md:block" style={{ bottom: "40%", left: "30%" }}></div>

      <svg className="wave hidden md:block" style={{ bottom: "20px", left: "10%" }} width="100" height="20" viewBox="0 0 100 20">
        <path d="M0,10 Q25,0 50,10 T100,10" fill="none" stroke="var(--accent-brown)" strokeWidth="2" />
      </svg>

      <Sidebar activeMenu="prompts" />
      <div className="flex-1 flex flex-col overflow-hidden main-content-area">
        <TopBar
          title={promptType === 'book_tool' ? '一键拆书' : promptTypeMap[promptType as keyof typeof promptTypeMap]?.label || '提示词仓库'}
          showBackButton={true}
          actions={
            <button
              className="ghibli-button outline text-sm"
              onClick={openCreateModal}
            >
              <span className="material-icons mr-1 text-sm">add</span>
              创建提示词
            </button>
          }
        />

      <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 flex flex-col">
        <div className="max-w-full mx-auto px-0 sm:px-4 lg:container lg:mx-auto flex flex-col flex-1">
          {/* 提示词列表 */}
          <div className="flex-shrink-0 mb-6">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md mr-4 ${
                  promptTypeMap[promptType as keyof typeof promptTypeMap]?.color.split(' ')[0]
                }`}>
                  <span className={`material-icons text-xl ${
                    promptTypeMap[promptType as keyof typeof promptTypeMap]?.color.split(' ')[1]
                  }`}>{promptTypeMap[promptType as keyof typeof promptTypeMap]?.icon}</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-text-dark font-ma-shan">
                    {promptTypeMap[promptType as keyof typeof promptTypeMap]?.label}
                    <span className="ml-2 text-sm font-normal text-text-medium">({filteredPrompts.length})</span>
                  </h3>
                  <p className="text-sm text-text-medium mt-1">
                    {descriptions[promptType as keyof typeof descriptions]}
                  </p>
                </div>
              </div>
            </div>

            <div className="relative mb-6 flex flex-wrap items-center gap-4">
              <div className="flex-shrink-0 w-64">
                <div className="relative w-full">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-icons text-text-light">search</span>
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-[rgba(120,180,140,0.3)] rounded-xl bg-card-color focus:outline-none focus:ring-2 focus:ring-[rgba(120,180,140,0.5)] shadow-sm text-text-dark"
                    placeholder="搜索提示词..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

            </div>
          </div>
          {/* 提示词内容区域 */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 h-full">
              {isLoading ? (
                // 加载状态
                <div className="col-span-full flex justify-center p-12">
                  <div className="w-3 h-3 bg-[#7D85CC] rounded-full animate-pulse mr-1"></div>
                  <div className="w-3 h-3 bg-[#E0976F] rounded-full animate-pulse delay-150 mr-1"></div>
                  <div className="w-3 h-3 bg-[#9C6FE0] rounded-full animate-pulse delay-300"></div>
                </div>
              ) : filteredPrompts.length > 0 ? (
                <>
                  {/* 提示词列表 */}
                  {filteredPrompts.map(prompt => {
                  // 获取更新时间
                  const updatedAt = new Date(prompt.updatedAt);
                  const now = new Date();
                  const diffDays = Math.floor((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24));

                  // 格式化时间显示
                  let timeDisplay;
                  if (diffDays === 0) {
                    timeDisplay = '今天';
                  } else if (diffDays === 1) {
                    timeDisplay = '昨天';
                  } else if (diffDays < 7) {
                    timeDisplay = `${diffDays}天前`;
                  } else {
                    timeDisplay = updatedAt.toLocaleDateString();
                  }

                  const typeConfig = promptTypeMap[prompt.type as keyof typeof promptTypeMap] || {
                    label: '未知',
                    icon: 'help_outline',
                    color: 'text-gray-500',
                    description: '未定义的提示词类型'
                  };

                  // 获取对应的颜色
                  const colorText = typeConfig.color.split(' ')[1];
                  const bgColor = typeConfig.color.split(' ')[0];

                  // 提取颜色代码用于胶带
                  const tapeColor = colorText.replace('text-', 'rgba(').replace(/\]/, ', 0.7)');

                  return (
                    <div
                      key={prompt.id}
                      className="ghibli-card h-80 cursor-pointer animate-fadeIn"
                      onClick={() => openDetailModal(prompt)}
                    >
                      <div className="flex flex-col h-full">
                        {/* 顶部LOGO和标题在同一行 */}
                        <div className="flex items-center mb-4">
                          <div className={`w-12 h-12 rounded-full ${bgColor} flex items-center justify-center mr-3`}>
                            <span className={`material-icons text-xl ${colorText}`}>{typeConfig.icon}</span>
                          </div>
                          <h3 className="font-medium text-text-dark text-xl font-ma-shan">
                            {highlightMatch(prompt.title, searchTerm)}
                          </h3>
                        </div>

                        <p className="text-text-medium text-sm mb-6 line-clamp-3">
                          {prompt.description ? highlightMatch(prompt.description, searchTerm) : '无描述'}
                        </p>

                        <div className="mt-auto border-t border-[rgba(120,180,140,0.2)] w-full pt-3 px-4 flex justify-between items-center">
                          <div className="flex items-center text-xs text-text-light">
                            <span className="material-icons text-text-light text-sm mr-1">schedule</span>
                            <span>{timeDisplay}</span>
                          </div>
                          <div className="flex space-x-2">
                            <div className="flex items-center text-[#7D85CC]">
                              <span className="material-icons text-xs mr-1">person</span>
                              <span className="text-xs">我的</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="page-curl"></div>
                    </div>
                  );
                })}
                  </>
                ) : (
                  // 无提示词提示
                  <div className="col-span-full ghibli-card p-12 flex flex-col items-center justify-center h-full">
                    <div className="w-24 h-24 bg-[rgba(120,180,140,0.1)] rounded-full flex items-center justify-center mb-4 text-text-light">
                      <span className="material-icons text-4xl">search_off</span>
                    </div>
                    <h3 className="text-xl font-semibold text-text-dark mb-2 font-ma-shan">暂无提示词</h3>
                    <p className="text-text-medium text-center max-w-md mb-6">
                      {searchTerm
                        ? `没有找到包含"${searchTerm}"的提示词`
                        : `你尚未创建任何${promptTypeMap[promptType as keyof typeof promptTypeMap]?.label}类型的提示词，点击下方按钮创建第一个提示词。`}
                    </p>
                    <button
                      className="ghibli-button"
                      onClick={() => searchTerm ? setSearchTerm('') : openCreateModal()}
                    >
                      <span className="material-icons text-sm mr-2">{searchTerm ? 'clear' : 'add'}</span>
                      {searchTerm ? '清除搜索' : '创建提示词'}
                    </button>
                  </div>
                )
              }
              </div>
          </div>
        </div>
      </main>
      {/* 创建提示词弹窗 */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="创建新提示词"
        footer={
          <div className="flex justify-end space-x-3">
            <button
              type="submit"
              form="createPromptForm"
              className="ghibli-button text-sm py-2"
            >
              创建提示词
            </button>
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="ghibli-button outline text-sm py-2"
            >
              取消
            </button>
          </div>
        }
      >
        <div className="mb-6">
          <div className="ghibli-card p-6 animate-fadeIn relative">
            {/* 顶部胶带 */}
            <div className="tape" style={{ backgroundColor: "rgba(120, 180, 140, 0.7)" }}>
              <div className="tape-texture"></div>
            </div>

            <div className="mt-6 h-[500px] overflow-y-auto px-4">
              <form id="createPromptForm" onSubmit={handleSubmit} className="space-y-6 w-full max-w-2xl mx-auto">
                <div className="space-y-2">
                  <label htmlFor="title" className="block text-text-dark font-medium mb-2">提示词标题</label>
                  <input
                    id="title"
                    name="title"
                    type="text"
                    required
                    placeholder="输入提示词标题..."
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-xl border border-[rgba(120,180,140,0.3)] bg-white bg-opacity-70 focus:outline-none focus:ring-2 focus:ring-primary-green focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="type" className="block text-text-dark font-medium mb-2">提示词类型</label>
                  <div className="py-2 px-4 rounded-xl bg-white bg-opacity-70 border border-[rgba(120,180,140,0.3)]">
                    <div className="flex items-center">
                      <span className={`px-3 py-1 rounded-full text-xs ${promptTypeMap[promptType]?.color}`}>
                        <span className="material-icons text-xs mr-1 align-text-top">{promptTypeMap[promptType]?.icon}</span>
                        {promptTypeMap[promptType]?.label}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="content" className="block text-text-dark font-medium mb-2">提示词内容</label>
                  <textarea
                    id="content"
                    name="content"
                    required
                    placeholder="输入提示词内容..."
                    value={formData.content}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-[rgba(120,180,140,0.3)] bg-white bg-opacity-70 focus:outline-none focus:ring-2 focus:ring-primary-green focus:border-transparent min-h-[120px] overflow-y-auto break-words whitespace-pre-wrap"
                  ></textarea>
                </div>

                <div className="space-y-2">
                  <label htmlFor="description" className="block text-text-dark font-medium mb-2">提示词描述</label>
                  <textarea
                    id="description"
                    name="description"
                    placeholder="描述这个提示词的用途和使用场景..."
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-[rgba(120,180,140,0.3)] bg-white bg-opacity-70 focus:outline-none focus:ring-2 focus:ring-primary-green focus:border-transparent min-h-[120px]"
                  ></textarea>
                </div>
              </form>
            </div>

            {/* 翻页效果 */}
            <div className="page-curl"></div>
          </div>
        </div>
      </Modal>
      {/* 删除确认弹窗 */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="删除提示词"
        footer={
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-sm transition-colors shadow-sm"
            >
              确认删除
            </button>
            <button
              onClick={() => setShowDeleteModal(false)}
              className="ghibli-button outline text-sm py-2"
            >
              取消
            </button>
          </div>
        }
      >
        <div className="mb-6">
          <div className="ghibli-card p-6 animate-fadeIn relative">
            <div className="tape" style={{ backgroundColor: "rgba(224, 111, 111, 0.7)" }}>
              <div className="tape-texture"></div>
            </div>

            <div className="my-auto h-[300px] overflow-y-auto px-4">
              <div className="bg-red-50 rounded-xl p-6 mb-6 text-center w-full max-w-lg mx-auto">
                <span className="material-icons text-red-500 text-4xl mb-4">warning</span>
                <p className="text-center text-red-700 text-lg font-medium mb-2">确定要删除这个提示词吗？</p>
                <p className="text-center text-red-600 text-sm">此操作无法撤销</p>
              </div>
            </div>

            <div className="page-curl"></div>
          </div>
        </div>
      </Modal>
      {/* 详情/编辑弹窗 */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={selectedPrompt ? `编辑提示词: ${selectedPrompt.title}` : '编辑提示词'}
        footer={
          <div className="flex justify-between space-x-3">
            {/* 左侧按钮区域 */}
            <div></div>

            {/* 右侧按钮区域 */}
            <div className="flex space-x-3">
              <button
                onClick={async () => {
                  if (!editedPrompt || !editedPrompt.id || !selectedPrompt) {
                    console.error('无法保存提示词：', { editedPrompt, selectedPrompt });
                    alert('保存失败：提示词数据不完整');
                    return;
                  }
                  try {
                    console.log('保存提示词:', editedPrompt);
                    const updatedPrompt = {
                      ...editedPrompt,
                      type: selectedPrompt.type,
                      updatedAt: new Date()
                    };
                    await updatePrompt(updatedPrompt);
                    setSelectedPrompt(updatedPrompt);
                    setShowDetailModal(false);

                    // 刷新提示词列表
                    if (isValidPromptType(promptType)) {
                      const updatedPrompts = await getPromptsByType(promptType);
                      setPrompts(updatedPrompts);
                    }
                  } catch (error) {
                    console.error('更新提示词失败:', error);
                    alert('更新提示词失败，请重试');
                  }
                }}
                className="ghibli-button text-sm py-2"
              >
                保存
              </button>
              <button
                onClick={() => setShowDetailModal(false)}
                className="ghibli-button outline text-sm py-2"
              >
                取消
              </button>
            </div>
          </div>
        }
      >
        <div className="mb-6">
          <div className="ghibli-card p-6 animate-fadeIn relative">
            <div className="tape" style={{ backgroundColor: selectedPrompt ? getTypeColor(selectedPrompt.type) : "rgba(120, 180, 140, 0.7)" }}>
              <div className="tape-texture"></div>
            </div>

            <div className="mt-6 h-[500px] overflow-y-auto px-4">
              {selectedPrompt && (
                <div className="w-full max-w-2xl mx-auto">
                      <PromptDetailView
                    prompt={selectedPrompt}
                    isEditing={isEditing}
                    editedPrompt={editedPrompt || undefined}
                    handleInputChange={(e) => {
                      const { name, value } = e.target;
                      console.log(`Updating ${name} to:`, value);
                      setEditedPrompt(prev => prev ? { ...prev, [name]: value } : null);
                    }}
                    handleExampleChange={(index, value) => {
                      if (!editedPrompt) return;
                      const newExamples = [...(editedPrompt.examples || [])];
                      newExamples[index] = value;
                      setEditedPrompt({
                        ...editedPrompt,
                        examples: newExamples
                      });
                    }}
                    addExample={() => {
                      if (!editedPrompt) return;
                      setEditedPrompt({
                        ...editedPrompt,
                        examples: [...(editedPrompt.examples || []), '']
                      });
                    }}
                    removeExample={(index) => {
                      if (!editedPrompt) return;
                      const newExamples = [...(editedPrompt.examples || [])];
                      newExamples.splice(index, 1);
                      setEditedPrompt({
                        ...editedPrompt,
                        examples: newExamples
                      });
                    }}
                    onDelete={() => {
                      setShowDetailModal(false);
                      openDeleteModal(selectedPrompt);
                    }}
                    onEdit={() => {
                      setIsEditing(true);
                      setEditedPrompt({...selectedPrompt});
                    }}
                  />
                </div>
              )}
            </div>

            <div className="page-curl"></div>
          </div>
        </div>
      </Modal>
      </div>
    </div>
  );
}







