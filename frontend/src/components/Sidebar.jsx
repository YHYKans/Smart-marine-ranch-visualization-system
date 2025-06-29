import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Layout, Menu, Avatar, Divider, Tooltip } from 'antd';
import { 
  DashboardOutlined, 
  EnvironmentOutlined, 
  LineChartOutlined, 
  RobotOutlined, 
  SettingOutlined,
  VideoCameraOutlined,
  CloudOutlined,
  CommentOutlined,
  ScanOutlined,
  BulbOutlined
} from '@ant-design/icons';

const { Sider } = Layout;

const menuConfig = [
  { 
    title: 'Dashboard', 
    path: '/user-dashboard', 
    icon: <DashboardOutlined style={{ fontSize: '20px' }} />,
    adminOnly: false,
    description: '系统概览'
  },
  { 
    title: 'Underwater', 
    path: '/underwater', 
    icon: <EnvironmentOutlined style={{ fontSize: '20px' }} />,
    adminOnly: false,
    description: '水下环境监测'
  },
  { 
    title: 'FishVisualization', 
    path: '/fish', 
    icon: <LineChartOutlined style={{ fontSize: '20px' }} />,
    adminOnly: false,
    description: '鱼类数据可视化'
  },
  { 
    title: 'Fish Prediction', 
    path: '/fish-length-prediction', 
    icon: <BulbOutlined style={{ fontSize: '20px' }} />,
    adminOnly: false,
    description: 'AI鱼类生长预测'
  },
  { 
    title: 'FishRecognition', 
    path: '/FishRecognition', 
    icon: <ScanOutlined style={{ fontSize: '20px' }} />,
    adminOnly: false,
    description: 'AI鱼类识别'
  },
  { 
    title: 'AI Chat', 
    path: '/Chat', 
    icon: <CommentOutlined style={{ fontSize: '20px' }} />,
    adminOnly: false,
    description: '智能养殖助手'
  },
  { 
    title: 'Quality Check', 
    path: '/Check', 
    icon: <ScanOutlined style={{ fontSize: '20px' }} />,
    adminOnly: false,
    description: '水质检测分析'
  },
  { 
    title: 'Weather', 
    path: '/weather', 
    icon: <CloudOutlined style={{ fontSize: '20px' }} />,
    adminOnly: false,
    description: '养殖气象服务'
  },
  { 
    title: 'Video', 
    path: '/video', 
    icon: <VideoCameraOutlined style={{ fontSize: '20px' }} />,
    adminOnly: false,
    description: '水下实时监控'
  },
  { 
    title: 'Admin', 
    path: '/admin-dashboard', 
    icon: <SettingOutlined style={{ fontSize: '20px' }} />,
    adminOnly: true,
    description: '系统管理'
  }
];

