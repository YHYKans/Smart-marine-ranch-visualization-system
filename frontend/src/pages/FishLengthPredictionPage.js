// src/pages/FishLengthPredictionPage.js
import React, { useState } from 'react';
import FishLengthPredictForm from '../components/FishLengthPredictForm';
import FishLengthPredictResult from '../components/FishLengthPredictResult';

const FishLengthPredictionPage = () => {
  const [predictionResult, setPredictionResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePredict = async (fishData) => {
    setIsLoading(true);
    setError('');

    try {
      // 调用后端API进行预测
      const response = await fetch('http://localhost:3001/predict-fish-length', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fishData),
      });

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.statusText}`);
      }

      const data = await response.json();

      // 检查API返回是否包含错误
      if (data.error) {
        throw new Error(data.error);
      }

      // 更新预测结果
      setPredictionResult({
        predictedLength: data.length_prediction,
//        accuracy: 85.7  // 假设模型准确率为85.7%，实际应用中应从API获取
      });
    } catch (err) {
      setError(err.message);
      console.error('鱼类体长预测错误:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-[clamp(2rem,5vw,3rem)] font-bold text-gray-900 mb-4">
            智慧海洋牧场 - 鱼类体长预测
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            输入鱼类的体重、高度和宽度，我们将使用机器学习模型预测其体长
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <div>
            <FishLengthPredictForm onPredict={handlePredict} />
          </div>

          <div>
            <FishLengthPredictResult
              result={predictionResult}
              loading={isLoading}
              error={error}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FishLengthPredictionPage;