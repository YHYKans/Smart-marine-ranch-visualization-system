import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import json
import os
import re
from flask import Flask, render_template_string, request
import base64
from io import BytesIO  # 从 io 模块导入 BytesIO
import seaborn as sns

# 设置中文字体支持
plt.rcParams["font.family"] = ["SimHei", "WenQuanYi Micro Hei", "Heiti TC", "Arial Unicode MS"]
plt.rcParams["axes.unicode_minus"] = False  # 解决负号显示问题

app = Flask(__name__)

def clean_column_name(name):
    """清理列名，移除 HTML 标签和单位信息"""
    return re.sub(r'<[^>]*>', '', name).strip()


def visualize_water_quality(file_path, target_column=None):
    try:
        # 检查文件是否存在
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"文件不存在: {file_path}")

        # 读取 JSON 文件，显式指定编码为 utf-8
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # 调试信息：打印 JSON 根级键
        print(f"JSON 根级键: {list(data.keys())}")

        # 提取表头并清理列名
        if 'thead' in data and isinstance(data['thead'], list):
            columns = [clean_column_name(col) for col in data['thead']]
            print(f"使用提供的表头: {columns[:5]}...")
        else:
            raise ValueError("JSON 中未找到 'thead' 列表")

        # 提取数据记录
        if 'tbody' in data and isinstance(data['tbody'], list):
            records = data['tbody']
            print(f"从键 'tbody' 中提取到 {len(records)} 条记录")
        else:
            raise ValueError("JSON 中未找到 'tbody' 列表")

        # 创建 DataFrame
        df = pd.DataFrame(records, columns=columns)
        print(f"DataFrame 创建成功，形状: {df.shape}")

        # 显示数据基本信息
        print("数据基本信息:")
        df.info()

        # 显示数据集行数和列数
        rows, columns = df.shape

        if rows == 0:
            raise ValueError("数据记录行数为0，无法进行可视化")

        # 显示数据前几行信息
        print("数据前几行信息:")
        print(df.head().to_string())

        # 寻找日期/时间列
        date_columns = []
        for col in df.columns:
            if any(keyword in col.lower() for keyword in ['date', 'time', '监测时间']):
                date_columns.append(col)

        if not date_columns:
            print("警告: 未找到日期/时间列，无法按时间序列展示数据")
            x_column = df.index
            x_label = "数据点索引"
        else:
            x_column = date_columns[0]
            x_label = x_column

            # 特殊处理监测时间列
            if x_column == '监测时间':
                print(f"检测到 '监测时间' 列，尝试特殊格式解析")

                # 获取当前年份作为默认年份
                current_year = pd.Timestamp.now().year

                # 处理 None 值并添加年份信息
                def parse_date(date_str):
                    if pd.isna(date_str) or date_str is None or not isinstance(date_str, str):
                        return None
                    try:
                        # 尝试解析 'MM-DD HH:MM' 格式
                        return pd.Timestamp(f"{current_year}-{date_str}")
                    except:
                        return None

                # 应用日期解析函数
                df[x_column] = df[x_column].apply(parse_date)

                # 检查转换后的有效日期数量
                valid_dates = df[x_column].count()
                if valid_dates > 0:
                    print(f"成功转换 {valid_dates} 个日期值")
                    # 按日期排序
                    df = df.sort_values(x_column)
                else:
                    print("警告: 转换后无有效日期值，使用索引作为 x 轴")
                    x_column = df.index
                    x_label = "数据点索引"
            else:
                # 尝试自动解析其他日期列
                try:
                    df[x_column] = pd.to_datetime(df[x_column])
                    print(f"成功将列 '{x_column}' 转换为 datetime 类型")
                    # 按日期排序
                    df = df.sort_values(x_column)
                except:
                    print(f"警告: 无法将列 '{x_column}' 转换为 datetime 类型，保留原始格式")
                    x_column = df.index
                    x_label = "数据点索引"

        # 提取数值列用于绘图
        numerical_columns = []

        # 特殊字符列表，遇到这些字符将被视为缺失值
        special_chars = ['*', '-', 'nan', 'NaN', 'N/A', '无数据', '正常', '异常', '---']

        # 打印数值列转换前的样本值
        print("\n数据类型转换前的样本值:")
        for col in df.columns:
            sample = df[col].dropna().head(5).tolist()
            print(f"{col}: {sample}")

        # 特殊处理可能包含数值的列
        for col in df.columns:
            # 修正条件判断：比较列名而非整个Series
            if col == x_column and isinstance(x_column, str):
                continue

            try:
                # 替换特殊字符为 NaN
                cleaned = df[col].replace(special_chars, float('nan'))

                # 移除 HTML 标签
                cleaned = cleaned.astype(str).str.replace(r'<[^>]*>', '', regex=True)

                # 移除常见的非数字字符，保留小数点和负号
                cleaned = cleaned.str.replace(r'[^\d.-]', '', regex=True)

                # 移除多余的小数点（只保留第一个）
                def clean_decimal(s):
                    if '.' in s:
                        first_dot = s.index('.')
                        return s[:first_dot] + s[first_dot:].replace('.', '', 1)
                    return s

                cleaned = cleaned.apply(clean_decimal)

                # 尝试转换为数值类型
                converted = pd.to_numeric(cleaned, errors='coerce')

                # 检查转换后是否有有效数值
                valid_count = converted.count()
                if valid_count > 0:
                    df[col] = converted
                    numerical_columns.append(col)
                    print(f"成功将列 '{col}' 转换为数值类型，有效数值: {valid_count}/{len(df)}")
                else:
                    print(f"列 '{col}' 转换后无有效数值，跳过")
            except Exception as e:
                print(f"列 '{col}' 转换失败: {str(e)}")

        # 打印数值列转换后的类型
        print("\n数据类型转换后:")
        for col in numerical_columns:
            print(f"{col}: {df[col].dtype}")

        if not numerical_columns:
            print("错误: 数据中未找到数值列，无法进行可视化")
            print("提示: 请检查数据格式是否符合预期，特别是数值列是否包含非数字字符")
            return None, None  # 不抛出异常，优雅地退出函数

        # # 绘制每个数值列随时间的变化
        # plt.figure(figsize=(12, 8))
        #
        # # 计算需要的行数和列数，每行显示 2 个子图
        # n_plots = len(numerical_columns)
        # n_rows = (n_plots + 1) // 2
        # n_cols = min(2, n_plots)
        #
        # for i, col in enumerate(numerical_columns, 1):
        #     plt.subplot(n_rows, n_cols, i)
        #
        #     # 获取绘图数据
        #     x_data = df[x_column] if isinstance(x_column, str) else df.index
        #     y_data = df[col]
        #
        #     # 过滤掉 NaN 值
        #     mask = y_data.notna()
        #     x_data = x_data[mask]
        #     y_data = y_data[mask]
        #
        #     # 确保数据不为空
        #     if len(x_data) > 0 and len(y_data) > 0:
        #         plt.plot(x_data, y_data)
        #         plt.title(f"{col} 随时间的变化")
        #         plt.xlabel(x_label)
        #         plt.ylabel(col)
        #         plt.grid(True)
        #     else:
        #         plt.text(0.5, 0.5, '无有效数据', ha='center', va='center', transform=plt.gca().transAxes)
        #         plt.title(f"{col} (无有效数据)")
        #
        # # 将折线图保存到内存缓冲区
        # line_chart_buffer = BytesIO()  # 使用从 io 模块导入的 BytesIO
        # plt.tight_layout()
        # plt.savefig(line_chart_buffer, format='png')
        # line_chart_buffer.seek(0)
        # line_chart_data = line_chart_buffer.getvalue()
        # line_chart_base64 = base64.b64encode(line_chart_data).decode('utf-8')
        # plt.close()
        # 绘制所有指标图表（默认）
        if target_column:
            print(target_column)
            single_line_chart = plot_time_series(df, x_column, x_label, numerical_columns, target_column=target_column)
        else:
            print("NO!!!!!!!!!!!")
            line_chart_base64 = plot_time_series(df, x_column, x_label, numerical_columns)

        # 绘制水质类别分布饼图
        if '水质类别' in df.columns:
            plt.figure(figsize=(8, 6))
            # 定义需要过滤的无效值列表
            invalid_values = ['*', '-', 'nan', 'NaN', 'N/A', '无数据', '正常', '异常', '---', '']
            # 过滤掉无效值
            valid_categories = df['水质类别'].replace(invalid_values, pd.NA).dropna()
            # 计算有效类别的数量
            water_quality_counts = valid_categories.value_counts()
            if len(water_quality_counts) > 0:
                # 绘制饼图，设置标签和百分比格式
                plt.pie(
                    water_quality_counts,
                    labels=water_quality_counts.index,
                    autopct='%1.1f%%',
                    startangle=90,
                    textprops={'fontsize': 10}  # 设置标签字体大小
                )
                plt.title('水质类别分布')
                plt.axis('equal')  # 使饼图为正圆形
                # 如果类别太多，考虑使用图例而不是直接在扇形上显示标签
                if len(water_quality_counts) > 5:
                    plt.legend(water_quality_counts.index, loc='best')
            else:
                plt.text(0.5, 0.5, '无水质类别数据', ha='center', va='center', transform=plt.gca().transAxes)
                plt.title('水质类别分布 (无数据)')

            # 将饼图保存到内存缓冲区
            pie_chart_buffer = BytesIO()  # 使用从 io 模块导入的 BytesIO
            plt.savefig(pie_chart_buffer, format='png')
            pie_chart_buffer.seek(0)
            pie_chart_data = pie_chart_buffer.getvalue()
            pie_chart_base64 = base64.b64encode(pie_chart_data).decode('utf-8')
            plt.close()
            if target_column:
                return single_line_chart, pie_chart_base64
            else:
                return line_chart_base64, pie_chart_base64
        else:
            if target_column:
                return single_line_chart, None
            else:
                return line_chart_base64, None

    except FileNotFoundError as e:
        print(f"错误: {e}")
        return None, None
    except json.JSONDecodeError:
        print("错误: 无法解析 JSON 文件，请检查文件格式")
        return None, None
    except Exception as e:
        print(f"错误: 发生了一个未知错误: {e}")
        # 打印详细的错误堆栈信息，帮助定位问题
        import traceback
        traceback.print_exc()
        return None, None


