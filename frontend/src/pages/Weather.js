import React, { useState, useEffect } from 'react';

// 天津的经纬度
const TIANJIN_LAT = 39.1333;
const TIANJIN_LNG = 117.2000;

// 天气代码映射（保持不变）
const weatherCodeMap = { /* ...原有映射数据... */ };

const WeatherPage = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // 获取天气数据
  const fetchWeatherData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${TIANJIN_LAT}&longitude=${TIANJIN_LNG}&hourly=temperature_2m,relativehumidity_2m,windspeed_10m,precipitation,weathercode&daily=temperature_2m_max,temperature_2m_min,weathercode&current_weather=true&timezone=auto`
      );
      
      if (!response.ok) throw new Error('网络响应异常');
      const data = await response.json();
      setWeatherData(data);
    } catch (err) {
      setError(err.message);
      console.error('获取天气数据失败:', err);
    } finally {
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

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error}</div>;

  if (!weatherData) return null;

  // 当前天气数据处理
  const current = weatherData.current_weather;
  const currentHourIndex = new Date(current.time).getHours();
  const currentWeatherInfo = weatherCodeMap[current.weathercode] || { 
    icon: 'fa-question', 
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
      return {
        day: isToday,
        maxTemp: Math.round(weatherData.daily.temperature_2m_max[index]),
        minTemp: Math.round(weatherData.daily.temperature_2m_min[index])
      };
    });

  return (
    <div className="max-w-md mx-auto p-4">
      {/* 当前天气卡片 */}
      <div className="bg-white rounded-lg shadow-md p-4 fade-in">
        <div className="text-center">
          <div className="text-sm text-neutral-500">
            {formatTime(currentTime)}
          </div>
          
          <div className="text-6xl mt-2">
            <i className={`fa-solid ${currentWeatherInfo.icon} ${currentWeatherInfo.color} animate-pulse-slow`} />
          </div>
          
          <div className="text-2xl font-bold mt-2">
            {current.temperature}°
          </div>
          
          <div className="text-sm text-neutral-600 mt-1">
            {currentWeatherInfo.desc}
          </div>
          
          <div className="flex justify-center gap-4 mt-4 text-sm">
            <div>
              <div className="text-neutral-500">风速</div>
              <div>{current.windspeed} km/h</div>
            </div>
            <div>
              <div className="text-neutral-500">降水</div>
              <div>{weatherData.hourly.precipitation[currentHourIndex]} mm</div>
            </div>
            <div>
              <div className="text-neutral-500">湿度</div>
              <div>{weatherData.hourly.relativehumidity_2m[currentHourIndex]}%</div>
            </div>
          </div>
          
          <div className="mt-4 text-sm text-neutral-600">
            今日温度：
            <span className="font-medium">
              {Math.round(weatherData.daily.temperature_2m_min[0])}° ~ 
              {Math.round(weatherData.daily.temperature_2m_max[0])}°
            </span>
          </div>
        </div>
      </div>

      {/* 未来预报 */}
      <div className="grid grid-cols-5 gap-2 mt-4">
        {forecastItems.map((item, index) => (
          <div 
            key={index}
            className="text-center bg-white rounded-lg shadow-sm p-2 fade-in"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="text-xs text-neutral-500">{item.day}</div>
            <div className="text-sm font-medium text-neutral-800 mt-1">
              {item.minTemp}°~{item.maxTemp}°
            </div>
          </div>
        ))}
      </div>

      {/* 刷新按钮 */}
      <button
        id="refresh-btn"
        className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-full shadow-md hover:scale-95 transition-transform"
        onClick={handleRefresh}
      >
        刷新
      </button>
    </div>
  );
};

export default WeatherPage;