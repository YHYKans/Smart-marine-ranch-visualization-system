"""
AuthLog模型
用于记录用户认证相关的操作日志，如登录、注册、登出和密码重置
"""

from datetime import datetime, timedelta
from config.database import get_db

class AuthLog:
    collection = None
    
    @classmethod
    def get_collection(cls):
        """获取日志集合"""
        if cls.collection is None:
            cls.collection = get_db().auth_logs
        return cls.collection
    
    @staticmethod
    def create_indexes():
        """创建必要的索引"""
        AuthLog.get_collection().create_index('username')
        AuthLog.get_collection().create_index('timestamp')
        AuthLog.get_collection().create_index('successful')
    
    @classmethod
    def create(cls, username, action, user_type, successful, ip_address=None, user_agent=None, failure_reason=None):
        """
        创建新的认证日志
        
        Args:
            username (str): 用户名
            action (str): 操作类型 (login, register, logout, password_reset)
            user_type (str): 用户类型 (user, admin)
            successful (bool): 操作是否成功
            ip_address (str, optional): IP地址
            user_agent (str, optional): 用户代理信息
            failure_reason (str, optional): 失败原因
        
        Returns:
            str: 日志ID
        """
        # 验证数据
        if action not in ['login', 'register', 'logout', 'password_reset']:
            raise ValueError("无效的操作类型")
        
        if user_type not in ['user', 'admin']:
            raise ValueError("无效的用户类型")
        
        # 创建日志文档
        log = {
            'username': username,
            'action': action,
            'userType': user_type,
            'timestamp': datetime.now(),
            'successful': successful,
            'ipAddress': ip_address,
            'userAgent': user_agent,
            'failureReason': failure_reason
        }
        
        # 插入数据库并返回ID
        result = cls.get_collection().insert_one(log)
        return str(result.inserted_id)
    
    @classmethod
    def get_recent_logs(cls, username=None, limit=100):
        """
        获取最近的日志
        
        Args:
            username (str, optional): 如果提供，只返回该用户的日志
            limit (int, optional): 返回日志的最大数量，默认为100
        
        Returns:
            list: 日志列表
        """
        query = {} if username is None else {'username': username}
        logs = list(cls.get_collection().find(
            query,
            sort=[('timestamp', -1)],
            limit=limit
        ))
        
        # 转换ObjectId和日期为字符串，以便JSON序列化
        for log in logs:
            log['_id'] = str(log['_id'])
            log['timestamp'] = log['timestamp'].isoformat()
        
        return logs
    
    @classmethod
    def get_failed_attempts(cls, username, time_window=24):
        """
        获取指定用户在给定时间窗口内的失败尝试次数
        
        Args:
            username (str): 用户名
            time_window (int, optional): 时间窗口（小时），默认为24小时
        
        Returns:
            int: 失败尝试次数
        """
        # 计算时间阈值（当前时间减去指定的小时数）
        time_threshold = datetime.now() - timedelta(hours=time_window)
        
        # 查询失败尝试
        count = cls.get_collection().count_documents({
            'username': username,
            'successful': False,
            'timestamp': {'$gte': time_threshold}
        })
        
        return count