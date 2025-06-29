import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginForm from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';

// 自定义波浪效果组件
const WaterWave = ({ className }) => {
  return (
    <div className={`absolute bottom-0 w-full overflow-hidden ${className}`}>
      <svg 
        className="relative block w-[calc(100%+1.3px)] h-[150px]"
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
  );
};

const AuthPage = () => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const { isAuthenticated, userInfo } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/user-dashboard');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gradient-to-br from-[#0a192f] via-[#0c2a4a] to-[#0a3d62] overflow-hidden">
      {/* 背景光点效果 */}
      <div className="absolute inset-0 z-0 overflow-hidden">
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
              animationDuration: `${Math.random() * 5 + 3}s`
            }}
          />
        ))}
      </div>
      
      {/* 底部波浪效果 */}
      <WaterWave className="z-10" />
      <WaterWave className="z-10 transform scale-110 translate-y-5 opacity-70" />
      
      {/* 海洋生物装饰元素 */}
      <div className="absolute bottom-10 left-10 z-10">
        <div className="text-5xl text-cyan-300 animate-bounce" style={{ animationDuration: '3s' }}>
          🐠
        </div>
      </div>
      
      <div className="absolute top-10 right-10 z-10">
        <div className="text-4xl text-teal-300 animate-wiggle" style={{ animationDuration: '8s' }}>
          🦈
        </div>
      </div>
      
      {/* 主卡片容器 */}
      <div 
        className="relative z-20 bg-[rgba(10,25,47,0.8)] backdrop-blur-md border border-cyan-500/30 rounded-xl shadow-2xl shadow-cyan-500/20 p-10 w-full max-w-md transition-all duration-500 hover:scale-[1.02]"
        style={{ animation: 'fadeInUp 0.8s ease-out' }}
      >
        {/* 卡片发光效果 */}
        <div className="absolute inset-0 rounded-xl bg-cyan-500/10 blur-xl -z-10"></div>
        
        {/* 顶部装饰 */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
        
        {/* 标题区域 */}
        <div className="text-center mb-8 relative">
          <div className="absolute -top-10 left-1/2 transform -translate-x-1/2">
            <div className="bg-cyan-500/10 p-3 rounded-full border border-cyan-400/30">
              <div className="text-3xl text-cyan-400">
                {isLoginMode ? '🔑' : '📝'}
              </div>
            </div>
          </div>
          
          <h1 
            className="text-3xl font-bold text-white"  // 改为纯白色
            style={{ animation: 'fadeIn 0.8s ease-out 0.2s forwards', opacity: 0 }}
          >
            {isLoginMode ? '欢迎登录 AquaAI' : '注册 AquaAI 账户'}
          </h1>
          
          <p 
            className="text-white opacity-80 mt-2"  // 改为白色
            style={{ animation: 'fadeIn 0.8s ease-out 0.3s forwards', opacity: 0 }}
          >
            {isLoginMode ? '探索智能海洋养殖的无限可能' : '加入我们，开启智慧渔业之旅'}
          </p>
        </div>
        
        {/* 表单区域 */}
        <div style={{ animation: 'fadeIn 0.8s ease-out 0.4s forwards', opacity: 0 }}>
          {isLoginMode ? (
            <LoginForm 
              switchToRegister={() => setIsLoginMode(false)} 
              textColor="text-white"  // 传递白色文字属性
            />
          ) : (
            <RegisterForm 
              switchToLogin={() => setIsLoginMode(true)} 
              textColor="text-white"  // 传递白色文字属性
            />
          )}
        </div>
        
        {/* 模式切换区域 */}
        <div 
          className="mt-6 text-center text-sm text-white"  // 改为白色
          style={{ animation: 'fadeIn 0.8s ease-out 0.5s forwards', opacity: 0 }}
        >
          {isLoginMode ? (
            <p>
              还没有账户？{' '}
              <button 
                onClick={() => setIsLoginMode(false)}
                className="font-medium text-teal-300 hover:text-teal-200 transition-colors underline underline-offset-4 decoration-cyan-500/50 hover:decoration-cyan-300"
              >
                立即注册
              </button>
            </p>
          ) : (
            <p>
              已有账户？{' '}
              <button 
                onClick={() => setIsLoginMode(true)}
                className="font-medium text-teal-300 hover:text-teal-200 transition-colors underline underline-offset-4 decoration-cyan-500/50 hover:decoration-cyan-300"
              >
                立即登录
              </button>
            </p>
          )}
        </div>
        
        {/* 底部装饰 */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-teal-400 to-transparent"></div>
      </div>
      
      {/* 水波纹效果 */}
      <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-cyan-500/10 to-transparent z-0"></div>
      
      {/* 版权信息 */}
      <div className="absolute bottom-4 left-0 right-0 text-center text-white opacity-50 text-xs z-10">  {/* 改为白色 */}
        AquaAI 智能海洋养殖平台 © {new Date().getFullYear()}
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
          animation: bounce 3s infinite;
        }
        
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
      `}</style>
    </div>
  );
};

export default AuthPage;