# 绘制每个数值列随时间的变化（支持单指标显示）
def plot_time_series(df, x_column, x_label, numerical_columns, target_column=None):
    plt.figure(figsize=(12, 8))
    print(numerical_columns)
    if target_column and target_column in numerical_columns:
        # 单独显示单个指标
        n_plots = 1
        n_rows, n_cols = 1, 1
        col = target_column
        plt.subplot(n_rows, n_cols, 1)

        x_data = df[x_column] if isinstance(x_column, str) else df.index
        y_data = df[col]
        mask = y_data.notna()
        x_data = x_data[mask]
        y_data = y_data[mask]

        if len(x_data) > 0 and len(y_data) > 0:
            plt.plot(x_data, y_data, marker='o', linestyle='-', color='blue')
            plt.title(f"{col} 随时间的变化")
            plt.xlabel(x_label)
            plt.ylabel(col)
            plt.grid(True)
        else:
            plt.text(0.5, 0.5, '无有效数据', ha='center', va='center')
            plt.title(f"{col} (无有效数据)")
    else:
        # 显示所有指标（原有逻辑）
        n_plots = len(numerical_columns)
        n_rows = (n_plots + 1) // 2
        n_cols = min(2, n_plots)

        for i, col in enumerate(numerical_columns, 1):
            plt.subplot(n_rows, n_cols, i)
            x_data = df[x_column] if isinstance(x_column, str) else df.index
            y_data = df[col]
            mask = y_data.notna()
            x_data = x_data[mask]
            y_data = y_data[mask]

            if len(x_data) > 0 and len(y_data) > 0:
                plt.plot(x_data, y_data)
                plt.title(f"{col} 随时间的变化")
                plt.xlabel(x_label)
                plt.ylabel(col)
                plt.grid(True)
            else:
                plt.text(0.5, 0.5, '无有效数据', ha='center', va='center')
                plt.title(f"{col} (无有效数据)")

    # 保存图表到内存
    buffer = BytesIO()
    plt.tight_layout()
    plt.savefig(buffer, format='png')
    buffer.seek(0)
    chart_data = base64.b64encode(buffer.getvalue()).decode('utf-8')
    plt.close()
    return chart_data


