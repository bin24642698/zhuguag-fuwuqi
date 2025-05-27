'use client';

import React, { useState, useRef } from 'react';
import { generateAIContentStream, MODELS, Message } from '@/lib/AIserver';

interface AIBookAnalyzerProps {
  selectedChaptersContent: string;
  isProcessing: boolean;
  setIsProcessing: (value: boolean) => void;
  onAnalysisResult: (result: string) => void;
  disabled: boolean;
}

const AIBookAnalyzer: React.FC<AIBookAnalyzerProps> = ({
  selectedChaptersContent,
  isProcessing,
  setIsProcessing,
  onAnalysisResult,
  disabled
}) => {
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>(MODELS.GEMINI_FLASH); // 默认使用普通版
  const abortControllerRef = useRef<AbortController | null>(null);

  // 处理AI拆书分析
  const handleAnalyze = async () => {
    if (isProcessing || disabled || !selectedChaptersContent) return;

    setIsProcessing(true);
    setError(null);
    onAnalysisResult(''); // 清空之前的结果

    // 创建AbortController用于取消请求
    abortControllerRef.current = new AbortController();

    try {
      // 构建系统提示词
      const systemPrompt = `
你是一位专业的文学分析师，擅长分析和拆解文学作品。现在，你需要对用户提供的小说章节进行深度分析和拆解。

请按照以下结构进行分析：

1. 内容概要：简明扼要地总结章节内容，不超过300字。

2. 人物分析：
   - 识别章节中出现的主要人物
   - 分析每个人物的性格特点、动机和行为模式
   - 探讨人物之间的关系和互动

3. 情节分析：
   - 分析章节的情节结构和发展
   - 指出关键转折点和冲突
   - 评估情节的合理性和吸引力

4. 主题探讨：
   - 识别章节中的主要主题和象征
   - 分析作者如何通过情节和人物表达这些主题
   - 探讨这些主题的深层含义和社会意义

5. 写作技巧分析：
   - 评估作者的叙事手法和语言风格
   - 分析对话、描写和节奏的运用
   - 指出特别出色或需要改进的写作技巧

6. 改进建议：
   - 提供具体的改进建议，包括情节发展、人物塑造、对话和描写等方面
   - 指出可能的情节漏洞或不一致之处
   - 建议如何增强读者体验

请确保你的分析深入、客观、具体，并提供有建设性的反馈。避免过于笼统的评价，而是提供有针对性的分析和建议。

注意：你的分析应该尊重原文的创作意图，在提供改进建议时保持建设性和支持性的态度。
`;

      // 构建用户提示词
      const userPrompt = selectedChaptersContent;

      // 构建消息
      const messages: Message[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ];

      // 流式生成处理
      let result = '';

      // 开始生成
      await generateAIContentStream(
        messages,
        {
          model: selectedModel,
          abortSignal: abortControllerRef.current.signal
        },
        (chunk) => {
          if (!chunk) return;
          result += chunk;
          onAnalysisResult(result);
        }
      );
    } catch (error: any) {
      console.error('AI拆书分析失败:', error);

      // 检查是否是用户主动取消
      if (error.name === 'AbortError' || error.message === 'AbortError') {
        setError('分析已取消');
      } else {
        setError(error instanceof Error ? error.message : 'AI拆书分析失败，请重试');
      }
    } finally {
      setIsProcessing(false);
      abortControllerRef.current = null;
    }
  };

  // 取消分析
  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-medium text-text-dark">AI拆书分析</h3>

          {/* 模型选择 - 使用自定义按钮组替代下拉框 */}
          <div className="flex items-center space-x-2">
            <div className="flex rounded-lg overflow-hidden border border-[rgba(120,180,140,0.3)]">
              <button
                onClick={() => !isProcessing && setSelectedModel(MODELS.GEMINI_FLASH)}
                className={`py-1 px-3 text-xs font-medium transition-all duration-200 ${
                  selectedModel === MODELS.GEMINI_FLASH
                    ? 'bg-[#5a9d6b] text-white'
                    : 'bg-white text-[#5a9d6b] hover:bg-[rgba(90,157,107,0.1)]'
                }`}
                disabled={isProcessing}
              >
                普通版
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {isProcessing ? (
            <button
              className="px-4 py-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors duration-200 flex items-center shadow-sm"
              onClick={handleCancel}
            >
              <span className="material-icons mr-1 text-sm">cancel</span>
              取消分析
            </button>
          ) : (
            <button
              className={`px-4 py-2 rounded-full flex items-center shadow-sm ${
                disabled
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-primary-green text-white hover:bg-primary-green/90 transition-colors duration-200'
              }`}
              onClick={handleAnalyze}
              disabled={disabled || !selectedChaptersContent}
            >
              <span className="material-icons mr-1 text-sm">psychology</span>
              开始AI拆书
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-2 text-red-500 text-sm">
          <span className="material-icons text-sm mr-1 align-text-bottom">error</span>
          {error}
        </div>
      )}

      <div className="mt-2 text-sm text-text-light">
        {disabled ? (
          '请先选择需要分析的章节'
        ) : (
          `已选择 ${selectedChaptersContent.length > 0 ? Math.ceil(selectedChaptersContent.length / 500) : 0} 分钟阅读量的内容进行分析`
        )}
      </div>
    </div>
  );
};

export default AIBookAnalyzer;
