import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * LoginForm 组件 - 登录表单
 * 
 * 功能：
 * 1. 提供用户名和密码输入字段
 * 2. 支持普通用户和管理员登录模式切换
 * 3. 表单验证和提交
 * 4. 显示登录状态和错误信息
 * 5. 提供跳转到注册页面的链接
 * 
 * Props:
 * - switchToRegister: 切换到注册模式的回调函数
 */
const LoginForm = ({ switchToRegister }) => {
  // 用户类型状态：false = 普通用户，true = 管理员
  const [isAdmin, setIsAdmin] = useState(false);
  // 用户名输入状态
  const [username, setUsername] = useState('');
  // 密码输入状态
  const [password, setPassword] = useState('');
  // 消息状态（用于显示错误或成功信息）
  const [message, setMessage] = useState('');
  // 加载状态（登录请求进行中时显示）
  const [isLoading, setIsLoading] = useState(false);
  
  // 从认证上下文获取登录方法
  const { login } = useAuth();

  /**
   * 处理表单提交
   * @param {Event} e - 表单提交事件
   */
  const handleSubmit = async (e) => {
    e.preventDefault(); // 阻止表单默认提交行为
    setIsLoading(true);  // 设置加载状态
    setMessage('');      // 清空之前的消息
    
    try {
      // 调用登录方法
      await login(username, password, isAdmin);
      // 登录成功后，AuthContext 会自动处理状态更新和路由跳转
    } catch (error) {
      // 登录失败，显示错误信息
      setMessage(error.message || '登录失败');
    } finally {
      // 无论成功或失败，都取消加载状态
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* 错误消息显示区域 */}
      {message && (
        <div className="mb-4 p-2 rounded bg-red-100 text-red-700">
          {message}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        {/* 用户类型选择区域 */}
        <div className="mb-4">
          <div className="flex items-center space-x-4 mb-4">
            {/* 普通用户选项 */}
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                checked={!isAdmin}
                onChange={() => setIsAdmin(false)}
                className="form-radio h-5 w-5 text-blue-600"
              />
              <span className="ml-2 text-gray-700">普通用户</span>
            </label>
            
            {/* 管理员选项 */}
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                checked={isAdmin}
                onChange={() => setIsAdmin(true)}
                className="form-radio h-5 w-5 text-blue-600"
              />
              <span className="ml-2 text-gray-700">管理员</span>
            </label>
          </div>
        </div>
        
        {/* 用户名输入字段 */}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
            用户名
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        {/* 密码输入字段 */}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
            密码
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        {/* 登录按钮 */}
        <div className="mb-6">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-300 disabled:opacity-50"
          >
            {isLoading ? '登录中...' : '登录'}
          </button>
        </div>
      </form>
      
      {/* 跳转到注册页面的链接 */}
      <div className="text-center text-sm">
        <button
          onClick={switchToRegister}
          className="text-blue-600 hover:text-blue-800 focus:outline-none"
        >
          没有账号？立即注册
        </button>
      </div>
    </>
  );
};

export default LoginForm;