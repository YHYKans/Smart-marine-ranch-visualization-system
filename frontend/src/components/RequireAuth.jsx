import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RequireAuth = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, userInfo } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (requireAdmin && !userInfo?.isAdmin) {
    return (
      <Navigate
        to="/error"
        state={{
          code: 403,
          message: '需要管理员权限才能访问此页面'
        }}
        replace
      />
    );
  }

  return children;
};

export default RequireAuth;  // 确保使用默认导出