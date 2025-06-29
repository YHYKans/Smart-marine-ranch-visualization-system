from flask import Blueprint, request, jsonify
import os
import torch
from PIL import Image
import torchvision.transforms as transforms
import numpy as np
import io
import time

try:
    import timm
except ImportError:
    timm = None

fish_recognition_bp = Blueprint('fish_recognition', __name__)

CHECKPOINT_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../checkpoints')

FISH_CLASSES = [
    "Abudefduf vaigiensis", "Acanthurus nigrofuscus", "Amphiprion clarkii", "Balistapus undulatus",
    "Canthigaster valentini", "Chaetodon lunulatus", "Chaetodon trifascialis", "Chromis chrysura",
    "Dascyllus reticulatus", "Hemigymnus fasciatus", "Hemigymnus melapterus", "Lutjanus fulvus",
    "Myripristis kuntee", "Neoglyphidodon nigroris", "Neoniphon sammara", "Pempheris vanicolensis",
    "Plectroglyphidodon dickii", "Pomacentrus moluccensis", "Scaridae", "Scolopsis bilineata",
    "Siganus fuscescens", "Zanclus cornutus", "Zebrasoma scopas"
]

model = None
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model_loading_time = 0  # 用于记录模型加载时间

class FishClassifier(torch.nn.Module):
    def __init__(self, model_name, num_classes):
        super(FishClassifier, self).__init__()
        self.model = timm.create_model(
            model_name,
            pretrained=False,
            num_classes=num_classes
        )

    def forward(self, x):
        return self.model(x)

def load_model():
    global model, model_loading_time
    if model is None:
        start_time = time.time()
        try:
            print("[鱼类识别] 开始加载模型...")
            num_classes = len(FISH_CLASSES)
            model_name = "tf_efficientnetv2_m"
            checkpoint_file = os.path.join(CHECKPOINT_PATH, 'fish_model.pth')
            
            # 打印完整的模型文件路径
            print(f"[鱼类识别] 模型文件路径: {checkpoint_file}")
            print(f"[鱼类识别] 文件存在: {os.path.exists(checkpoint_file)}")

            if not os.path.exists(checkpoint_file):
                raise FileNotFoundError(f"模型文件不存在: {checkpoint_file}")
            if timm is None:
                raise ImportError("缺少 timm 库，请使用 pip install timm 安装")

            model_instance = FishClassifier(model_name, num_classes)
            print("[鱼类识别] 模型架构创建完成")
            
            # 打印检查点加载信息
            print(f"[鱼类识别] 正在从 {checkpoint_file} 加载模型权重...")
            checkpoint = torch.load(checkpoint_file, map_location=device)
            print(f"[鱼类识别] 检查点加载完成，包含 {len(checkpoint.keys())} 个键")

            if 'model_state_dict' in checkpoint:
                model_instance.load_state_dict(checkpoint['model_state_dict'])
                print("[鱼类识别] 从 'model_state_dict' 加载权重")
            else:
                model_instance.load_state_dict(checkpoint)
                print("[鱼类识别] 从根级别加载权重")

            model_instance.to(device)
            model_instance.eval()

            model = model_instance
            model_loading_time = time.time() - start_time
            print(f"[鱼类识别] 模型加载成功，耗时 {model_loading_time:.2f} 秒")

        except Exception as e:
            print(f"[鱼类识别][错误] 模型加载失败: {str(e)}")
            raise
    return model

def get_transforms():
    return transforms.Compose([
        transforms.Resize((384, 384)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

@fish_recognition_bp.route('/identify', methods=['POST'])
def identify_fish():
    try:
        print("[鱼类识别] 收到识别请求")
        if 'image' not in request.files:
            print("[鱼类识别] 错误: 没有上传图片")
            return jsonify({"error": "没有上传图片"}), 400

        file = request.files['image']
        if file.filename == '':
            print("[鱼类识别] 错误: 没有选择图片")
            return jsonify({"error": "没有选择图片"}), 400

        print(f"[鱼类识别] 图片文件名: {file.filename}，大小: {len(file.read())} 字节")
        file.seek(0)  # 重置文件指针
        
        img_bytes = file.read()
        img = Image.open(io.BytesIO(img_bytes)).convert('RGB')

        transform = get_transforms()
        img_tensor = transform(img).unsqueeze(0).to(device)

        model_instance = load_model()
        print("[鱼类识别] 模型已加载，开始推理...")
        with torch.no_grad():
            outputs = model_instance(img_tensor)
            probs = torch.nn.functional.softmax(outputs, dim=1)[0]

        top3_prob, top3_indices = torch.topk(probs, 3)

        results = []
        for i, idx in enumerate(top3_indices.cpu().numpy()):
            results.append({
                "fish_type": FISH_CLASSES[idx],
                "confidence": float(top3_prob[i].cpu().numpy()) * 100
            })
        
        print(f"[鱼类识别] 识别完成，返回前3结果: {results[:3]}")
        return jsonify({
            "success": True,
            "results": results
        })

    except Exception as e:
        print(f"[鱼类识别][错误] 识别过程中发生错误: {str(e)}")
        return jsonify({"error": f"识别失败: {str(e)}"}), 500

@fish_recognition_bp.route('/status', methods=['GET'])
def model_status():
    try:
        print("[鱼类识别] 收到模型状态请求")
        checkpoint_file = os.path.join(CHECKPOINT_PATH, 'fish_model.pth')
        
        # 打印详细的状态检查信息
        print(f"[鱼类识别] 检查模型状态:")
        print(f"[鱼类识别] 模型文件路径: {checkpoint_file}")
        print(f"[鱼类识别] 文件存在: {os.path.exists(checkpoint_file)}")
        
        if os.path.exists(checkpoint_file):
            if timm is None:
                print("[鱼类识别] 状态: 不可用 (缺少timm库)")
                return jsonify({
                    "status": "unavailable",
                    "error": "缺少必要的库: timm. 请安装: pip install timm"
                })
            
            # 尝试加载模型并检查
            try:
                load_model()
                print("[鱼类识别] 状态: 可用")
                return jsonify({
                    "status": "available",
                    "classes": FISH_CLASSES
                })
            except Exception as e:
                print(f"[鱼类识别][错误] 状态检查时模型加载失败: {str(e)}")
                return jsonify({
                    "status": "error",
                    "error": f"模型加载失败: {str(e)}"
                })
        else:
            print("[鱼类识别] 状态: 不可用 (模型文件不存在)")
            return jsonify({
                "status": "unavailable",
                "error": "模型文件不存在"
            })
    except Exception as e:
        print(f"[鱼类识别][错误] 状态请求处理错误: {str(e)}")
        return jsonify({
            "status": "error",
            "error": str(e)
        })

# 用于确认蓝图加载日志
print("[fish_recognition] 蓝图已定义并等待注册")