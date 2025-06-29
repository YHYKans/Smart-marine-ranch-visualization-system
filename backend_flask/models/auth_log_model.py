"""
AuthLog模型（适配MySQL）
用于记录用户认证相关的操作日志
"""

from datetime import datetime
import mysql.connector
from config.database import get_db_connection
from models.user import User  # 导入修改后的User模型

class AuthLog:
    table_name = "auth_logs"
    
    @classmethod
    def get_connection(cls):
        """获取数据库连接"""
        return get_db_connection()
    
    @staticmethod
    def create_indexes():
        """创建必要的索引（MySQL中通过DDL创建，此处仅为兼容）"""
        pass
    
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
            int: 日志ID
        """
        # 验证数据
        if action not in ['login', 'register', 'logout', 'password_reset']:
            raise ValueError("无效的操作类型")
        
        if user_type not in ['user', 'admin']:
            raise ValueError("无效的用户类型")
        
        conn = cls.get_connection()
        cursor = conn.cursor()
        
        try:
            # 获取用户ID
            user = User.find_by_username(username)
            if not user:
                raise ValueError(f"用户 {username} 不存在")
            
            user_id = user['user_id']
            
            # 插入日志
            cursor.execute(
                "INSERT INTO auth_logs (user_id, username, action, user_type, successful, ip_address, user_agent, failure_reason) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
                (
                    user_id,
                    username,
                    action,
                    user_type,
                    1 if successful else 0,
                    ip_address,
                    user_agent,
                    failure_reason
                )
            )
            conn.commit()
            log_id = cursor.lastrowid
            cursor.close()
            conn.close()
            return log_id
            
        except mysql.connector.Error as err:
            conn.rollback()
            cursor.close()
            conn.close()
            raise err
    
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
        conn = cls.get_connection()
        cursor = conn.cursor(dictionary=True)
        
        query = "SELECT * FROM auth_logs"
        params = []
        
        if username:
            query += " WHERE username = %s"
            params.append(username)
        
        query += " ORDER BY timestamp DESC LIMIT %s"
        params.append(limit)
        
        cursor.execute(query, params)
        logs = cursor.fetchall()
        cursor.close()
        conn.close()
        
        # 转换布尔值和时间格式
        for log in logs:
            log['successful'] = bool(log['successful'])
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
        conn = cls.get_connection()
        cursor = conn.cursor()
        
        # 计算时间阈值
        time_threshold = (datetime.now() - datetime.timedelta(hours=time_window)).isoformat()
        
        cursor.execute(
            "SELECT COUNT(*) FROM auth_logs "
            "WHERE username = %s AND successful = 0 AND timestamp >= %s",
            (username, time_threshold)
        )
        count = cursor.fetchone()[0]
        cursor.close()
        conn.close()
        
        return count