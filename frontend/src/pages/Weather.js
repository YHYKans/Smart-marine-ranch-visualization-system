import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// 天气代码映射
const weatherCodeMap = {
  0: { icon: '☀️', color: 'text-yellow-400', desc: '晴天' },
  1: { icon: '🌤️', color: 'text-blue-300', desc: '少云' },
  2: { icon: '⛅', color: 'text-blue-400', desc: '部分多云' },
  3: { icon: '☁️', color: 'text-gray-400', desc: '多云' },
  45: { icon: '🌫️', color: 'text-gray-300', desc: '雾' },
  48: { icon: '❄️', color: 'text-blue-200', desc: '冻雾' },
  51: { icon: '🌧️', color: 'text-blue-400', desc: '小雨' },
  53: { icon: '🌧️', color: 'text-blue-500', desc: '中雨' },
  55: { icon: '🌧️', color: 'text-blue-600', desc: '大雨' },
  56: { icon: '🌨️', color: 'text-blue-300', desc: '冻雨' },
  57: { icon: '🌨️', color: 'text-blue-400', desc: '强冻雨' },
  61: { icon: '🌧️', color: 'text-blue-500', desc: '小雨' },
  63: { icon: '🌧️', color: 'text-blue-600', desc: '中雨' },
  65: { icon: '⛈️', color: 'text-blue-700', desc: '大雨' },
  71: { icon: '🌨️', color: 'text-gray-200', desc: '小雪' },
  73: { icon: '🌨️', color: 'text-gray-300', desc: '中雪' },
  75: { icon: '❄️', color: 'text-gray-400', desc: '大雪' },
  77: { icon: '❄️', color: 'text-gray-300', desc: '冰粒' },
  80: { icon: '🌧️', color: 'text-blue-500', desc: '阵雨' },
  81: { icon: '🌧️', color: 'text-blue-600', desc: '强阵雨' },
  82: { icon: '⛈️', color: 'text-blue-700', desc: '暴雨' },
  85: { icon: '🌨️', color: 'text-gray-300', desc: '阵雪' },
  86: { icon: '❄️', color: 'text-gray-400', desc: '强阵雪' },
  95: { icon: '⛈️', color: 'text-purple-500', desc: '雷暴' },
  96: { icon: '⛈️', color: 'text-purple-600', desc: '小冰雹雷暴' },
  99: { icon: '⛈️', color: 'text-purple-700', desc: '大冰雹雷暴' }
};

// 天津的经纬度
const TIANJIN_LAT = 39.1333;
const TIANJIN_LNG = 117.2000;

