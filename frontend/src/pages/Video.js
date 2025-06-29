import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const VideoList = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // 模拟视频数据
  const mockVideos = [
    "海底珊瑚礁监测.mp4",
    "深海鱼类行为研究.mp4",
    "海洋牧场全景.mp4",
    "水下设备维护记录.mp4",
    "海草床生态观察.mp4",
    "人工鱼礁投放记录.mp4",
    "海洋生物多样性调查.mp4",
    "海水质量检测过程.mp4",
    "海豚群活动记录.mp4",
    "夜间海底监测.mp4",
    "潜水员作业记录.mp4",
    "海底地形测绘.mp4"
  ];

  // 模拟视频分类
  const categories = [
    { id: 'all', name: '全部视频' },
    { id: 'monitoring', name: '环境监测' },
    { id: 'research', name: '科学研究' },
    { id: 'equipment', name: '设备记录' },
    { id: 'wildlife', name: '海洋生物' }
  ];

  useEffect(() => {
    // 模拟API请求
    const fetchVideos = async () => {
      try {
        setLoading(true);
        // 模拟网络延迟
        await new Promise(resolve => setTimeout(resolve, 800));
        // 实际项目中替换为真实API调用
        // const response = await fetch('http://localhost:3001/api/videos');
        // const data = await response.json();
        setVideos(mockVideos);
      } catch (error) {
        console.error('Error fetching videos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  // 过滤视频
  const filteredVideos = videos.filter(video => {
    // 应用搜索过滤
    if (searchTerm && !video.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // 应用分类过滤
    if (filter === 'all') return true;
    if (filter === 'monitoring') return video.includes('监测') || video.includes('检测');
    if (filter === 'research') return video.includes('研究') || video.includes('调查');
    if (filter === 'equipment') return video.includes('设备') || video.includes('维护');
    if (filter === 'wildlife') return video.includes('生物') || video.includes('鱼类') || video.includes('海豚');
    
    return true;
  });

  // 获取视频缩略图URL（模拟）
  const getThumbnailUrl = (videoName) => {
    const thumbnails = [
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=300",
      "https://images.unsplash.com/photo-1536152470836-b943b246224c?q=80&w=300",
      "https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=300",
      "https://images.unsplash.com/photo-1560275619-4662e36fa65c?q=80&w=300",
      "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?q=80&w=300",
      "https://images.unsplash.com/photo-1540202404-1b927e27fa8b?q=80&w=300"
    ];
    
    // 根据视频名称的哈希值选择缩略图
    const hash = Array.from(videoName).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return thumbnails[hash % thumbnails.length];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0a192f] to-[#0a3d62]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-400 mx-auto"></div>
          <p className="mt-4 text-cyan-200">正在加载视频数据...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a192f] via-[#0c2a4a] to-[#0a3d62] relative overflow-hidden">
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
                ? 'rgba(0, 255, 255, 0.3)' 
                : i % 3 === 1 
                  ? 'rgba(0, 191, 255, 0.3)' 
                  : 'rgba(30, 144, 255, 0.3)',
              opacity: Math.random() * 0.5 + 0.2,
              animationDuration: `${Math.random() * 5 + 3}s`,
            }}
          />
        ))}
        
        {/* 波浪效果 */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden">
          <svg 
            className="relative block w-[calc(100%+1.3px)] h-[80px]"
            viewBox="0 0 1200 120" 
            preserveAspectRatio="none"
          >
            <path 
              d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" 
              fill="rgba(255,255,255,0.1)" 
            ></path>
            <path 
              d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" 
              fill="rgba(255,255,255,0.2)" 
            ></path>
            <path 
              d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" 
              fill="rgba(255,255,255,0.3)" 
            ></path>
          </svg>
        </div>
      </div>
      
      {/* 海洋生物装饰 */}
      <div className="absolute top-10 right-10 z-10">
        <motion.div 
          className="text-4xl text-cyan-300 opacity-50"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          🐠
        </motion.div>
      </div>
      
      <div className="absolute bottom-20 left-10 z-10">
        <motion.div 
          className="text-5xl text-teal-300 opacity-50"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
        >
          🐢
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {/* 页面标题 */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-teal-300 mb-2">
            海洋牧场监控视频库
          </h1>
          <p className="text-cyan-200 max-w-2xl mx-auto">
            实时监测水下环境，记录海洋生态变化，助力海洋牧场科学管理
          </p>
        </motion.div>

        {/* 搜索和筛选区域 */}
        <motion.div 
          className="bg-[rgba(10,25,47,0.7)] backdrop-blur-md border border-cyan-500/30 rounded-xl p-6 mb-8 shadow-xl shadow-cyan-500/10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-cyan-300 mb-2">搜索视频</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="输入视频名称..."
                  className="w-full bg-[rgba(10,40,70,0.5)] border border-cyan-500/30 rounded-lg py-3 px-4 pl-10 text-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="absolute left-3 top-3.5 text-cyan-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-cyan-300 mb-2">视频分类</label>
              <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                  <motion.button
                    key={category.id}
                    className={`px-4 py-2 rounded-full text-sm transition-all ${
                      filter === category.id 
                        ? 'bg-cyan-600 text-white' 
                        : 'bg-[rgba(10,40,70,0.5)] text-cyan-300 hover:bg-cyan-700/50'
                    }`}
                    onClick={() => setFilter(category.id)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {category.name}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* 统计卡片 */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="bg-[rgba(10,40,70,0.5)] backdrop-blur-sm border border-cyan-500/30 rounded-xl p-4">
            <div className="flex items-center">
              <div className="bg-cyan-500/10 p-2 rounded-full mr-3">
                <div className="text-cyan-400">🎬</div>
              </div>
              <div>
                <div className="text-cyan-300 text-sm">总视频数量</div>
                <div className="text-white text-xl font-medium">{videos.length}</div>
              </div>
            </div>
          </div>
          
          <div className="bg-[rgba(10,40,70,0.5)] backdrop-blur-sm border border-cyan-500/30 rounded-xl p-4">
            <div className="flex items-center">
              <div className="bg-cyan-500/10 p-2 rounded-full mr-3">
                <div className="text-cyan-400">⏱️</div>
              </div>
              <div>
                <div className="text-cyan-300 text-sm">总监测时长</div>
                <div className="text-white text-xl font-medium">142小时</div>
              </div>
            </div>
          </div>
          
          <div className="bg-[rgba(10,40,70,0.5)] backdrop-blur-sm border border-cyan-500/30 rounded-xl p-4">
            <div className="flex items-center">
              <div className="bg-cyan-500/10 p-2 rounded-full mr-3">
                <div className="text-cyan-400">📅</div>
              </div>
              <div>
                <div className="text-cyan-300 text-sm">最近更新</div>
                <div className="text-white text-xl font-medium">2023-08-15</div>
              </div>
            </div>
          </div>
          
          <div className="bg-[rgba(10,40,70,0.5)] backdrop-blur-sm border border-cyan-500/30 rounded-xl p-4">
            <div className="flex items-center">
              <div className="bg-cyan-500/10 p-2 rounded-full mr-3">
                <div className="text-cyan-400">📹</div>
              </div>
              <div>
                <div className="text-cyan-300 text-sm">在线设备</div>
                <div className="text-white text-xl font-medium">8/12</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 视频列表 */}
        {filteredVideos.length === 0 ? (
          <motion.div 
            className="bg-[rgba(10,25,47,0.7)] backdrop-blur-md border border-cyan-500/30 rounded-xl p-12 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-cyan-300 text-6xl mb-4">📹</div>
            <h3 className="text-xl text-cyan-200 mb-2">未找到相关视频</h3>
            <p className="text-cyan-400 mb-4">请尝试其他搜索词或分类</p>
            <button 
              className="px-4 py-2 bg-cyan-600 rounded-lg text-white hover:bg-cyan-700 transition-colors"
              onClick={() => {
                setFilter('all');
                setSearchTerm('');
              }}
            >
              重置筛选
            </button>
          </motion.div>
        ) : (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {filteredVideos.map((video, index) => (
              <motion.div 
                key={index}
                className="bg-[rgba(10,25,47,0.7)] backdrop-blur-md border border-cyan-500/30 rounded-xl overflow-hidden shadow-xl shadow-cyan-500/10"
                whileHover={{ y: -5 }}
                transition={{ duration: 0.3 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                {/* 视频缩略图 */}
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={getThumbnailUrl(video)} 
                    alt={video} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a192f] to-transparent"></div>
                  <div className="absolute top-3 right-3 bg-cyan-600 text-white text-xs px-2 py-1 rounded">
                    {video.includes('研究') ? '科学研究' : 
                     video.includes('监测') ? '环境监测' : 
                     video.includes('设备') ? '设备记录' : 
                     video.includes('生物') ? '海洋生物' : '其他'}
                  </div>
                  <div className="absolute bottom-3 left-3 text-white font-medium">
                    {video.replace('.mp4', '')}
                  </div>
                </div>
                
                {/* 视频播放器 */}
                <div className="p-4">
                  <video 
                    controls 
                    className="w-full rounded-lg"
                    preload="auto"
                    crossOrigin="anonymous"
                    onLoadedMetadata={(e) => {
                      console.log('视频时长:', e.target.duration);
                    }}
                    onProgress={(e) => {
                      const buffered = e.target.buffered;
                      if (buffered.length > 0) {
                        console.log(`已缓冲至: ${buffered.end(0)}秒`);
                      }
                    }}
                  >
                    {/* 实际项目中替换为真实视频路径 */}
                    <source
                      src={`http://localhost:3001/video/${video}?cache=${Date.now()}`}
                      type="video/mp4"
                    />
                  </video>
                  
                  <div className="flex justify-between items-center mt-3">
                    <div className="text-cyan-400 text-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      03:45
                    </div>
                    <div className="text-cyan-400 text-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                      128
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* 视频上传提示 */}
        <motion.div 
          className="mt-8 bg-[rgba(10,40,70,0.5)] backdrop-blur-sm border border-cyan-500/30 rounded-xl p-6 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="text-cyan-300 mb-2">需要上传新的监控视频？</div>
          <button className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-700 rounded-lg text-white hover:opacity-90 transition-opacity">
            上传视频文件
          </button>
        </motion.div>
      </div>

      {/* 底部版权信息 */}
      <div className="absolute bottom-4 left-0 right-0 text-center text-cyan-300/50 text-xs z-10">
        智慧海洋牧场监控系统 © {new Date().getFullYear()}
      </div>
    </div>
  );
};

export default VideoList;