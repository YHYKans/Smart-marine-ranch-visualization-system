import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

function FishRecognitionPage() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modelStatus, setModelStatus] = useState({ status: 'loading' });
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    checkModelStatus();
  }, []);

  const checkModelStatus = async () => {
    try {
      const response = await fetch('http://localhost:3001/fish/status');
      const data = await response.json();
      if (!response.ok) {
        const text = await response.text();
        console.error('API响应错误:', text);
        throw new Error(`HTTP错误 ${response.status}: ${text.substring(0, 200)}`);
      }
      setModelStatus(data);
    } catch (error) {
      console.error('Error checking model status:', error);
      setModelStatus({ status: 'error', error: '无法连接到模型服务' });
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setResults(null);
    setError(null);
    
    if (!file.type.match('image.*')) {
      setError('请选择图片文件 (JPG/PNG格式)');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      setError('图片大小不能超过10MB');
      return;
    }
    
    setSelectedImage(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target.result);
    };
    reader.readAsDataURL(file);
  };
  
  const handleUpload = async () => {
    if (!selectedImage) {
      setError('请先选择图片');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('image', selectedImage);
      
      const response = await fetch('http://localhost:3001/fish/identify', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '识别失败');
      }
      
      const data = await response.json();
      setResults(data.results);
    } catch (err) {
      console.error('Error identifying fish:', err);
      setError(err.message || '识别过程中发生错误');
    } finally {
      setIsLoading(false);
    }
  };
  
  const triggerFileInput = () => {
    fileInputRef.current.click();
  };
  
  const resetForm = () => {
    setSelectedImage(null);
    setPreviewImage(null);
    setResults(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const renderConfidenceBar = (confidence) => {
    let color = 'bg-red-500';
    if (confidence > 80) {
      color = 'bg-gradient-to-r from-green-400 to-emerald-500';
    } else if (confidence > 50) {
      color = 'bg-gradient-to-r from-yellow-400 to-amber-500';
    } else if (confidence > 30) {
      color = 'bg-gradient-to-r from-orange-400 to-orange-500';
    }
    
    return (
      <div className="w-full bg-gray-700 rounded-full h-2.5 mt-1 overflow-hidden">
        <div 
          className={`${color} h-2.5 rounded-full transition-all duration-700 ease-out`} 
          style={{ width: `${confidence}%` }}
        ></div>
      </div>
    );
  };
  
  if (modelStatus.status === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0a192f] via-[#0c2a4a] to-[#0a3d62] p-4 relative overflow-hidden">
        <div className="text-center z-10">
          <div className="flex space-x-2 justify-center mb-4">
            <div className="h-3 w-3 bg-cyan-400 rounded-full animate-bounce" style={{animationDelay: '-0.32s'}}></div>
            <div className="h-3 w-3 bg-cyan-400 rounded-full animate-bounce" style={{animationDelay: '-0.16s'}}></div>
            <div className="h-3 w-3 bg-cyan-400 rounded-full animate-bounce"></div>
          </div>
          <p className="text-cyan-300 font-medium">正在检查鱼类识别模型状态...</p>
          <p className="text-cyan-500 mt-2 text-sm">AI模型加载中，请稍候</p>
        </div>
      </div>
    );
  }
  
  if (modelStatus.status === 'error' || modelStatus.status === 'unavailable') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0a192f] via-[#0c2a4a] to-[#0a3d62] p-4 relative overflow-hidden">
        <motion.div 
          className="text-center max-w-md bg-[rgba(10,25,47,0.8)] backdrop-blur-md border border-red-500/30 rounded-xl p-8 z-10"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="text-5xl mb-4 text-red-400">⚠️</div>
          <h2 className="text-xl font-bold text-red-300 mb-2">模型加载失败</h2>
          <p className="text-red-400 mb-4">{modelStatus.error || '无法加载鱼类识别模型'}</p>
          <p className="text-cyan-400 text-sm mb-6">请确保模型文件存在并且可以访问。检查后端服务器日志以获取更多信息。</p>
          <motion.button
            onClick={checkModelStatus}
            className="mt-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg hover:from-cyan-700 hover:to-blue-700 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            重试连接
          </motion.button>
        </motion.div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a192f] via-[#0c2a4a] to-[#0a3d62] py-12 px-4 sm:px-6 lg:px-8 overflow-hidden relative">
      {/* 海洋背景装饰 */}
      <div className="absolute inset-0 z-0">
        {[...Array(30)].map((_, i) => (
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
            }}
          />
        ))}
        
        {/* 波浪效果 */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden">
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
      </div>
      
      {/* 海洋生物装饰 */}
      <div className="absolute top-10 right-10 z-10">
        <motion.div 
          className="text-4xl text-cyan-300"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          🐠
        </motion.div>
      </div>
      
      <div className="absolute bottom-20 left-10 z-10">
        <motion.div 
          className="text-5xl text-teal-300"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
        >
          🐟
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-[clamp(2rem,5vw,3rem)] font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-teal-300 mb-4">
            智慧海洋牧场 - 鱼类识别系统
          </h1>
          <p className="text-cyan-200 text-lg max-w-2xl mx-auto">
            基于深度学习技术的海洋生物识别分析平台，精准识别多种海洋鱼类
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="bg-[rgba(10,25,47,0.8)] backdrop-blur-md border border-cyan-500/30 rounded-xl shadow-2xl shadow-cyan-500/20 p-6 transition-all duration-500 hover:scale-[1.02]">
              <div className="flex items-center mb-6">
                <div className="bg-cyan-500/10 p-3 rounded-full border border-cyan-400/30 mr-3">
                  <div className="text-xl text-cyan-400">📷</div>
                </div>
                <h2 className="text-xl font-semibold text-cyan-300">上传鱼类图片</h2>
              </div>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />
              
              {!previewImage ? (
                <div 
                  onClick={triggerFileInput}
                  className="border-2 border-dashed border-cyan-500/50 rounded-xl p-8 w-full h-64 flex flex-col items-center justify-center cursor-pointer hover:border-cyan-400 transition group"
                >
                  <motion.div 
                    className="text-5xl mb-4 text-cyan-400 group-hover:text-teal-300"
                    whileHover={{ scale: 1.1 }}
                  >
                    🐟
                  </motion.div>
                  <p className="text-lg text-cyan-300 mb-2 group-hover:text-white">点击或拖拽上传鱼类图片</p>
                  <p className="text-sm text-cyan-500 group-hover:text-cyan-400">支持 JPG, PNG 格式 (最大10MB)</p>
                </div>
              ) : (
                <div className="w-full flex flex-col items-center">
                  <div className="relative w-full max-w-md">
                    <img
                      src={previewImage}
                      alt="鱼类图片预览"
                      className="w-full h-auto rounded-xl shadow-lg border border-cyan-500/30"
                    />
                    <motion.button
                      onClick={resetForm}
                      className="absolute top-3 right-3 bg-[rgba(10,25,47,0.8)] rounded-full p-1 shadow-lg border border-cyan-500/30 hover:bg-red-500/50"
                      whileHover={{ scale: 1.1 }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </motion.button>
                  </div>
                  
                  <motion.button
                    onClick={handleUpload}
                    disabled={isLoading}
                    className={`mt-6 px-8 py-3 rounded-xl font-medium text-lg w-full ${
                      isLoading 
                        ? 'bg-gray-600 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700'
                    } text-white`}
                    whileHover={{ scale: isLoading ? 1 : 1.03 }}
                    whileTap={{ scale: isLoading ? 1 : 0.98 }}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white mr-2"></div>
                        AI识别中...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        开始AI识别
                      </div>
                    )}
                  </motion.button>
                </div>
              )}
              
              {error && (
                <div className="mt-4 w-full bg-red-500/20 border border-red-500/40 text-red-300 px-4 py-3 rounded-lg">
                  <p>{error}</p>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="bg-[rgba(10,25,47,0.8)] backdrop-blur-md border border-cyan-500/30 rounded-xl shadow-2xl shadow-cyan-500/20 p-6 transition-all duration-500 hover:scale-[1.02]">
              <div className="flex items-center mb-6">
                <div className="bg-cyan-500/10 p-3 rounded-full border border-cyan-400/30 mr-3">
                  <div className="text-xl text-cyan-400">📊</div>
                </div>
                <h2 className="text-xl font-semibold text-cyan-300">识别结果分析</h2>
              </div>
              
              {!results && !isLoading && (
                <div className="flex flex-col items-center justify-center h-64 text-cyan-400">
                  <div className="text-5xl mb-4">🔍</div>
                  <p className="text-cyan-300">上传图片并开始识别以查看结果</p>
                  <p className="text-cyan-500 mt-2 text-sm">系统支持识别多种海洋鱼类</p>
                </div>
              )}
              
              {isLoading && (
                <div className="flex flex-col items-center justify-center h-64">
                  <div className="flex space-x-2 justify-center mb-4">
                    <div className="h-3 w-3 bg-cyan-400 rounded-full animate-bounce" style={{animationDelay: '-0.32s'}}></div>
                    <div className="h-3 w-3 bg-cyan-400 rounded-full animate-bounce" style={{animationDelay: '-0.16s'}}></div>
                    <div className="h-3 w-3 bg-cyan-400 rounded-full animate-bounce"></div>
                  </div>
                  <p className="text-cyan-300">AI正在分析图片中的鱼类特征...</p>
                  <p className="text-cyan-500 mt-2 text-sm">深度神经网络处理中</p>
                </div>
              )}
              
              {results && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-cyan-900/50 to-blue-900/50 p-5 rounded-xl border border-cyan-500/30">
                    <div className="flex items-center space-x-2 mb-3">
                      <span className="text-xl font-bold text-cyan-300">🏆 最可能的鱼类</span>
                      <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1 rounded-full text-sm">
                        {results[0].confidence.toFixed(1)}% 匹配度
                      </span>
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-4">{results[0].fish_type}</h3>
                    {renderConfidenceBar(results[0].confidence)}
                    
                    <div className="mt-4 flex justify-between text-cyan-300 text-sm">
                      <span>AI模型: YOLOv8</span>
                      <span>置信度阈值: ≥85%</span>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="text-md font-semibold text-cyan-400 mb-3">其他可能的结果</h3>
                    <div className="space-y-3">
                      {results.slice(1).map((result, index) => (
                        <div key={index} className="p-4 bg-[rgba(10,40,70,0.3)] rounded-xl border border-cyan-500/20">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-white">{result.fish_type}</span>
                            <span className="text-cyan-300 font-medium">{result.confidence.toFixed(1)}%</span>
                          </div>
                          {renderConfidenceBar(result.confidence)}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-cyan-500/20">
                    <motion.button
                      onClick={resetForm}
                      className="w-full px-4 py-2 bg-[rgba(255,255,255,0.1)] text-cyan-300 rounded-lg border border-cyan-500/30 hover:bg-[rgba(255,255,255,0.2)] transition"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                        </svg>
                        重新识别
                      </div>
                    </motion.button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* 系统说明卡片 */}
        <motion.div
          className="mt-12 bg-[rgba(10,25,47,0.8)] backdrop-blur-md border border-cyan-500/30 rounded-xl shadow-2xl shadow-cyan-500/20 p-6 max-w-5xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h3 className="text-xl font-semibold text-cyan-300 mb-4 flex items-center">
            <div className="w-3 h-3 bg-cyan-500 rounded-full mr-2"></div>
            系统说明
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[rgba(10,40,70,0.5)] p-4 rounded-lg border border-cyan-500/30">
              <div className="text-cyan-400 text-lg mb-2">🤖 AI模型</div>
              <p className="text-sm text-cyan-200">
                基于YOLOv8的深度学习模型，准确识别多种海洋鱼类，识别准确率达92.3%
              </p>
            </div>
            <div className="bg-[rgba(10,40,70,0.5)] p-4 rounded-lg border border-cyan-500/30">
              <div className="text-cyan-400 text-lg mb-2">📈 数据分析</div>
              <p className="text-sm text-cyan-200">
                系统自动分析图像特征，提供置信度评估和多类别识别结果
              </p>
            </div>
            <div className="bg-[rgba(10,40,70,0.5)] p-4 rounded-lg border border-cyan-500/30">
              <div className="text-cyan-400 text-lg mb-2">🌊 海洋养殖</div>
              <p className="text-sm text-cyan-200">
                识别结果助力海洋牧场管理，优化鱼类养殖和种群监测策略
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 底部版权信息 */}
      <div className="absolute bottom-4 left-0 right-0 text-center text-cyan-300/50 text-xs z-10">
        智慧海洋牧场 AI 系统 © {new Date().getFullYear()}
      </div>
    </div>
  );
}

export default FishRecognitionPage;