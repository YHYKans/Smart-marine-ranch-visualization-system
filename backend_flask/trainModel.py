import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, r2_score
import joblib


# 读取数据
def load_data(file_path):
    try:
        df = pd.read_csv(file_path)
        return df
    except FileNotFoundError:
        print(f"错误：文件 '{file_path}' 未找到。")
        return None
    except Exception as e:
        print(f"错误：读取文件时发生异常：{e}")
        return None


# 数据预处理
def preprocess_data(df):
    # 移除包含缺失值的行
    df = df.dropna(subset=['Weight(g)', 'Height(cm)', 'Width(cm)', 'Length3(cm)'])

    # 提取特征和目标变量
    X = df[['Weight(g)', 'Height(cm)', 'Width(cm)']]
    y = df['Length3(cm)']  # 使用Length3(cm)作为目标体长

    return X, y


# 训练模型
def train_model(X, y):
    # 划分训练集和测试集
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # 创建并训练线性回归模型
    model = LinearRegression()
    model.fit(X_train, y_train)

    # 在测试集上评估模型
    y_pred = model.predict(X_test)
    mse = mean_squared_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)

    print(f"均方误差 (MSE): {mse:.4f}")
    print(f"决定系数 (R²): {r2:.4f}")

    return model


# 保存模型
def save_model(model, model_path='fish_length_model.pkl'):
    joblib.dump(model, model_path)
    print(f"模型已保存至: {model_path}")


# 预测新数据
def predict_length(model, weight, height, width):
    # 创建预测输入
    input_data = np.array([[weight, height, width]])

    # 进行预测
    prediction = model.predict(input_data)

    return prediction[0]



# 文件路径，需替换为实际路径
file_path = 'config/软件工程大作业数据/Fish.csv'

# 加载数据
df = load_data(file_path)
if df is None:
    exit(1)

# 预处理数据
X, y = preprocess_data(df)

# 训练模型
model = train_model(X, y)

# 保存模型
save_model(model)

# 示例预测
example_weight = 300  # 克
example_height = 12  # 厘米
example_width = 4.5  # 厘米

predicted_length = predict_length(model, example_weight, example_height, example_width)
print(f"\n示例预测:")
print(f"输入: 体重={example_weight}g, 高度={example_height}cm, 宽度={example_width}cm")
print(f"预测体长: {predicted_length:.2f}cm")