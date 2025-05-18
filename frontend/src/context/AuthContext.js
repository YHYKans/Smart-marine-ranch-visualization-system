import React, { createContext, useContext, useState, useEffect } from 'react';

// 定义API基础URL
const API_BASE_URL = 'http://localhost:3001';

// 创建认证上下文
const AuthContext = createContext();

// 自定义 Hook，用于在组件中访问认证上下文
export const useAuth = () => useContext(AuthContext);

/**
 * AuthProvider 组件 - 认证状态管理提供者
 */
export const AuthProvider = ({ children }) => {
  // 认证状态
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // 用户信息
  const [userInfo, setUserInfo] = useState(null);
  // 加载状态
  const [loading, setLoading] = useState(true);

  /**
   * 自定义API请求函数 - 处理所有HTTP请求
   */
  const apiRequest = async (endpoint, method = 'GET', data = null) => {
    console.log(`发送请求到: ${API_BASE_URL}${endpoint}`);
    
    const config = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    };

    // 添加认证令牌（如果存在）
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }

    // 添加请求体（如果有）
    if (data) {
      config.body = JSON.stringify(data);
      console.log('请求数据:', data);
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      console.log(`收到响应: 状态码 ${response.status}`);
      
      // 处理响应内容
      const text = await response.text();
      console.log(`响应文本: ${text.substring(0, 150)}...`);
      
      let result;
      try {
        result = text ? JSON.parse(text) : {};
        console.log('解析后的响应数据:', result);
      } catch (e) {
        console.error('响应解析错误:', e);
        console.error('原始响应:', text);
        throw new Error(`无法解析响应: ${text.substring(0, 100)}...`);
      }

      if (!response.ok) {
        throw new Error(result.message || '请求失败');
      }

      return result;
    } catch (error) {
      console.error('API请求错误:', error);
      throw error;
    }
  };

  /**
   * 组件挂载时检查本地存储的认证信息
   */
  useEffect(() => {
    const checkAuth = async () => {
      // 从本地存储获取 token 和用户信息
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (token && userStr) {
        try {
          // 验证 token 是否仍然有效
          const result = await apiRequest('/api/user');
          
          // 解析存储的用户信息
          const storedUser = JSON.parse(userStr);
          console.log('存储的用户信息:', storedUser);
          
          // 确保isAdmin是布尔值
          const normalizedUser = {
            ...storedUser,
            isAdmin: Boolean(storedUser.isAdmin)
          };
          
          // token 有效，恢复登录状态
          setIsAuthenticated(true);
          setUserInfo(normalizedUser);
          
          // 更新本地存储中的用户信息（确保isAdmin是布尔值）
          localStorage.setItem('user', JSON.stringify(normalizedUser));
          
        } catch (error) {
          console.error('验证令牌时出错:', error);
          // 发生错误时清除本地存储
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      
      // 检查完成，设置 loading 为 false
      setLoading(false);
    };
    
    checkAuth();
  }, []);

  /**
   * 登录方法
   */
  const login = async (username, password, isAdmin) => {
    try {
      const data = await apiRequest('/api/login', 'POST', { 
        username, 
        password, 
        isAdmin 
      });
      
      console.log('登录响应:', data);
      
      // 确保用户信息中的isAdmin是布尔值
      const userData = {
        ...data.user,
        isAdmin: Boolean(data.user.isAdmin)
      };
      
      console.log('处理后的用户数据:', userData);
      
      // 保存 token 到本地存储
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      
      // 保存用户信息到本地存储
      localStorage.setItem('user', JSON.stringify(userData));
      
      // 更新认证状态
      setIsAuthenticated(true);
      setUserInfo(userData);
      
      return data;
    } catch (error) {
      throw error;
    }
  };

  /**
   * 注册方法
   */
  const register = async (username, email, password, isAdmin, adminCode) => {
    try {
      // 构建注册数据
      const userData = { username, email, password, isAdmin };
      
      // 如果是管理员注册，添加管理员代码
      if (isAdmin && adminCode) {
        userData.adminCode = adminCode;
      }
      
      // 发送注册请求
      const data = await apiRequest('/api/register', 'POST', userData);
      return data;
    } catch (error) {
      throw error;
    }
  };

  /**
   * 登出方法
   */
  const logout = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // 如果有 token，向服务器发送登出请求
      if (token) {
        await apiRequest('/api/logout', 'POST');
      }
    } catch (error) {
      console.error('登出请求失败:', error);
    } finally {
      // 无论请求是否成功，都清除本地认证信息
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setIsAuthenticated(false);
      setUserInfo(null);
    }
  };

  /**
   * 带认证的请求方法
   */
  const authFetch = async (url, options = {}) => {
    try {
      // 请求配置
      const config = {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      };

      // 添加认证令牌
      const token = localStorage.getItem('token');
      if (token) {
        config.headers['x-auth-token'] = token;
      }

      // 添加请求体
      if (options.body) {
        config.body = options.body;
      }

      // 发送请求
      const fullUrl = url.startsWith('/') ? `${API_BASE_URL}${url}` : url;
      console.log(`authFetch请求: ${fullUrl}`);
      
      const response = await fetch(fullUrl, config);
      console.log(`authFetch响应状态: ${response.status}`);
      
      // 特别处理401错误
      if (response.status === 401) {
        logout();
        throw new Error('会话已过期，请重新登录');
      }
      
      // 返回完整的response对象，包括status
      return {
        ok: response.ok,
        status: response.status,
        json: async () => {
          const text = await response.text();
          try {
            return text ? JSON.parse(text) : {};
          } catch (e) {
            console.error('响应解析错误:', e);
            return { message: text };
          }
        }
      };
    } catch (error) {
      console.error('authFetch错误:', error);
      return {
        ok: false,
        status: 500,
        json: async () => ({ message: error.message })
      };
    }
  };

  // 提供给子组件的值
  const value = {
    isAuthenticated,
    userInfo,
    loading,
    login,
    register,
    logout,
    authFetch
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};