const WeatherPage = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [background, setBackground] = useState('bg-gradient-to-br from-cyan-500 to-blue-700');

  // 获取天气数据
  const fetchWeatherData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 模拟API响应
      setTimeout(() => {
        const mockData = {
          current_weather: {
            temperature: 28,
            windspeed: 12,
            weathercode: 0,
            time: "2023-08-15T14:00"
          },
          hourly: {
            precipitation: [0, 0, 0, 0.2, 0.1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            relativehumidity_2m: [65, 67, 68, 70, 72, 75, 77, 80, 82, 80, 78, 76, 74, 72, 70, 68, 66, 64, 62, 60, 58, 56, 54, 52]
          },
          daily: {
            time: ["2023-08-15", "2023-08-16", "2023-08-17", "2023-08-18", "2023-08-19"],
            temperature_2m_max: [32, 31, 30, 29, 33],
            temperature_2m_min: [24, 23, 22, 21, 25],
            weathercode: [0, 1, 2, 3, 80]
          }
        };
        setWeatherData(mockData);
        setLoading(false);
      }, 800);
      
      // 实际API调用（注释掉）
      /*
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${TIANJIN_LAT}&longitude=${TIANJIN_LNG}&hourly=temperature_2m,relativehumidity_2m,windspeed_10m,precipitation,weathercode&daily=temperature_2m_max,temperature_2m_min,weathercode&current_weather=true&timezone=auto`
      );
      
      if (!response.ok) throw new Error('网络响应异常');
      const data = await response.json();
      setWeatherData(data);
      setLoading(false);
      */
    } catch (err) {
      setError(err.message);
      console.error('获取天气数据失败:', err);
      setLoading(false);
    }
  };

  // 更新当前时间
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  // 自动刷新天气数据
  useEffect(() => {
    fetchWeatherData();
    const refreshTimer = setInterval(fetchWeatherData, 30 * 60 * 1000);
    
    return () => clearInterval(refreshTimer);
  }, []);

  // 处理刷新按钮点击
  const handleRefresh = () => {
    fetchWeatherData();
  };

  // 格式化日期显示
  const formatTime = (date) => {
    const options = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    };
    return date.toLocaleString('zh-CN', options);
  };

  // 根据天气状态更新背景
  useEffect(() => {
    if (!weatherData) return;
    
    const code = weatherData.current_weather.weathercode;
    
    if (code === 0 || code === 1) {
      setBackground('bg-gradient-to-br from-sky-400 to-blue-600');
    } else if (code >= 2 && code <= 3) {
      setBackground('bg-gradient-to-br from-gray-400 to-gray-700');
    } else if (code >= 51 && code <= 65) {
      setBackground('bg-gradient-to-br from-blue-500 to-blue-800');
    } else if (code >= 71 && code <= 86) {
      setBackground('bg-gradient-to-br from-gray-200 to-gray-500');
    } else if (code >= 95 && code <= 99) {
      setBackground('bg-gradient-to-br from-purple-600 to-gray-800');
    } else {
      setBackground('bg-gradient-to-br from-cyan-500 to-blue-700');
    }
  }, [weatherData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a192f] to-[#0a3d62]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-400 mx-auto"></div>
          <p className="mt-4 text-cyan-200">正在获取天气数据...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a192f] to-[#0a3d62]">
        <div className="text-center p-6 bg-red-900/30 backdrop-blur-sm border border-red-500/30 rounded-xl max-w-md">
          <h2 className="text-xl font-bold text-red-300 mb-2">数据加载失败</h2>
          <p className="text-red-200 mb-4">{error}</p>
          <button 
            onClick={handleRefresh}
            className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  if (!weatherData) return null;

  // 当前天气数据处理
  const current = weatherData.current_weather;
  const currentHourIndex = new Date().getHours();
  const currentWeatherInfo = weatherCodeMap[current.weathercode] || { 
    icon: '❓', 
    color: 'text-gray-500', 
    desc: '未知' 
  };

  // 未来5天天气预报处理
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const forecastItems = weatherData.daily.time
    .slice(0, 5)
    .map((dateStr, index) => {
      const forecastDate = new Date(dateStr);
      const isToday = index === 0 ? '今天' : weekdays[forecastDate.getDay()];
      const weatherInfo = weatherCodeMap[weatherData.daily.weathercode[index]] || { 
        icon: '❓', 
        color: 'text-gray-500'
      };
      
      return {
        day: isToday,
        maxTemp: Math.round(weatherData.daily.temperature_2m_max[index]),
        minTemp: Math.round(weatherData.daily.temperature_2m_min[index]),
        icon: weatherInfo.icon,
        color: weatherInfo.color
      };
    });

  return (
    <div className={`min-h-screen ${background} transition-colors duration-1000 p-4 relative overflow-hidden`}>
      {/* 海洋背景装饰 */}
      <div className="absolute inset-0 z-0">
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
          className="text-4xl text-white opacity-30"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          🐠
        </motion.div>
      </div>
      
      <div className="absolute bottom-20 left-10 z-10">
        <motion.div 
          className="text-5xl text-white opacity-30"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
        >
          🐢
        </motion.div>
      </div>

      <div className="max-w-md mx-auto relative z-10">
        {/* 标题和时间 */}
        <motion.div 
          className="text-center pt-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl font-bold text-white mb-1">天津海洋牧场气象站</h1>
          <p className="text-cyan-100 text-sm mb-4">{formatTime(currentTime)}</p>
        </motion.div>

        {/* 当前天气卡片 */}
        <motion.div 
          className="bg-[rgba(255,255,255,0.15)] backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-2xl shadow-blue-900/30"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-4xl mb-2">
                <span className={currentWeatherInfo.color}>{currentWeatherInfo.icon}</span>
              </div>
              <div className="text-white font-medium">{currentWeatherInfo.desc}</div>
            </div>
            
            <div>
              <div className="text-6xl font-bold text-white">
                {current.temperature}°
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-[rgba(255,255,255,0.2)] backdrop-blur rounded-xl p-3 text-center">
              <div className="text-cyan-100 text-sm mb-1">风速</div>
              <div className="text-white font-medium">{current.windspeed} km/h</div>
            </div>
            
            <div className="bg-[rgba(255,255,255,0.2)] backdrop-blur rounded-xl p-3 text-center">
              <div className="text-cyan-100 text-sm mb-1">降水</div>
              <div className="text-white font-medium">
                {weatherData.hourly.precipitation[currentHourIndex] || 0} mm
              </div>
            </div>
            
            <div className="bg-[rgba(255,255,255,0.2)] backdrop-blur rounded-xl p-3 text-center">
              <div className="text-cyan-100 text-sm mb-1">湿度</div>
              <div className="text-white font-medium">
                {weatherData.hourly.relativehumidity_2m[currentHourIndex] || 0}%
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-white/20 text-center">
            <div className="text-cyan-100 text-sm">今日温度范围</div>
            <div className="text-white font-medium">
              {Math.round(weatherData.daily.temperature_2m_min[0])}° ~ 
              {Math.round(weatherData.daily.temperature_2m_max[0])}°
            </div>
          </div>
        </motion.div>

        {/* 未来预报 */}
        <motion.div 
          className="mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h2 className="text-white font-medium mb-3 ml-1">未来5天预报</h2>
          <div className="grid grid-cols-5 gap-2">
            {forecastItems.map((item, index) => (
              <motion.div 
                key={index}
                className="text-center bg-[rgba(255,255,255,0.15)] backdrop-blur-sm border border-white/20 rounded-xl p-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="text-xs text-cyan-100">{item.day}</div>
                <div className="text-lg my-1">{item.icon}</div>
                <div className="text-sm text-white">
                  {item.minTemp}°<span className="text-cyan-100">/</span>{item.maxTemp}°
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* 气象信息卡片 */}
        <motion.div 
          className="mt-6 bg-[rgba(255,255,255,0.15)] backdrop-blur-sm border border-white/20 rounded-2xl p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <h3 className="text-white font-medium mb-3">海洋气象建议</h3>
          <div className="text-cyan-100 text-sm">
            <p className="mb-2">• 当前海况适宜养殖作业，建议进行常规投喂</p>
            <p className="mb-2">• 未来24小时无恶劣天气，可安排海上巡视</p>
            <p>• 水温适宜鱼类生长，保持正常养殖密度</p>
          </div>
        </motion.div>
      </div>

      {/* 刷新按钮 */}
      <motion.button
        className="fixed bottom-6 right-6 bg-cyan-600 text-white w-12 h-12 rounded-full shadow-lg z-20 flex items-center justify-center"
        onClick={handleRefresh}
        whileHover={{ scale: 1.1, rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </motion.button>

      {/* 底部波浪装饰 */}
      <div className="absolute bottom-0 left-0 right-0 h-20 z-0">
        <div className="absolute top-0 left-0 right-0 h-full bg-gradient-to-t from-blue-900/30 to-transparent"></div>
      </div>
    </div>
  );
};

export default WeatherPage;