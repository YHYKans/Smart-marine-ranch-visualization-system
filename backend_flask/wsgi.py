from app import app
import os

if __name__ == "__main__":
    # 显式指定运行参数
    app.run(
        host=os.environ.get('HOST', '0.0.0.0'),
        port=int(os.environ.get('PORT', 3001)),  # 优先使用环境变量
        debug=os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'
    )