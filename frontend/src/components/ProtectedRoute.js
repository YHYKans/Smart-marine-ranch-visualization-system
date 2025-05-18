import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute 组件 - 受保护的路由组件
 * 
 * 功能：
 * 1. 保护需要认证才能访问的页面
 * 2. 支持基于用户角色的访问控制（普通用户 vs 管理员）
 * 3. 未认证用户自动重定向到登录页面
 * 4. 普通用户访问管理员页面时重定向到用户仪表板
 * 
 * Props:
 * - children: 需要保护的子组件
 * - requireAdmin: 是否需要管理员权限（默认为 false）
 */
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  // 从认证上下文获取认证状态、用户信息和加载状态
  const { isAuthenticated, userInfo, loading } = useAuth();

  // 调试日志
  console.log('ProtectedRoute - 是否需要管理员权限:', requireAdmin);
  console.log('ProtectedRoute - 用户信息:', userInfo);
  console.log('ProtectedRoute - 用户是否认证:', isAuthenticated);
  if (userInfo) {
    console.log('ProtectedRoute - 用户是否为管理员:', Boolean(userInfo.isAdmin));
  }

  // 如果正在加载认证状态，显示加载指示器
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  // 如果用户未认证，重定向到登录页面
  if (!isAuthenticated) {
    console.log('ProtectedRoute - 用户未认证，重定向到登录页面');
    return <Navigate to="/auth" />;
  }
  
  // 如果需要管理员权限但用户不是管理员，重定向到用户仪表板
  if (requireAdmin && !userInfo.isAdmin) {
    console.log('ProtectedRoute - 用户不是管理员，重定向到用户仪表板');
    return <Navigate to="/user-dashboard" />;
  }

  // 所有检查通过，渲染受保护的子组件
  console.log('ProtectedRoute - 所有检查通过，渲染子组件');
  return children;
};

export default ProtectedRoute;