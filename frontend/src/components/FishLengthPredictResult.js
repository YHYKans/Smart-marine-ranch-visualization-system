// src/components/FishLengthPredictResult.js
import React from 'react';

const FishLengthPredictResult = ({ result, loading, error }) => {
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-700">正在预测中，请稍候...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded" role="alert">
          <p className="font-bold">预测失败</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!result || typeof result.predictedLength !== 'number') {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded" role="alert">
          <p className="font-bold">无有效预测结果</p>
          <p>请检查输入参数或联系管理员</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto mt-6">
      <h3 className="text-xl font-bold mb-4 text-center">预测结果</h3>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <p className="text-gray-700">根据输入的参数，预测的鱼类体长为：</p>
        <p className="text-2xl font-bold text-blue-700 text-center mt-2">
          {result.predictedLength.toFixed(2)} 厘米
        </p>
      </div>

      <div className="text-sm text-gray-500 text-center">
        <p>预测基于鱼类体重、高度和宽度的历史数据</p>
        {typeof result.accuracy === 'number' && (
          <p className="mt-1">模型准确率：{result.accuracy.toFixed(2)}%</p>
        )}
      </div>
    </div>
  );
};

export default FishLengthPredictResult;