#########################################鱼类
# 读取鱼类数据
def read_fish_data(file_path):
    try:
        df = pd.read_csv(file_path)
        return df
    except FileNotFoundError:
        print(f"文件不存在: {file_path}")
        return None

# 生成柱状图，展示每种鱼类的平均重量
def generate_bar_chart(df):
    average_weight = df.groupby('Species')['Weight(g)'].mean()
    plt.figure(figsize=(8, 6))
    average_weight.plot(kind='bar')
    plt.title('每种鱼类的平均重量')
    plt.xlabel('鱼类种类')
    plt.ylabel('平均重量 (g)')

    buffer = BytesIO()
    plt.savefig(buffer, format='png')
    buffer.seek(0)
    chart_data = base64.b64encode(buffer.getvalue()).decode('utf-8')
    plt.close()

    return chart_data

# 生成散点图，展示鱼类的长度和宽度关系
def generate_scatter_chart(df):
    plt.figure(figsize=(8, 6))
    plt.scatter(df['Length1(cm)'], df['Width(cm)'])
    plt.title('鱼类的长度和宽度关系')
    plt.xlabel('长度 (cm)')
    plt.ylabel('宽度 (cm)')

    buffer = BytesIO()
    plt.savefig(buffer, format='png')
    buffer.seek(0)
    chart_data = base64.b64encode(buffer.getvalue()).decode('utf-8')
    plt.close()

    return chart_data


