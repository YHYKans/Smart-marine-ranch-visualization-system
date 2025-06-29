import pandas as pd
import mysql.connector
from datetime import datetime

def import_fish_data():
    db_config = {
        'host': 'localhost',
        'user': 'root',
        'password': 'root',
        'database': 'water_quality_monitoring'
    }
    
    csv_path = r"C:\Users\大麦茶\Desktop\data\软件工程大作业数据\Fish.csv"
    
    try:
        # 1. 读取CSV文件（显式指定编码）
        print(f"读取CSV文件: {csv_path}")
        try:
            df = pd.read_csv(csv_path, encoding='utf-8')
        except:
            df = pd.read_csv(csv_path, encoding='gbk')
        
        # 2. 清理列名：移除单位符号和括号
        clean_columns = {}
        for col in df.columns:
            cleaned = col.replace('(cm)', '').replace('(g)', '').replace(' ', '')
            clean_columns[col] = cleaned
        
        df = df.rename(columns=clean_columns)
        print("清洗后列名:", df.columns.tolist())
        
        # 3. 定义需要的列名映射
        required_mapping = {
            'Species': 'species',
            'Weight': 'body_weight',
            'Length1': 'body_length1',
            'Length2': 'body_length2',
            'Length3': 'body_length3',
            'Height': 'body_height',
            'Width': 'body_width'
        }
        
        # 4. 应用映射并验证
        df = df.rename(columns=required_mapping)
        print("映射后列名:", df.columns.tolist())
        
        # 5. 连接数据库
        print("连接数据库...")
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        
        # 6. 处理物种信息
        species_list = df['species'].unique()
        species_ids = {}
        
        for species in species_list:
            cursor.execute("SELECT species_id FROM fish_species WHERE common_name = %s", (species,))
            result = cursor.fetchone()
            
            if result:
                species_ids[species] = result[0]
            else:
                cursor.execute("INSERT INTO fish_species (common_name) VALUES (%s)", (species,))
                species_ids[species] = cursor.lastrowid
                print(f"添加新物种: {species} (ID: {cursor.lastrowid})")
        conn.commit()
        
        # 7. 插入观测数据（固定使用当前日期）
        insert_query = """
        INSERT INTO fish_observations 
        (species_id, body_weight, body_length1, body_length2, body_length3, body_height, body_width, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
        """
        
        records = []
        for _, row in df.iterrows():
            records.append((
                species_ids[row['species']],
                row.get('body_weight', None),  # 安全获取值
                row.get('body_length1', None),
                row.get('body_length2', None),
                row.get('body_length3', None),
                row.get('body_height', None),
                row.get('body_width', None)
            ))
        
        # 8. 分批插入数据（每批20条）
        batch_size = 20
        total_inserted = 0
        
        for i in range(0, len(records), batch_size):
            batch = records[i:i + batch_size]
            cursor.executemany(insert_query, batch)
            total_inserted += cursor.rowcount
            print(f"已插入: {total_inserted}/{len(records)} 条记录")
            conn.commit()
        
        print(f"成功导入 {total_inserted} 条记录")
        
    except Exception as e:
        print(f"处理过程中出错: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        if 'conn' in locals() and conn.is_connected():
            cursor.close()
            conn.close()
            print("数据库连接已关闭")

if __name__ == "__main__":
    print("="*50)
    print(f"鱼类数据导入程序 - {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print("="*50)
    import_fish_data()
    print("导入完成")