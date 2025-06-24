// src/components/FishLengthPredictForm.js
import React, { useState } from 'react';

const FishLengthPredictForm = ({ onPredict }) => {
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [width, setWidth] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    // 输入验证
    if (!weight || !height || !width) {
      setError('请填写所有字段');
      return;
    }

    // 检查输入是否为数字
    if (isNaN(parseFloat(weight)) || isNaN(parseFloat(height)) || isNaN(parseFloat(width))) {
      setError('请输入有效的数字');
      return;
    }

    // 调用父组件的回调函数进行预测
    onPredict({ weight: parseFloat(weight), height: parseFloat(height), width: parseFloat(width) });
    setError('');
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4 text-center">鱼类体长预测</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          {error}
        </div>
      )}

      <div className="mb-4">
        <label htmlFor="weight" className="block text-gray-700 text-sm font-bold mb-2">
          体重 (g)
        </label>
        <input
          type="number"
          id="weight"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="输入体重"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="height" className="block text-gray-700 text-sm font-bold mb-2">
          高度 (cm)
        </label>
        <input
          type="number"
          id="height"
          value={height}
          onChange={(e) => setHeight(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="输入高度"
        />
      </div>

      <div className="mb-6">
        <label htmlFor="width" className="block text-gray-700 text-sm font-bold mb-2">
          宽度 (cm)
        </label>
        <input
          type="number"
          id="width"
          value={width}
          onChange={(e) => setWidth(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="输入宽度"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
      >
        预测体长
      </button>
    </form>
  );
};

export default FishLengthPredictForm;