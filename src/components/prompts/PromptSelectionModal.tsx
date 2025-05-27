/**
 * 通用提示词选择模态窗口组件
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Modal } from '@/components/common/modals';
import { Prompt } from '@/data';
import { getAIInterfacePromptsByType } from '@/data';
import { PROMPT_TYPE_LABELS } from '@/data/database/types/prompt';

interface PromptSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (prompt: Prompt) => void;
  promptType: 'ai_writing' | 'ai_polishing' | 'ai_analysis';
  initialSelectedId?: string;
}

// 吉卜力风格棕色系颜色
const GHIBLI_COLORS = {
  brown: {
    primary: '#6d5c4d',      // 主色调
    light: '#8a7c70',        // 浅色
    dark: '#4b3b2a',         // 深色
    bg: '#f7f2ea',           // 背景色
    selected: '#e6dfd0',     // 选中背景色
    hover: '#f0e9df',        // 悬停背景色
    border: '#6d5c4d'        // 边框色
  }
};

// 提示词类型颜色映射
const promptTypeColors = {
  'ai_writing': 'bg-[#5a9d6b] text-[#5a9d6b]',
  'ai_polishing': 'bg-[#7D85CC] text-[#7D85CC]',
  'ai_analysis': 'bg-[#9C6FE0] text-[#9C6FE0]',
  'worldbuilding': 'bg-[#E0976F] text-[#E0976F]',
  'character': 'bg-[#E07F7F] text-[#E07F7F]',
  'plot': 'bg-[#8BAD97] text-[#8BAD97]',
  'introduction': 'bg-[#71A6D2] text-[#71A6D2]',
  'outline': 'bg-[#7D85CC] text-[#7D85CC]',
  'detailed_outline': 'bg-[#9C6FE0] text-[#9C6FE0]',
  'book_tool': 'bg-[#E0C56F] text-[#E0C56F]'
};

// 提示词类型图标映射
const promptTypeIcons = {
  'ai_writing': 'edit_note',
  'ai_polishing': 'auto_fix_high',
  'ai_analysis': 'analytics',
  'worldbuilding': 'public',
  'character': 'person',
  'plot': 'timeline',
  'introduction': 'description',
  'outline': 'format_list_bulleted',
  'detailed_outline': 'format_list_numbered',
  'book_tool': 'book'
};

/**
 * 通用提示词选择模态窗口组件
 */
