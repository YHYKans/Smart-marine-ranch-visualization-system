"""
MySQL数据库连接模块
负责连接到MySQL数据库，不存在时自动创建
"""

import mysql.connector
from mysql.connector import pooling
from dotenv import load_dotenv
import os
import sys

# 加载环境变量
load_dotenv()

# MySQL连接池实例
connection_pool = None

def init_db():
    """
    初始化MySQL数据库连接池
    检查数据库是否存在，不存在则创建，然后连接
    
    Returns:
        mysql.connector.pooling.PooledMySQLConnection: 数据库连接池
    """
    global connection_pool
    
    try:
        # 从环境变量获取MySQL配置
        db_config = {
            'host': os.environ.get('MYSQL_HOST', 'localhost'),
            'port': int(os.environ.get('MYSQL_PORT', 3306)),
            'user': os.environ.get('MYSQL_USER', 'root'),
            'password': os.environ.get('MYSQL_PASSWORD', '123456'),
            'database': os.environ.get('MYSQL_DATABASE', 'water_quality_monitoring')
        }
        
        # 首先尝试连接到服务器（不指定数据库）
        server_config = db_config.copy()
        server_config.pop('database')  # 移除数据库参数
        
        # 创建服务器连接
        server_conn = mysql.connector.connect(**server_config)
        server_cursor = server_conn.cursor()
        
        # 检查数据库是否存在
        target_db = db_config['database']
        server_cursor.execute("SHOW DATABASES")
        databases = [db[0] for db in server_cursor]
        
        if target_db not in databases:
            # 创建数据库
            server_cursor.execute(f"CREATE DATABASE {target_db} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
            print(f"已创建数据库: {target_db}")
        
        # 关闭服务器连接
        server_cursor.close()
        server_conn.close()
        
        # 创建连接池（使用指定数据库）
        connection_pool = pooling.MySQLConnectionPool(
            pool_name="mysql_pool",
            pool_size=5,
            **db_config
        )
        
        # 测试连接
        conn = connection_pool.get_connection()
        if conn.is_connected():
            db_info = conn.get_server_info()
            print(f"MySQL 已连接: {db_config['host']}:{db_config['port']} (Server: {db_info})")
            conn.close()
        return connection_pool
        
    except Exception as e:
        print(f"MySQL连接错误: {str(e)}")
        sys.exit(1)

def get_db():
    """
    获取数据库连接
    
    Returns:
        mysql.connector.connection.MySQLConnection: MySQL数据库连接
    """
    global connection_pool
    if connection_pool is None:
        connection_pool = init_db()
    return connection_pool.get_connection()

# 初始化数据库连接池
init_db()