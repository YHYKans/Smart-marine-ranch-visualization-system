"""
User模型（适配MySQL）
定义用户数据结构，包括普通用户和管理员
"""

from datetime import datetime
import re
import mysql.connector
from config.database import get_db_connection  # 假设数据库连接函数已修改

class User:
    table_name = "users"
    
    @classmethod
    def get_connection(cls):
        """获取数据库连接"""
        return get_db_connection()
    
    @staticmethod
    def create_indexes():
        """创建必要的索引（MySQL中通过DDL创建，此处仅为兼容）"""
        pass
    
    @staticmethod
    def validate_email(email):
        """验证邮箱格式"""
        email_regex = r'^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$'
        return bool(re.match(email_regex, email))
    
    @classmethod
    def find_by_id(cls, user_id):
        """根据ID查找用户"""
        conn = cls.get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE user_id = %s", (user_id,))
        user = cursor.fetchone()
        cursor.close()
        conn.close()
        if user:
            print(f"找到用户: {user}")  # 添加调试信息
        else :
            print("未找到")
        return user
    
    @classmethod
    def find_by_username(cls, username):
        """根据用户名查找用户"""
        conn = cls.get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
        user = cursor.fetchone()
        cursor.close()
        conn.close()
        return user
    
    @classmethod
    def find_by_email(cls, email):
        """根据邮箱查找用户"""
        conn = cls.get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()
        cursor.close()
        conn.close()
        return user
    
    @classmethod
    def find_by_username_or_email(cls, username, email):
        """根据用户名或邮箱查找用户"""
        conn = cls.get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT * FROM users WHERE username = %s OR email = %s",
            (username, email)
        )
        user = cursor.fetchone()
        cursor.close()
        conn.close()
        return user
    
    @classmethod
    def find_all(cls, exclude_password=True):
        """查找所有用户"""
        conn = cls.get_connection()
        cursor = conn.cursor(dictionary=True)
        query = "SELECT * FROM users"
        cursor.execute(query)
        users = cursor.fetchall()
        cursor.close()
        conn.close()
        
        # 处理密码排除
        if exclude_password:
            for user in users:
                user.pop('password_hash', None)
        return users
    
    @classmethod
    def create(cls, username, password, email, is_admin=False):
        """创建新用户"""
        # 验证数据
        if not (3 <= len(username) <= 50):
            raise ValueError("用户名长度必须在3到50个字符之间")
        
        if not cls.validate_email(email):
            raise ValueError("请提供有效的邮箱地址")
        
        conn = cls.get_connection()
        cursor = conn.cursor()
        
        try:
            # 插入用户
            cursor.execute(
                "INSERT INTO users (username, password_hash, email, is_admin, status, login_attempts, created_at) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s)",
                (
                    username.strip(),
                    password,  # 已加密
                    email.lower().strip(),
                    1 if is_admin else 0,
                    'active',
                    0,
                    datetime.now()
                )
            )
            conn.commit()
            
            # 获取自增的user_id
            user_id = cursor.lastrowid
            
            # 查询并返回用户信息
            cursor.execute("SELECT * FROM users WHERE user_id = %s", (user_id,))
            user = cursor.fetchone()
            cursor.close()
            conn.close()
            
            # 转换布尔值和时间格式（适配原模型返回格式）
            user['isAdmin'] = bool(user['is_admin'])
            user['_id'] = user['user_id']  # 兼容原模型的_id字段
            user.pop('is_admin', None)
            return user
            
        except mysql.connector.Error as err:
            conn.rollback()
            cursor.close()
            conn.close()
            raise err
    
    @classmethod
    def update_last_login(cls, user_id):
        """更新最后登录时间"""
        conn = cls.get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE users SET last_login = %s WHERE user_id = %s",
            (datetime.now(), user_id)
        )
        conn.commit()
        cursor.close()
        conn.close()
    
    @classmethod
    def username_exists(cls, username):
        """检查用户名是否存在"""
        conn = cls.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM users WHERE username = %s", (username,))
        count = cursor.fetchone()[0]
        cursor.close()
        conn.close()
        return count > 0
    
    @classmethod
    def update_user(cls, user_id, updates):
        """更新用户信息"""
        conn = cls.get_connection()
        cursor = conn.cursor()
        
        # 构建更新语句
        set_clause = ", ".join([f"{k} = %s" for k in updates.keys()])
        values = tuple(updates.values()) + (user_id,)
        
        cursor.execute(
            f"UPDATE users SET {set_clause} WHERE user_id = %s",
            values
        )
        
        modified_count = cursor.rowcount
        conn.commit()
        cursor.close()
        conn.close()
        
        return modified_count > 0