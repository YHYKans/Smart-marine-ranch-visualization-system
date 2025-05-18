"""
User模型
定义用户数据结构，包括普通用户和管理员
"""

from datetime import datetime
import re
from bson import ObjectId
from config.database import get_db

class User:
    collection = None
    
    @classmethod
    def get_collection(cls):
        """获取用户集合"""
        if cls.collection is None:
            cls.collection = get_db().users
        return cls.collection
    
    @staticmethod
    def create_indexes():
        """创建必要的索引"""
        User.get_collection().create_index('username', unique=True)
        User.get_collection().create_index('email', unique=True)
    
    @staticmethod
    def validate_email(email):
        """验证邮箱格式"""
        # 邮箱格式验证正则表达式
        email_regex = r'^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$'
        return bool(re.match(email_regex, email))
    
    @classmethod
    def find_by_id(cls, user_id):
        """根据ID查找用户"""
        return cls.get_collection().find_one({'_id': ObjectId(user_id)})
    
    @classmethod
    def find_by_username(cls, username):
        """根据用户名查找用户"""
        return cls.get_collection().find_one({'username': username})
    
    @classmethod
    def find_by_email(cls, email):
        """根据邮箱查找用户"""
        return cls.get_collection().find_one({'email': email})
    
    @classmethod
    def find_by_username_or_email(cls, username, email):
        """根据用户名或邮箱查找用户"""
        return cls.get_collection().find_one({
            '$or': [{'username': username}, {'email': email}]
        })
    
    @classmethod
    def find_all(cls, exclude_password=True):
        """查找所有用户"""
        projection = {'password': 0} if exclude_password else None
        users = list(cls.get_collection().find({}, projection))
        # 转换ObjectId为字符串，以便JSON序列化
        for user in users:
            user['_id'] = str(user['_id'])
        return users
    
    @classmethod
    def create(cls, username, password, email, is_admin=False):
        """创建新用户"""
        # 验证数据
        if not (3 <= len(username) <= 50):
            raise ValueError("用户名长度必须在3到50个字符之间")
        
        if not cls.validate_email(email):
            raise ValueError("请提供有效的邮箱地址")
        
        # 创建用户文档
        user = {
            'username': username.strip(),
            'password': password,  # 已经在外部加密
            'email': email.lower().strip(),
            'isAdmin': is_admin,
            'createdAt': datetime.now(),
            'lastLogin': None,
            'status': 'active',
            'loginAttempts': 0
        }
        
        # 插入数据库并返回ID
        result = cls.get_collection().insert_one(user)
        user['_id'] = str(result.inserted_id)
        return user
    
    @classmethod
    def update_last_login(cls, user_id):
        """更新最后登录时间"""
        cls.get_collection().update_one(
            {'_id': ObjectId(user_id)},
            {'$set': {'lastLogin': datetime.now()}}
        )

    @classmethod
    def username_exists(cls, username):
        """检查用户名是否存在"""
        return get_db().users.find_one({"username": username}) is not None

    @classmethod
    def update_user(cls, user_id, updates):
        """更新用户信息"""
        result = get_db().users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": updates}
        )
        return result.modified_count > 0