def generate_single_species_scatter(df, species_name):

    # 筛选特定种类的鱼
    species_data = df[df['Species'] == species_name]

    # 检查是否有数据
    if species_data.empty:
        print(f"错误: 未找到种类为 '{species_name}' 的鱼数据")
        return None

    # 计算相关系数
    correlation = species_data['Length1(cm)'].corr(species_data['Width(cm)'])

    # 创建散点图并添加回归线
    plt.figure(figsize=(10, 7))
    sns.regplot(x='Length1(cm)', y='Width(cm)', data=species_data,
                scatter_kws={'alpha': 0.6, 'color': 'dodgerblue'},
                line_kws={'color': 'crimson'})

    # 添加标题和标签，包括相关系数
    plt.title(f"{species_name} 的长度和宽度关系 (相关系数: {correlation:.2f})", fontsize=14)
    plt.xlabel('长度 (cm)', fontsize=12)
    plt.ylabel('宽度 (cm)', fontsize=12)
    plt.grid(True, linestyle='--', alpha=0.7)

    # 添加数据统计信息
    plt.figtext(0.15, 0.01,
                f"样本数量: {len(species_data)} | 平均长度: {species_data['Length1(cm)'].mean():.2f} cm | 平均宽度: {species_data['Width(cm)'].mean():.2f} cm",
                fontsize=10, ha='left')

    # 保存图表到内存并转换为Base64
    buffer = BytesIO()
    plt.tight_layout()
    plt.savefig(buffer, format='png', dpi=300)
    buffer.seek(0)
    chart_data = base64.b64encode(buffer.getvalue()).decode('utf-8')
    plt.close()

    return chart_data


############################name
# 读取水质数据
def read_water_quality_data(file_path):
    try:
        df = pd.read_csv(file_path)
        return df
    except FileNotFoundError:
        print(f"文件不存在: {file_path}")
        return None


# 生成水质类别分布饼图
def generate_water_quality_pie_chart(df):
    # 过滤掉水质类别中的无效值（'*'）
    valid_quality = df['水质类别'].replace('*', None).dropna()

    # 统计有效类别的数量
    quality_counts = valid_quality.value_counts()

    # 如果没有有效数据，返回None
    if quality_counts.empty:
        print("没有有效水质类别数据用于生成饼图")
        return None

    plt.figure(figsize=(8, 6))
    plt.pie(quality_counts, labels=quality_counts.index, autopct='%1.1f%%', startangle=90)
    plt.title('水质类别分布')
    plt.axis('equal')  # 使饼图为正圆形

    buffer = BytesIO()
    plt.savefig(buffer, format='png')
    buffer.seek(0)
    chart_data = base64.b64encode(buffer.getvalue()).decode('utf-8')
    plt.close()

    return chart_data


# 生成不同时间的溶解氧变化趋势图
def generate_dissolved_oxygen_trend(df):
    if '监测时间' not in df.columns or '溶解氧(mg/L)' not in df.columns:
        print("数据中缺少监测时间列或溶解氧列")
        return None

    # 获取当前年份
    current_year = 2021

    # 处理监测时间列，替换异常值
    df['监测时间'] = df['监测时间'].astype(str).apply(lambda x: f"{current_year}-{x}" if '*' not in x else None)
    df = df.dropna(subset=['监测时间'])

    df['监测时间'] = pd.to_datetime(df['监测时间'], format='%Y-%m-%d %H:%M')

    # 处理溶解氧列
    df['溶解氧(mg/L)'] = pd.to_numeric(df['溶解氧(mg/L)'], errors='coerce')
    df = df.dropna(subset=['监测时间', '溶解氧(mg/L)'])

    if len(df) == 0:
        print("没有足够的有效数据绘制图表")
        return None

    plt.figure(figsize=(12, 6))
    plt.plot(df['监测时间'], df['溶解氧(mg/L)'], marker='o', linestyle='-', color='b')
    plt.title('溶解氧随时间变化趋势')
    plt.xlabel('监测时间')
    plt.ylabel('溶解氧(mg/L)')
    plt.xticks(rotation=45)
    plt.grid(True, linestyle='--', alpha=0.7)
    # 设置横坐标显示格式，确保年份显示
    import matplotlib.dates as mdates
    plt.gca().xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m-%d %H:%M'))

    buffer = BytesIO()
    plt.tight_layout()
    plt.savefig(buffer, format='png')
    buffer.seek(0)
    chart_data = base64.b64encode(buffer.getvalue()).decode('utf-8')
    plt.close()

    return chart_data


# 生成 pH 值分布直方图
def generate_ph_histogram(df):
    plt.figure(figsize=(8, 6))
    plt.hist(df['pH(无量纲)'], bins=10, alpha=0.7)
    plt.title('pH 值分布')
    plt.xlabel('pH 值')
    plt.ylabel('频次')
    plt.grid(True, linestyle='--', alpha=0.7)

    buffer = BytesIO()
    plt.savefig(buffer, format='png')
    buffer.seek(0)
    chart_data = base64.b64encode(buffer.getvalue()).decode('utf-8')
    plt.close()

    return chart_data