export const PromptSelectionModal: React.FC<PromptSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  promptType,
  initialSelectedId
}) => {
  // 状态
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [filteredPrompts, setFilteredPrompts] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);

  // 滚动容器引用
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 每页加载的提示词数量
  const PAGE_SIZE = 20;

  // 加载提示词
  const loadPrompts = useCallback(async () => {
    if (!isOpen) return;

    setIsLoading(true);
    setError('');

    try {
      // 加载用户自己的提示词
      const loadedPrompts = await getAIInterfacePromptsByType(promptType, false);
      setPrompts(loadedPrompts);

      // 如果有初始选中的提示词ID，设置选中状态
      if (initialSelectedId) {
        const selected = loadedPrompts.find(p => p.id === initialSelectedId);
        if (selected) {
          setSelectedPrompt(selected);
        }
      }
    } catch (error) {
      console.error('加载提示词失败:', error);
      setError('加载提示词失败');
    } finally {
      setIsLoading(false);
    }
  }, [isOpen, promptType, initialSelectedId]);

  // 过滤和分页提示词
  useEffect(() => {
    // 根据搜索词过滤
    let filtered = prompts;
    if (searchTerm) {
      filtered = prompts.filter(prompt =>
        prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (prompt.description && prompt.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // 应用分页
    setFilteredPrompts(filtered.slice(0, page * PAGE_SIZE));
    setHasMore(filtered.length > page * PAGE_SIZE);
  }, [prompts, searchTerm, page]);

  // 初始加载
  useEffect(() => {
    if (isOpen) {
      loadPrompts();
      setPage(1); // 重置分页
    }
  }, [isOpen, loadPrompts]);

  // 处理滚动加载更多
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current || !hasMore || isLoading) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;

    // 当滚动到底部附近时加载更多
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      setPage(prev => prev + 1);
    }
  }, [hasMore, isLoading]);

  // 添加滚动监听
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // 处理提示词点击
  const handlePromptClick = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
  };

  // 处理提示词选择
  const handlePromptSelect = () => {
    if (selectedPrompt) {
      onSelect(selectedPrompt);
      onClose();
    }
  };



  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6d5c4d] to-[#4b3b2a] flex items-center justify-center mr-3 text-white shadow-md">
            <span className="material-icons text-lg">{promptTypeIcons[promptType]}</span>
          </div>
          <span style={{fontFamily: "'Ma Shan Zheng', cursive"}} className="text-xl text-text-dark relative">
            选择{PROMPT_TYPE_LABELS[promptType]}提示词
            <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-[#6d5c4d]/30 via-[#6d5c4d]/60 to-[#6d5c4d]/30 rounded-full"></span>
          </span>
        </div>
      }
      footer={
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[#8a7c70] text-gray-700 hover:bg-gray-50 transition-all duration-200 shadow-sm"
          >
            取消
          </button>
          <button
            onClick={handlePromptSelect}
            disabled={!selectedPrompt}
            className={`px-4 py-2 rounded-lg text-white transition-all duration-200 ${
              selectedPrompt
                ? 'bg-gradient-to-br from-[#6d5c4d] to-[#4b3b2a] hover:shadow-md'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            <span className="flex items-center">
              <span className="material-icons text-sm mr-1">check</span>
              选择提示词
            </span>
          </button>
        </div>
      }
      maxWidth="max-w-2xl"
    >
      <div className="h-[500px] flex flex-col bg-[#fcfcfa] rounded-lg shadow-inner">
        {/* 搜索区域 */}
        <div className="mb-4 p-3 flex items-center justify-end bg-[#f7f6f1] rounded-lg border border-[#8a7c70]/30 shadow-sm">
          {/* 搜索框 - 更精美的设计 */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索提示词..."
              className="pl-8 pr-3 py-1.5 bg-white border border-[#8a7c70] rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-[#6d5c4d] w-48 shadow-sm transition-all duration-200"
            />
            <span className="material-icons text-sm absolute left-2 top-1.5 text-[#6d5c4d]">search</span>
          </div>
        </div>

        {/* 提示词列表 */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto pr-1 custom-scrollbar"
        >
          {isLoading && page === 1 ? (
            <div className="h-full flex items-center justify-center">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full border-2 border-t-transparent border-[#6d5c4d] animate-spin mb-3"></div>
                <span className="text-[#6d5c4d]">加载中...</span>
              </div>
            </div>
          ) : error ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-3 mx-auto">
                  <span className="material-icons text-red-500 text-2xl">error_outline</span>
                </div>
                <span className="text-red-500 block">{error}</span>
              </div>
            </div>
          ) : filteredPrompts.length === 0 ? (
            <div className="h-full flex items-center justify-center flex-col">
              <div className="w-20 h-20 bg-[#f7f2ea] rounded-full flex items-center justify-center mb-4">
                <span className="material-icons text-4xl text-[#8a7c70]">lightbulb</span>
              </div>
              <h3 className="text-lg font-medium text-text-dark mb-2 font-ma-shan">
                {searchTerm ? "没有找到匹配的提示词" : "暂无提示词"}
              </h3>
              <p className="text-text-medium text-center max-w-xs mb-6">
                {searchTerm ? "尝试使用其他关键词搜索" : "创建你的第一个提示词，开始AI创作之旅"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredPrompts.map(prompt => (
                <div
                  key={prompt.id}
                  className={`group p-3 rounded-lg transition-all duration-200 cursor-pointer relative ${
                    selectedPrompt?.id === prompt.id
                      ? 'bg-[#e6dfd0] border-l-4 border-[#6d5c4d] shadow-md transform scale-[1.01]' // 选中项的样式，使用棕色系
                      : 'bg-[#f7f2ea] hover:bg-[#f0e9df] border-l-4 border-transparent hover:shadow-sm' // 默认样式，使用棕色系
                  }`}
                  onClick={() => handlePromptClick(prompt)}
                >
                  <div className="flex items-start">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#6d5c4d] to-[#4b3b2a] flex-shrink-0 flex items-center justify-center mr-3 text-white shadow-sm">
                      <span className="material-icons text-sm">{promptTypeIcons[promptType]}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-800 truncate">
                        {prompt.title}
                      </div>

                      {prompt.description && (
                        <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {prompt.description}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 添加选中指示器 */}
                  {selectedPrompt?.id === prompt.id && (
                    <div className="absolute top-2 right-2 text-[#6d5c4d]">
                      <span className="material-icons text-sm">check_circle</span>
                    </div>
                  )}
                </div>
              ))}

              {/* 加载更多指示器 */}
              {isLoading && page > 1 && (
                <div className="py-3 text-center">
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 rounded-full border-2 border-t-transparent border-[#6d5c4d] animate-spin mr-2"></div>
                    <span className="text-[#6d5c4d]">加载更多...</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default PromptSelectionModal;
