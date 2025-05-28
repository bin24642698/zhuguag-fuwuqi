import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 创建Supabase客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// API Base URL - 使用环回地址
const API_BASE = "https://api.24642698.xyz/v1";

// 消息类型
interface Message {
  role: 'user' | 'system' | 'assistant';
  content: string;
}

// 生成选项接口
interface GenerateOptions {
  model: string;
  temperature?: number;
  max_tokens?: number;
}

/**
 * AI流式请求中转API
 * 
 * 请求体:
 * {
 *   messages: Message[];
 *   options: GenerateOptions;
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 获取用户token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '未提供有效的认证token' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // 验证用户身份
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json(
        { error: '用户认证失败' },
        { status: 401 }
      );
    }

    // 解析请求体
    const body = await request.json();
    const { messages, options } = body;

    // 验证请求数据
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: '消息数组不能为空' },
        { status: 400 }
      );
    }

    if (!options || !options.model) {
      return NextResponse.json(
        { error: '必须指定模型' },
        { status: 400 }
      );
    }

    // 使用固定的API Key
    const apiKey = 'sk-IcZlIdbo6TntcwAQhl7PhYsS6JnpwKEzDxvfA0NW2DvuPWfM';

    // 构建请求到目标AI服务
    const aiRequest = {
      model: options.model,
      messages: messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || 4096,
      stream: true
    };

    console.log('转发AI请求:', {
      model: options.model,
      messageCount: messages.length,
      userId: user.id
    });

    // 发送请求到目标AI服务
    const response = await fetch(`${API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(aiRequest)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI服务错误:', response.status, errorText);
      
      let errorMessage = 'AI服务请求失败';
      if (response.status === 401) {
        errorMessage = 'API认证失败，请联系管理员';
      } else if (response.status === 429) {
        errorMessage = '请求过于频繁，请稍后再试';
      } else if (response.status === 400) {
        errorMessage = '请求参数错误';
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    // API Key使用记录（可选）
    console.log('使用固定API Key发送请求:', {
      model: options.model,
      userId: user.id,
      timestamp: new Date().toISOString()
    });

    // 创建流式响应
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const reader = response.body?.getReader();
          if (!reader) {
            controller.error(new Error('无法获取响应流'));
            return;
          }

          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              controller.close();
              break;
            }

            // 解码数据
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                
                if (data === '[DONE]') {
                  controller.close();
                  return;
                }

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  
                  if (content) {
                    // 发送内容到前端
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                  }
                } catch (parseError) {
                  // 忽略解析错误，继续处理下一行
                  continue;
                }
              }
            }
          }
        } catch (error) {
          console.error('流处理错误:', error);
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('AI流式请求API异常:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '服务器内部错误'
      },
      { status: 500 }
    );
  }
}
