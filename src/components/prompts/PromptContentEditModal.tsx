'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { generateEncryptionKey, decryptText } from '@/lib/utils/encryption';
import { useAuthStore } from '@/store/slices/authStore';

interface PromptContentEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  onChange: (content: string) => void;
  onSave: () => void;
}

/**
 * 提示词内容编辑弹窗组件
 */
export function PromptContentEditModal({
  isOpen,
  onClose,
  content,
  onChange,
  onSave
}: PromptContentEditModalProps) {
  // 添加客户端渲染检查
  const [isMounted, setIsMounted] = useState(false);
  const [decryptedContent, setDecryptedContent] = useState('');
  const [isDecrypting, setIsDecrypting] = useState(true);

  // 解密内容
  useEffect(() => {
    const decryptContent = async () => {
      if (!content) {
        setDecryptedContent('');
        setIsDecrypting(false);
        return;
      }

      setIsDecrypting(true);
      try {
        // 检查内容是否需要解密
        if (content.startsWith('U2F')) {
          const user = await useAuthStore.getState().getCurrentUser();
          if (user) {
            const key = generateEncryptionKey(user.id);
            try {
              // 解密内容
              let decrypted = decryptText(content, key);

              // 检查是否存在嵌套加密
              let decryptAttempts = 0;
              while (decrypted.startsWith('U2F') && decryptAttempts < 3) {
                console.log(`检测到嵌套加密，尝试再次解密 (尝试 ${decryptAttempts + 1}/3)`);
                decrypted = decryptText(decrypted, key);
                decryptAttempts++;
              }

              setDecryptedContent(decrypted);
            } catch (error) {
              console.error('解密提示词内容失败:', error);
              setDecryptedContent(content);
            }
          } else {
            setDecryptedContent(content);
          }
        } else {
          setDecryptedContent(content);
        }
      } catch (error) {
        console.error('解密提示词内容失败:', error);
        setDecryptedContent(content);
      } finally {
        setIsDecrypting(false);
      }
    };

    if (isOpen && content) {
      decryptContent();
    }
  }, [isOpen, content]);

  useEffect(() => {
    setIsMounted(true);

    // 当模态窗口打开时，禁止body滚动
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }

    // 清理函数：当组件卸载或模态窗口关闭时，恢复body滚动
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // 处理内容变更
  const handleContentChange = (newContent: string) => {
    setDecryptedContent(newContent);
  };

  // 保存时传递解密后的内容
  const handleSave = () => {
    onChange(decryptedContent);
    onSave();
    onClose();
  };

  // 如果模态窗口未打开或组件未挂载，不渲染任何内容
  if (!isOpen || !isMounted) return null;

  // 使用createPortal将模态窗口渲染到body
  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] animate-fadeIn">
      <div className="bg-card-color rounded-2xl w-full max-w-4xl h-[80vh] shadow-xl relative flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-[rgba(120,180,140,0.3)]">
          <h2 className="text-2xl font-bold text-text-dark font-ma-shan">编辑提示词内容</h2>
          <button
            className="text-gray-500 hover:text-gray-700 w-6 flex justify-center"
            onClick={onClose}
          >
            <span className="material-icons">close</span>
          </button>
        </div>

        <div className="flex-grow p-6 overflow-hidden">
          {isDecrypting ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-[#7D85CC] rounded-full animate-pulse mr-1"></div>
                <div className="w-3 h-3 bg-[#E0976F] rounded-full animate-pulse delay-150 mr-1"></div>
                <div className="w-3 h-3 bg-[#9C6FE0] rounded-full animate-pulse delay-300"></div>
              </div>
            </div>
          ) : (
            <textarea
              className="w-full h-full px-4 py-3 bg-white bg-opacity-70 border border-[rgba(120,180,140,0.3)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[rgba(120,180,140,0.5)] text-text-dark overflow-y-auto break-words whitespace-pre-wrap resize-none"
              value={decryptedContent}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="输入提示词内容..."
            ></textarea>
          )}
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t border-[rgba(120,180,140,0.3)]">
          <button
            onClick={handleSave}
            className="ghibli-button text-sm py-2"
            disabled={isDecrypting}
          >
            保存
          </button>
          <button
            onClick={onClose}
            className="ghibli-button outline text-sm py-2"
          >
            取消
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
