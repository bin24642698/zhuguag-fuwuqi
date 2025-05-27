'use client';

import React, { useState } from 'react';
import { Prompt } from '@/data';
import { promptTypeMap } from './PromptDetailContent';
import { PromptContentEditModal } from './PromptContentEditModal';

// 将类型颜色转换为胶带颜色
const getTypeColor = (type: string): string => {
  const colorClass = promptTypeMap[type as keyof typeof promptTypeMap]?.color.split(' ')[1] || 'text-[#7D85CC]';
  // 从 text-[#7D85CC] 提取 #7D85CC
  const colorHex = colorClass.match(/#[0-9A-Fa-f]{6}/)?.[0] || '#7D85CC';
  return colorHex.replace('#', 'rgba(') + ', 0.7)';
};

interface PromptDetailViewProps {
  prompt: Prompt;
  isEditing?: boolean; // 保留兼容性，但默认为true
  editedPrompt?: Prompt;
  handleInputChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleExampleChange?: (index: number, value: string) => void;
  addExample?: () => void;
  removeExample?: (index: number) => void;
  onSave?: () => void;
  onCancel?: () => void;
  onDelete?: () => void;
}

/**
 * 提示词详情视图组件 - 编辑模式
 */
export function PromptDetailView({
  prompt,
  isEditing = true, // 默认为编辑模式
  editedPrompt,
  handleInputChange,
  handleExampleChange,
  addExample,
  removeExample,
  onSave,
  onCancel,
  onDelete
}: PromptDetailViewProps) {
  // 状态
  const [isContentEditModalOpen, setIsContentEditModalOpen] = useState(false);

  // 提示词类型的信息
  const typeInfo = promptTypeMap[prompt.type as keyof typeof promptTypeMap];
  const typeColor = getTypeColor(prompt.type);

  // 格式化日期显示
  const formatDate = (date: Date | string | number) => {
    return new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // 处理内容变更
  const handleContentChange = (newContent: string) => {
    if (handleInputChange) {
      handleInputChange({
        target: {
          name: 'content',
          value: newContent
        }
      } as React.ChangeEvent<HTMLTextAreaElement>);
    }
  };

  // 始终使用编辑模式
  return (
      <div className="flex flex-col min-h-[500px]">
        <div className="flex-grow">
          <form className="space-y-6 h-full flex flex-col">
            {/* 提示词标题 */}
            <div>
              <label className="block text-text-dark font-medium mb-2">标题</label>
              <input
                type="text"
                name="title"
                className="w-full px-4 py-2 bg-white bg-opacity-70 border border-[rgba(120,180,140,0.3)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[rgba(120,180,140,0.5)] text-text-dark"
                placeholder="输入提示词标题..."
                value={editedPrompt?.title || ''}
                onChange={handleInputChange}
              />
            </div>

            {/* 提示词内容 */}
            <div>
              <label className="block text-text-dark font-medium mb-2">内容</label>
              <div
                className="w-full px-4 py-3 bg-white bg-opacity-70 border border-[rgba(120,180,140,0.3)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[rgba(120,180,140,0.5)] text-text-dark min-h-[120px] overflow-y-auto break-words whitespace-pre-wrap cursor-pointer hover:bg-white hover:bg-opacity-90 transition-colors"
                onClick={() => setIsContentEditModalOpen(true)}
              >
                {editedPrompt?.content ? (editedPrompt.content.length > 50 ? editedPrompt.content.substring(0, 50) + '...' : editedPrompt.content) : '点击此处编辑提示词内容...'}
              </div>

              {/* 内容编辑弹窗 */}
              <PromptContentEditModal
                isOpen={isContentEditModalOpen}
                onClose={() => setIsContentEditModalOpen(false)}
                content={editedPrompt?.content || ''}
                onChange={handleContentChange}
                onSave={() => setIsContentEditModalOpen(false)}
              />
            </div>

            {/* 提示词描述 */}
            <div className="flex-grow flex flex-col">
              <label className="block text-text-dark font-medium mb-2">描述 <span className="text-text-light text-sm">(可选)</span></label>
              <textarea
                name="description"
                className="w-full px-4 py-3 bg-white bg-opacity-70 border border-[rgba(120,180,140,0.3)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[rgba(120,180,140,0.5)] text-text-dark flex-grow min-h-[160px]"
                placeholder="简短描述提示词的用途..."
                value={editedPrompt?.description || ''}
                onChange={handleInputChange}
              ></textarea>
            </div>



            {/* 示例管理 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-text-dark font-medium">示例 <span className="text-text-light text-sm">(可选)</span></label>
                {addExample && (
                  <button
                    type="button"
                    onClick={addExample}
                    className="flex items-center text-sm text-[#5a9d6b] hover:underline"
                  >
                    <span className="material-icons mr-1 text-sm">add</span>
                    添加示例
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {editedPrompt?.examples && editedPrompt.examples.map((example, index) => (
                  <div key={index} className="flex items-start">
                    <textarea
                      className="flex-grow px-4 py-2 bg-white bg-opacity-70 border border-[rgba(120,180,140,0.3)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[rgba(120,180,140,0.5)] text-text-dark"
                      placeholder={`示例 ${index + 1}...`}
                      value={example}
                      onChange={(e) => handleExampleChange && handleExampleChange(index, e.target.value)}
                      rows={2}
                    ></textarea>
                    {removeExample && (
                      <button
                        type="button"
                        onClick={() => removeExample(index)}
                        className="ml-2 text-[#E06F6F] hover:text-[#d85050]"
                      >
                        <span className="material-icons">delete</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </form>
        </div>

        {/* 底部按钮 */}
        <div className="flex justify-end mt-6 space-x-3">
          {onCancel && (
            <button
              onClick={onCancel}
              className="btn-outline flex items-center text-sm px-4 py-2"
            >
              <span className="material-icons mr-1 text-sm">cancel</span>
              取消
            </button>
          )}

          {onSave && (
            <button
              onClick={onSave}
              className="btn-fill flex items-center text-sm px-4 py-2"
            >
              <span className="material-icons mr-1 text-sm">save</span>
              保存
            </button>
          )}
        </div>
      </div>
    );

}
