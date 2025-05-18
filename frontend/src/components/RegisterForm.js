import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const RegisterForm = ({ switchToLogin }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { register } = useAuth();
  
  useEffect(() => {
    if (countdown !== null) {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        switchToLogin();
      }
    }
  }, [countdown, switchToLogin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    console.log(`准备发送请求到: ${window.location.origin}/api/register`);
    if (password !== confirmPassword) {
      setMessage('两次输入的密码不一致');
      setIsLoading(false);
      return;
    }
    
    try {
      await register(username, email, password, isAdmin, adminCode);
      setMessage('注册成功！5秒后跳转到登录页面...');
      setCountdown(5);
    } catch (error) {
      setMessage(error.message || '注册失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {message && (
        <div className={`mb-4 p-2 rounded ${message.includes('成功') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message}
          {countdown !== null && <span> ({countdown})</span>}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <div className="flex items-center space-x-4 mb-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                checked={!isAdmin}
                onChange={() => setIsAdmin(false)}
                className="form-radio h-5 w-5 text-blue-600"
              />
              <span className="ml-2 text-gray-700">普通用户</span>
            </label>
            
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
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="reg-username">
            用户名
          </label>
          <input
            id="reg-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
            电子邮箱
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="reg-password">
            密码
          </label>
          <input
            id="reg-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirm-password">
            确认密码
          </label>
          <input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        {isAdmin && (
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="adminCode">
              内部注册码
            </label>
            <input
              id="adminCode"
              type="text"
              value={adminCode}
              onChange={(e) => setAdminCode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        )}
        
        <div className="mb-6">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-300 disabled:opacity-50"
          >
            {isLoading ? '注册中...' : '注册'}
          </button>
        </div>
      </form>
      
      <div className="text-center text-sm">
        <button
          onClick={switchToLogin}
          className="text-blue-600 hover:text-blue-800 focus:outline-none"
          disabled={countdown !== null}
        >
          已有账号？前往登录
        </button>
      </div>
    </>
  );
};

export default RegisterForm;