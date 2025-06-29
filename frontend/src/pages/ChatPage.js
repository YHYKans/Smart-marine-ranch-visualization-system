import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';

function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const messagesEndRef = useRef(null);
  const messageContainerRef = useRef(null);
  
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  const handleInputChange = (e) => {
    setInput(e.target.value);
  };
  
  const getStreamingResponse = async (message, messageId) => {
    try {
      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }
        
        buffer += decoder.decode(value, { stream: true });
        
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              setMessages(prev => 
                prev.map(msg => 
                  msg.id === messageId 
                    ? { 
                        ...msg, 
                        content: msg.content + (data.content || ''),
                        ...(data.finished ? { isStreaming: false } : {})
                      } 
                    : msg
                )
              );
              
              if (data.error) {
                throw new Error(data.error);
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
      
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, isStreaming: false } 
            : msg
        )
      );
      
    } catch (error) {
      console.error('Error in streaming response:', error);
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, content: msg.content + '\n\n[连接中断] ' + error.message, isStreaming: false } 
            : msg
        )
      );
    }
  };
  
  const simulateStreamingResponse = async (message, messageId) => {
    try {
      const words = `这是一个模拟回应。目前无法连接到后端服务器，所以显示这条测试消息。您的问题是关于: "${message}"。请确保后端服务器正在运行，并且可以从前端访问API端点 /api/chat。`;
      const wordArray = words.split(' ');
      
      for (let i = 0; i < wordArray.length; i++) {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === messageId 
              ? { 
                  ...msg, 
                  content: msg.content + (i > 0 ? ' ' : '') + wordArray[i],
                  ...(i === wordArray.length - 1 ? { isStreaming: false } : {})
                } 
              : msg
          )
        );
        
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    } catch (error) {
      console.error('Error in simulation:', error);
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, content: '获取回应时出错', isStreaming: false } 
            : msg
        )
      );
    }
  };
  
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    if (!input.trim() || isLoading) return;
    
    const userMessage = {
      role: 'user',
      content: input,
      timestamp: new Date().toLocaleTimeString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);
    
    try {
      const aiMessageId = Date.now();
      setMessages(prev => [...prev, {
        id: aiMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date().toLocaleTimeString(),
        isStreaming: true
      }]);
      
      try {
        await getStreamingResponse(userMessage.content, aiMessageId);
      } catch (apiError) {
        console.warn('无法连接到后端API，使用模拟模式:', apiError);
        await simulateStreamingResponse(userMessage.content, aiMessageId);
      }
      
    } catch (err) {
      setError('连接服务器失败，请稍后再试');
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };
  
  // 自定义 Markdown 渲染组件
  const MarkdownRenderer = ({ content }) => {
    return (
      <div className="prose prose-invert prose-cyan max-w-none">
        <ReactMarkdown
          components={{
            a: ({ node, ...props }) => (
              <a {...props} className="text-cyan-400 hover:text-cyan-300" />
            ),
            code: ({ node, ...props }) => (
              <code {...props} className="bg-cyan-900/50 px-1 py-0.5 rounded" />
            ),
            pre: ({ node, ...props }) => (
              <pre 
                {...props} 
                className="bg-[rgba(10,25,47,0.8)] border border-cyan-500/30 rounded-lg p-4 overflow-x-auto" 
              />
            )
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  };
  
  // 海洋背景动画元素
  const renderOceanElements = () => {
    return (
      <>
        {[...Array(20)].map((_, i) => (
          <div 
            key={i}
            className="absolute rounded-full animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 10 + 2}px`,
              height: `${Math.random() * 10 + 2}px`,
              backgroundColor: i % 3 === 0 
                ? '#00FFFF' 
                : i % 3 === 1 
                  ? '#00BFFF' 
                  : '#1E90FF',
              opacity: Math.random() * 0.5 + 0.2,
              animationDuration: `${Math.random() * 5 + 3}s`,
              zIndex: 0
            }}
          />
        ))}
        
        <div className="absolute bottom-0 left-0 w-full overflow-hidden z-0">
          <svg 
            className="relative block w-[calc(100%+1.3px)] h-[80px]"
            data-name="Layer 1" 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 1200 120" 
            preserveAspectRatio="none"
          >
            <path 
              d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" 
              className="fill-current text-blue-500 opacity-30" 
            ></path>
            <path 
              d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" 
              className="fill-current text-teal-400 opacity-40" 
            ></path>
            <path 
              d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" 
              className="fill-current text-cyan-300 opacity-30" 
            ></path>
          </svg>
        </div>
      </>
    );
  };
  
  // 示例问题
  const exampleQuestions = [
    "海洋养殖中如何控制水质？",
    "深海网箱养殖的最佳实践是什么？",
    "如何预防海洋养殖中的疾病传播？",
    "AI在海洋养殖中有哪些创新应用？"
  ];
  
  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-[#0a192f] via-[#0c2a4a] to-[#0a3d62] overflow-hidden">
      {/* 背景动画元素 */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {renderOceanElements()}
      </div>
      
      {/* 顶部导航栏 */}
      <div className="bg-[rgba(10,25,47,0.8)] backdrop-blur-md border-b border-cyan-500/30 p-4 flex items-center justify-between z-10">
        <div className="flex items-center">
          <div className="bg-cyan-500/10 p-2 rounded-full border border-cyan-400/30 mr-3">
            <div className="text-xl text-cyan-400">🌊</div>
          </div>
          <h1 className="text-xl font-bold text-white">智慧海洋牧场 AI 助手</h1>
        </div>
        <div className="text-cyan-300 text-sm">
          智能对话 · 海洋养殖 · 数据分析
        </div>
      </div>
      
      {/* 聊天消息区域 */}
      <div 
        ref={messageContainerRef}
        className="flex-1 p-6 overflow-y-auto relative z-10"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center z-10 relative">
            <div className="bg-cyan-500/10 p-6 rounded-full border border-cyan-400/30 mb-6">
              <div className="text-6xl text-cyan-400">🌊</div>
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">欢迎使用智慧海洋牧场 AI 助手</h2>
            <p className="text-cyan-200 max-w-lg mb-8">
              我是您的海洋养殖智能助手，可以回答关于海洋牧场建设、养殖技术、环境监测等专业问题
            </p>
            
            <div className="grid grid-cols-2 gap-4 max-w-lg w-full">
              {exampleQuestions.map((question, index) => (
                <motion.div 
                  key={index}
                  className="bg-[rgba(10,25,47,0.7)] border border-cyan-500/30 rounded-xl p-4 text-left cursor-pointer hover:bg-[rgba(10,25,47,0.9)] transition-colors"
                  whileHover={{ y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setInput(question);
                    setTimeout(() => handleSubmit(), 100);
                  }}
                >
                  <div className="text-cyan-400 text-lg mb-2">{["📊", "🐟", "📈", "🤖"][index]}</div>
                  <p className="text-sm text-cyan-200">{question}</p>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-w-4xl mx-auto">
            {messages.map((message, index) => (
              <motion.div 
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div 
                  className={`max-w-3/4 rounded-2xl p-4 relative overflow-hidden ${
                    message.role === 'user' 
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-700 text-white' 
                      : 'bg-[rgba(255,255,255,0.1)] backdrop-blur-sm border border-cyan-500/30 text-white'
                  }`}
                >
                  {/* 消息装饰效果 */}
                  {message.role === 'assistant' && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
                  )}
                  
                  <div className="flex items-start">
                    {message.role === 'assistant' && (
                      <div className="bg-cyan-500/20 p-2 rounded-full mr-3">
                        <div className="text-cyan-300">🤖</div>
                      </div>
                    )}
                    
                    <div className="flex-1">
                      {message.role === 'user' ? (
                        <div className="whitespace-pre-wrap">{message.content}</div>
                      ) : (
                        <MarkdownRenderer content={message.content} />
                      )}
                      
                      {message.isStreaming && (
                        <div className="mt-2">
                          <div className="flex space-x-1">
                            <div className="h-2 w-2 bg-cyan-400 rounded-full animate-bounce" style={{animationDelay: '-0.32s'}}></div>
                            <div className="h-2 w-2 bg-cyan-400 rounded-full animate-bounce" style={{animationDelay: '-0.16s'}}></div>
                            <div className="h-2 w-2 bg-cyan-400 rounded-full animate-bounce"></div>
                          </div>
                        </div>
                      )}
                      
                      <div className={`text-xs mt-2 ${message.role === 'user' ? 'text-blue-200' : 'text-cyan-300'}`}>
                        {message.role === 'user' ? '用户' : '海洋AI助手'} · {message.timestamp}
                      </div>
                    </div>
                    
                    {message.role === 'user' && (
                      <div className="bg-blue-600/30 p-2 rounded-full ml-3">
                        <div className="text-blue-200">👤</div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {error && (
        <div className="bg-red-500/20 border border-red-500/40 text-red-300 px-4 py-3 rounded-lg mx-6 mb-4 max-w-4xl mx-auto z-10 relative">
          <p>{error}</p>
        </div>
      )}
      
      <div className="border-t border-cyan-500/30 p-4 bg-[rgba(10,25,47,0.8)] backdrop-blur-md z-10">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="flex space-x-3 items-end">
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                placeholder="请输入关于海洋养殖的问题..."
                rows={1}
                className="w-full border border-cyan-500/50 bg-[rgba(10,40,70,0.5)] text-white rounded-2xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                style={{ minHeight: '56px' }}
              />
              <div className="absolute right-3 bottom-3 text-cyan-400/70 text-sm">
                Shift + Enter 换行
              </div>
            </div>
            <motion.button
              type="submit"
              disabled={isLoading || !input.trim()}
              className={`h-14 w-14 flex items-center justify-center rounded-full ${
                isLoading || !input.trim()
                  ? 'bg-gray-600 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700'
              } transition-all`}
              whileHover={{ scale: isLoading || !input.trim() ? 1 : 1.05 }}
              whileTap={{ scale: isLoading || !input.trim() ? 1 : 0.95 }}
            >
              {isLoading ? (
                <div className="flex space-x-1">
                  <div className="h-2 w-2 bg-white rounded-full animate-bounce" style={{animationDelay: '-0.32s'}}></div>
                  <div className="h-2 w-2 bg-white rounded-full animate-bounce" style={{animationDelay: '-0.16s'}}></div>
                  <div className="h-2 w-2 bg-white rounded-full animate-bounce"></div>
                </div>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                </svg>
              )}
            </motion.button>
          </div>
          <div className="mt-3 flex justify-center">
            <div className="text-xs text-cyan-400/70 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 mr-1">
                <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 0 1 .67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 1 1-.671-1.34l.041-.022ZM12 9a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
              </svg>
              智慧海洋牧场 AI 助手 · 提供专业海洋养殖咨询
            </div>
          </div>
        </form>
      </div>
      
      {/* 全局动画样式 */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes fadeInUp {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(5deg); }
          50% { transform: rotate(-5deg); }
          75% { transform: rotate(5deg); }
        }
        
        .animate-wiggle {
          animation: wiggle 8s infinite;
        }
        
        .animate-bounce {
          animation: bounce 1.5s infinite;
        }
        
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
}

export default ChatPage;