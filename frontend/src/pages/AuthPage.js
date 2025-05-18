import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginForm from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';

/**
 * AuthPage 组件 - 认证页面
 * 
 * 功能：
 * 1. 提供用户登录和注册的界面
 * 2. 支持在登录和注册模式之间切换
 * 3. 检查用户认证状态，已登录用户自动跳转到相应的仪表板
 * 4. 根据用户类型（普通用户/管理员）跳转到不同的仪表板
 * 
 * 页面结构：
 * - 渐变背景
 * - 居中的白色卡片容器
 * - 动态标题（根据模式显示"用户登录"或"用户注册"）
 * - 条件渲染登录或注册表单
 */
const AuthPage = () => {
  // 控制显示登录还是注册表单的状态
  const [isLoginMode, setIsLoginMode] = useState(true);
  
  // 从认证上下文获取认证状态和用户信息
  const { isAuthenticated, userInfo } = useAuth();
  
  // 路由导航钩子
  const navigate = useNavigate();

  /**
   * 监听认证状态变化
   * 如果用户已登录，根据用户类型自动跳转到对应的仪表板
   */
  useEffect(() => {
    if (isAuthenticated) {
      // 所有认证用户统一跳转到用户仪表板
      navigate('/user-dashboard');
    }
  }, [isAuthenticated, navigate]); 

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-100 to-purple-100">
      {/* 
        主容器卡片
        - bg-white: 白色背景
        - p-8: 内边距
        - rounded-lg: 圆角
        - shadow-lg: 阴影
        - w-96: 固定宽度
        - transition-all duration-300: 过渡动画
        - transform hover:scale-105: 悬停时轻微放大效果
      */}
      <div className="bg-white p-8 rounded-lg shadow-lg w-96 transition-all duration-300 transform hover:scale-105">
        {/* 页面标题区域 */}
        <div className="text-center mb-8">
          {/* 动态标题 - 根据当前模式显示不同文字 */}
          <h1 className="text-3xl font-bold text-gray-800">
            {isLoginMode ? '用户登录' : '用户注册'}
          </h1>
          {/* 副标题 - 根据当前模式显示不同文字 */}
          <p className="text-gray-600 mt-2">
            {isLoginMode ? '欢迎回来' : '创建新账号'}
          </p>
        </div>
        
        {/* 条件渲染登录或注册表单 */}
        {isLoginMode ? (
          <LoginForm switchToRegister={() => setIsLoginMode(false)} />
        ) : (
          <RegisterForm switchToLogin={() => setIsLoginMode(true)} />
        )}
      </div>
    </div>
  );
};

export default AuthPage;