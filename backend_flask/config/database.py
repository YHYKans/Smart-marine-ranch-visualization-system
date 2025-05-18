"""
数据库连接模块
负责连接到MongoDB数据库
"""

from flask_pymongo import PyMongo
from pymongo import MongoClient
from dotenv import load_dotenv
import os
import sys

# 加载环境变量
load_dotenv()

# MongoDB客户端实例
mongo_client = None
db = None

def init_db():
    """
    连接数据库的函数
    尝试连接到MongoDB，成功则输出连接信息，失败则退出进程
    
    Returns:
        None
    """
    global mongo_client, db
    
    try:
        # 从环境变量获取MongoDB URI
        mongodb_uri = os.environ.get('MONGODB_URI')
        if not mongodb_uri:
            raise ValueError("MongoDB URI 未在环境变量中设置")
        
        # 尝试连接到MongoDB数据库
        mongo_client = MongoClient(mongodb_uri)
        
        # 从URI中提取数据库名称，默认为auth-system
        db_name = os.environ.get('DB_NAME', 'auth-system')
        db = mongo_client[db_name]
        
        # 测试连接
        mongo_client.admin.command('ping')
        
        # 连接成功，输出连接信息
        print(f"MongoDB 已连接: {mongo_client.address[0]}")
        
        return db
        
    except Exception as e:
        # 连接失败，输出错误信息并退出进程
        print(f"MongoDB连接错误: {str(e)}")
        sys.exit(1)  # 非零退出码表示异常终止

    

def get_db():
    """
    获取数据库连接
    
    Returns:
        pymongo.database.Database: MongoDB数据库连接
    """
    global db
    if db is None:
        # 如果db尚未初始化，则初始化它
        db = init_db()
    return db