export default function Sidebar({ isOpen, isMobile, onClose }) {
  const { userInfo } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  
  const filteredMenu = menuConfig.filter(item => 
    !item.adminOnly || (item.adminOnly && userInfo?.isAdmin)
  );

  return (
    <>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={250}
        theme="dark"
        className="tech-ocean-sidebar"
        style={{
          background: 'linear-gradient(160deg, #001529 0%, #003366 100%)',
          borderRight: '1px solid rgba(0, 227, 255, 0.2)',
          boxShadow: '0 0 20px rgba(0, 195, 255, 0.3)',
          position: 'fixed',
          height: '100vh',
          zIndex: 100,
          overflow: 'auto',
          top: 0,
          left: 0,
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease-in-out'
        }}
      >
        {/* Logo 区域 */}
        <div className="sidebar-header" style={{ 
          padding: '24px 16px', 
          textAlign: 'center',
          borderBottom: '1px solid rgba(0, 227, 255, 0.2)'
        }}>
          <div className="logo-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{
              width: '50px',
              height: '50px',
              background: 'linear-gradient(135deg, #00c6ff, #0072ff)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '10px',
              boxShadow: '0 0 15px rgba(0, 198, 255, 0.7)'
            }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L15 9L22 9L16 14L18 22L12 17L6 22L8 14L2 9L9 9L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div style={{ display: collapsed ? 'none' : 'block' }}>
              <h1 style={{ 
                color: 'white', 
                fontSize: '20px', 
                fontWeight: 'bold',
                margin: 0,
                background: 'linear-gradient(to right, #00c6ff, #0072ff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                AquaTech AI
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', margin: '4px 0 0' }}>智能海洋养殖系统</p>
            </div>
          </div>
        </div>

        {/* 用户信息 */}
        <div style={{ padding: '16px', display: collapsed ? 'none' : 'block' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            padding: '10px',
            background: 'rgba(0, 100, 150, 0.2)',
            borderRadius: '8px',
            border: '1px solid rgba(0, 227, 255, 0.2)'
          }}>
            <Avatar 
              size="large" 
              src="https://randomuser.me/api/portraits/men/32.jpg" 
              style={{ backgroundColor: '#00c6ff' }} 
            />
            <div style={{ marginLeft: '12px' }}>
              <div style={{ color: 'white', fontWeight: 500 }}>{userInfo?.name || '养殖管理员'}</div>
              <div style={{ color: 'rgba(0, 227, 255, 0.8)', fontSize: '12px' }}>
                {userInfo?.isAdmin ? '系统管理员' : '养殖场操作员'}
              </div>
            </div>
          </div>
        </div>

        {/* 菜单项 */}
        <Menu
          theme="dark"
          mode="inline"
          style={{
            background: 'transparent',
            borderRight: 'none',
            padding: '0 8px'
          }}
        >
          {filteredMenu.map(item => (
            <Menu.Item 
              key={item.path} 
              icon={item.icon}
              style={{
                height: '60px',
                margin: '8px 0',
                borderRadius: '8px',
                transition: 'all 0.3s'
              }}
            >
              <NavLink
                to={item.path}
                onClick={isMobile ? onClose : undefined}
                style={{ display: 'flex', alignItems: 'center' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ 
                    color: 'white', 
                    fontWeight: 500,
                    fontSize: '14px'
                  }}>{item.title}</span>
                  <span style={{ 
                    color: 'rgba(255,255,255,0.6)', 
                    fontSize: '12px',
                    marginTop: '2px'
                  }}>{item.description}</span>
                </div>
              </NavLink>
            </Menu.Item>
          ))}
        </Menu>

        {/* 底部装饰 */}
        {!collapsed && (
          <div style={{ 
            position: 'absolute', 
            bottom: '20px', 
            left: 0, 
            right: 0, 
            textAlign: 'center',
            color: 'rgba(255,255,255,0.4)',
            fontSize: '12px'
          }}>
            <Divider style={{ background: 'rgba(255,255,255,0.1)' }} />
            <p>AquaTech AI System v2.0</p>
          </div>
        )}
      </Sider>

      {isMobile && isOpen && (
        <div 
          className="sidebar-overlay"
          onClick={onClose}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 10, 30, 0.7)',
            backdropFilter: 'blur(3px)',
            zIndex: 99
          }}
        />
      )}

      <style jsx global>{`
        .tech-ocean-sidebar .ant-menu-item {
          position: relative;
          overflow: hidden;
        }
        
        .tech-ocean-sidebar .ant-menu-item:before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          width: 3px;
          background: linear-gradient(to bottom, #00c6ff, #0072ff);
          transform: translateX(-100%);
          transition: transform 0.3s;
        }
        
        .tech-ocean-sidebar .ant-menu-item:hover:before,
        .tech-ocean-sidebar .ant-menu-item-selected:before {
          transform: translateX(0);
        }
        
        .tech-ocean-sidebar .ant-menu-item:hover {
          background: rgba(0, 150, 200, 0.2) !important;
          box-shadow: 0 0 10px rgba(0, 195, 255, 0.3);
        }
        
        .tech-ocean-sidebar .ant-menu-item-selected {
          background: rgba(0, 100, 180, 0.3) !important;
          border: 1px solid rgba(0, 227, 255, 0.3);
        }
        
        .tech-ocean-sidebar .ant-menu-title-content {
          display: flex;
          align-items: center;
        }
        
        .tech-ocean-sidebar::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: 
            radial-gradient(rgba(0, 227, 255, 0.1) 1px, transparent 1px),
            radial-gradient(rgba(0, 227, 255, 0.05) 1px, transparent 1px);
          background-size: 30px 30px;
          background-position: 0 0, 15px 15px;
          pointer-events: none;
          opacity: 0.4;
        }
        
        .tech-ocean-sidebar .ant-menu-item .ant-menu-item-icon {
          min-width: 24px;
          margin-right: 12px;
          color: #00c6ff;
        }
        
        .tech-ocean-sidebar .ant-menu-item-selected .ant-menu-item-icon {
          color: white;
        }
      `}</style>
    </>
  );
}