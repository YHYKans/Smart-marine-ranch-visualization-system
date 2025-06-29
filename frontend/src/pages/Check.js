import { useState, useEffect } from 'react';
import { Table, Alert, Card, DatePicker, Button, Space, Tag, Modal, Form, InputNumber, message } from 'antd';
import axios from 'axios';
import moment from 'moment';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { 
  AimOutlined, 
  ExperimentOutlined, 
  SettingOutlined, 
  WarningOutlined,
  EnvironmentOutlined // 替换 WaterOutlined 为 EnvironmentOutlined
} from '@ant-design/icons';

const { RangePicker } = DatePicker;

function WaterQualityAnomalyDetection() {
  const [isLoading, setIsLoading] = useState(false);
  const [anomalies, setAnomalies] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [anomalyCount, setAnomalyCount] = useState(0);
  const [thresholds, setThresholds] = useState([]);
  const [thresholdModalVisible, setThresholdModalVisible] = useState(false);
  const [thresholdForm] = Form.useForm();
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('anomalies');

  const defaultDateRange = [
    moment('2020-05-01T00:00:00'),
    moment('2021-04-05T23:59:59')
  ];

  useEffect(() => {
    fetchThresholds();
    detectAnomalies(defaultDateRange);
  }, []);

  // 获取阈值数据
  const fetchThresholds = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/water-quality/thresholds');
      setThresholds(response.data);
      
      const formValues = {};
      response.data.forEach(item => {
        formValues[`lower_${item.parameter}`] = item.lower_threshold;
        formValues[`upper_${item.parameter}`] = item.upper_threshold;
      });
      thresholdForm.setFieldsValue(formValues);
    } catch (error) {
      console.error('获取阈值失败:', error);
      message.error('获取阈值失败，请重试');
    }
  };

  // 检测水质数据异常
  const detectAnomalies = async (dateRange) => {
    setIsLoading(true);
    try {
      const startDate = dateRange && dateRange[0] ? dateRange[0].format('YYYY-MM-DD') : '';
      const endDate = dateRange && dateRange[1] ? dateRange[1].format('YYYY-MM-DD') : '';
      
      const response = await axios.get(
        'http://localhost:3001/api/water-quality/detect-anomalies',
        { params: { start_date: startDate, end_date: endDate } }
      );
      
      setAnomalies(response.data.anomalies);
      setTotalRecords(response.data.total_records);
      setAnomalyCount(response.data.anomaly_count);
      setStats(response.data.stats);
      
    } catch (error) {
      console.error('检测异常失败:', error);
      message.error('检测异常失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 打开阈值设置模态框
  const openThresholdModal = () => {
    setThresholdModalVisible(true);
  };

  // 关闭阈值设置模态框
  const closeThresholdModal = () => {
    setThresholdModalVisible(false);
  };

  // 保存阈值设置
  const saveThresholds = async () => {
    try {
      const values = await thresholdForm.validateFields();
      
      const thresholdData = thresholds.map(item => ({
        parameter: item.parameter,
        lower_threshold: parseFloat(values[`lower_${item.parameter}`]),
        upper_threshold: parseFloat(values[`upper_${item.parameter}`])
      }));
      
      await axios.put('http://localhost:3001/api/water-quality/thresholds', thresholdData);
      
      message.success('阈值设置已保存');
      setThresholdModalVisible(false);
      fetchThresholds();
    } catch (errorInfo) {
      console.error('验证失败:', errorInfo);
      message.error('请检查输入是否正确');
    }
  };

  const columns = [
    {
      title: '记录ID',
      dataIndex: 'record_id',
      key: 'record_id',
      width: 100,
      render: (text) => <span className="text-cyan-500 font-mono">#{text}</span>
    },
    {
      title: '监测站点',
      dataIndex: 'site_id',
      key: 'site_id',
      width: 120,
      render: (text) => <span className="text-blue-400">{text}</span>
    },
    {
      title: '监测日期',
      dataIndex: 'monitoring_date',
      key: 'monitoring_date',
      width: 140
    },
    {
      title: '监测时间',
      dataIndex: 'monitoring_time',
      key: 'monitoring_time',
      width: 140
    },
    {
      title: '监测断面',
      dataIndex: 'section_name',
      key: 'section_name',
      ellipsis: true,
      width: 200,
      render: (text) => <span className="text-teal-300">{text}</span>
    },
    {
      title: '异常原因',
      dataIndex: 'anomaly_reasons',
      key: 'anomaly_reasons',
      render: (reasons) => (
        <div className="flex flex-wrap gap-1">
          {reasons.map((reason, index) => (
            <Tag 
              key={index} 
              className="bg-red-500/20 border border-red-500/40 text-red-300 rounded-full px-3 py-1"
            >
              {reason}
            </Tag>
          ))}
        </div>
      )
    }
  ];

  // 参数图表数据准备
  const prepareChartData = () => {
    if (!stats || !stats.parameters) return [];
    
    return stats.parameters.map(param => {
      const threshold = thresholds.find(t => t.parameter === param.name);
      return {
        name: param.name,
        avg: param.avg,
        min: param.min,
        max: param.max,
        lower_threshold: threshold?.lower_threshold || 0,
        upper_threshold: threshold?.upper_threshold || 0
      };
    });
  };

  const chartData = prepareChartData();

  return (
    <div className="water-quality-anomaly-detection min-h-screen bg-gradient-to-b from-[#0a192f] to-[#0c2a4a] p-6 text-white">
      <div className="max-w-7xl mx-auto">
        {/* 页面标题 - 使用 EnvironmentOutlined 替代 WaterOutlined */}
        <div className="flex items-center mb-8">
          <EnvironmentOutlined className="text-4xl text-cyan-400 mr-4" />
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-teal-300">
              水质数据异常检测系统
            </h1>
            <p className="text-cyan-300 mt-1">基于人工智能的水质异常识别与分析平台</p>
          </div>
        </div>

        {/* 操作卡片 */}
        <Card 
          className="mb-6 border border-cyan-500/30 bg-[rgba(10,25,47,0.7)] backdrop-blur-md"
          title={
            <div className="flex items-center">
              <AimOutlined className="text-cyan-400 mr-2" />
              <span className="text-cyan-300">水质异常检测</span>
            </div>
          }
          headStyle={{ borderBottom: '1px solid rgba(0, 230, 255, 0.2)', color: '#6df7e1' }}
        >
          <Space className="w-full">
            <RangePicker 
              showTime 
              format="YYYY-MM-DD HH:mm:ss" 
              placeholder={['开始日期', '结束日期']}
              defaultValue={defaultDateRange}
              onOk={detectAnomalies}
              className="custom-range-picker"
            />
            <Button 
              type="primary" 
              onClick={() => detectAnomalies()}
              loading={isLoading}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 border-0 text-white font-bold"
              icon={<ExperimentOutlined />}
            >
              检测异常
            </Button>
            <Button 
              onClick={openThresholdModal}
              className="bg-[rgba(10,40,70,0.5)] border border-cyan-500/30 text-cyan-300 hover:bg-[rgba(10,40,70,0.7)]"
              icon={<SettingOutlined />}
            >
              设置阈值
            </Button>
          </Space>
          
          {totalRecords > 0 && (
            <Alert
              message={
                <div className="flex items-center">
                  <WarningOutlined className="mr-2" />
                  <span>
                    检测结果：共<span className="font-bold text-teal-300 mx-1">{totalRecords}</span>条数据，
                    <span className="font-bold text-red-400 mx-1">{anomalyCount}</span>条异常
                  </span>
                </div>
              }
              type={anomalyCount > 0 ? 'warning' : 'success'}
              showIcon={false}
              className="mt-4 bg-[rgba(255,255,255,0.05)] border border-cyan-500/30"
            />
          )}
        </Card>

        {/* 数据概览卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="border border-cyan-500/30 bg-[rgba(10,25,47,0.7)] backdrop-blur-md">
            <div className="text-center">
              <div className="text-cyan-400 text-4xl mb-2">🌊</div>
              <h3 className="text-cyan-300 mb-1">监测站点</h3>
              <p className="text-2xl font-bold text-teal-300">{stats?.sites || 0}</p>
            </div>
          </Card>
          
          <Card className="border border-cyan-500/30 bg-[rgba(10,25,47,0.7)] backdrop-blur-md">
            <div className="text-center">
              <div className="text-cyan-400 text-4xl mb-2">📊</div>
              <h3 className="text-cyan-300 mb-1">数据总量</h3>
              <p className="text-2xl font-bold text-teal-300">{totalRecords}</p>
            </div>
          </Card>
          
          <Card className="border border-cyan-500/30 bg-[rgba(10,25,47,0.7)] backdrop-blur-md">
            <div className="text-center">
              <div className="text-cyan-400 text-4xl mb-2">⚠️</div>
              <h3 className="text-cyan-300 mb-1">异常数据</h3>
              <p className="text-2xl font-bold text-red-400">{anomalyCount}</p>
            </div>
          </Card>
          
          <Card className="border border-cyan-500/30 bg-[rgba(10,25,47,0.7)] backdrop-blur-md">
            <div className="text-center">
              <div className="text-cyan-400 text-4xl mb-2">📈</div>
              <h3 className="text-cyan-300 mb-1">异常比例</h3>
              <p className="text-2xl font-bold text-teal-300">
                {totalRecords > 0 ? ((anomalyCount / totalRecords * 100).toFixed(2)) : 0}%
              </p>
            </div>
          </Card>
        </div>

        {/* 标签页切换 */}
        <div className="flex mb-4 border-b border-cyan-500/30">
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === 'anomalies' 
                ? 'text-cyan-300 border-b-2 border-cyan-400' 
                : 'text-cyan-200 hover:text-cyan-300'
            }`}
            onClick={() => setActiveTab('anomalies')}
          >
            异常数据列表
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === 'analysis' 
                ? 'text-cyan-300 border-b-2 border-cyan-400' 
                : 'text-cyan-200 hover:text-cyan-300'
            }`}
            onClick={() => setActiveTab('analysis')}
          >
            水质分析图表
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === 'distribution' 
                ? 'text-cyan-300 border-b-2 border-cyan-400' 
                : 'text-cyan-200 hover:text-cyan-300'
            }`}
            onClick={() => setActiveTab('distribution')}
          >
            异常分布
          </button>
        </div>

        {/* 异常数据列表 */}
        {activeTab === 'anomalies' && (
          <Card 
            className="border border-cyan-500/30 bg-[rgba(10,25,47,0.7)] backdrop-blur-md"
            title={
              <div className="flex items-center">
                <span className="text-cyan-300">水质异常数据列表</span>
                <span className="ml-2 bg-red-500/20 text-red-300 px-2 py-1 rounded-full text-xs">
                  {anomalies.length} 条记录
                </span>
              </div>
            }
            headStyle={{ borderBottom: '1px solid rgba(0, 230, 255, 0.2)', color: '#6df7e1' }}
          >
            {anomalies.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-cyan-300 text-xl mb-4">🎉 未检测到异常数据</div>
                <p className="text-cyan-200">当前数据范围内水质指标均在正常阈值内</p>
              </div>
            ) : (
              <Table 
                dataSource={anomalies} 
                columns={columns} 
                rowKey="record_id"
                pagination={{ pageSize: 10 }}
                loading={isLoading}
                className="custom-table"
                scroll={{ x: 1000 }}
              />
            )}
          </Card>
        )}

        {/* 水质分析图表 */}
        {activeTab === 'analysis' && chartData.length > 0 && (
          <Card 
            className="border border-cyan-500/30 bg-[rgba(10,25,47,0.7)] backdrop-blur-md mb-6"
            title={
              <div className="flex items-center">
                <span className="text-cyan-300">水质参数分析</span>
              </div>
            }
            headStyle={{ borderBottom: '1px solid rgba(0, 230, 255, 0.2)', color: '#6df7e1' }}
          >
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#2c3e50" />
                <XAxis dataKey="name" stroke="#6df7e1" angle={-45} textAnchor="end" height={70} />
                <YAxis stroke="#6df7e1" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(10,25,47,0.9)', 
                    border: '1px solid rgba(0, 230, 255, 0.3)',
                    borderRadius: '8px'
                  }} 
                  itemStyle={{ color: '#6df7e1' }}
                />
                <Legend />
                <Bar dataKey="avg" name="平均值" fill="#0ea5e9" />
                <Bar dataKey="min" name="最小值" fill="#22d3ee" />
                <Bar dataKey="max" name="最大值" fill="#2dd4bf" />
                <Bar dataKey="lower_threshold" name="阈值下限" fill="#ef4444" />
                <Bar dataKey="upper_threshold" name="阈值上限" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* 异常分布图表 */}
        {activeTab === 'distribution' && stats && stats.anomaly_distribution && (
          <Card 
            className="border border-cyan-500/30 bg-[rgba(10,25,47,0.7)] backdrop-blur-md"
            title={
              <div className="flex items-center">
                <span className="text-cyan-300">异常数据分布</span>
              </div>
            }
            headStyle={{ borderBottom: '1px solid rgba(0, 230, 255, 0.2)', color: '#6df7e1' }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-cyan-300 mb-4 text-center">按监测站点分布</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={stats.anomaly_distribution.by_site}
                    margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#2c3e50" />
                    <XAxis dataKey="site" stroke="#6df7e1" />
                    <YAxis stroke="#6df7e1" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(10,25,47,0.9)', 
                        border: '1px solid rgba(0, 230, 255, 0.3)',
                        borderRadius: '8px'
                      }} 
                    />
                    <Bar dataKey="count" name="异常次数" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div>
                <h3 className="text-cyan-300 mb-4 text-center">按异常参数分布</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={stats.anomaly_distribution.by_parameter}
                    margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#2c3e50" />
                    <XAxis dataKey="parameter" stroke="#6df7e1" />
                    <YAxis stroke="#6df7e1" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(10,25,47,0.9)', 
                        border: '1px solid rgba(0, 230, 255, 0.3)',
                        borderRadius: '8px'
                      }} 
                    />
                    <Bar dataKey="count" name="异常次数" fill="#f97316" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>
        )}

        {/* 阈值设置模态框 */}
        <Modal
          title={
            <div className="flex items-center">
              <SettingOutlined className="text-cyan-400 mr-2" />
              <span className="text-cyan-300">水质指标阈值设置</span>
            </div>
          }
          visible={thresholdModalVisible}
          onCancel={closeThresholdModal}
          footer={[
            <Button key="cancel" onClick={closeThresholdModal} className="text-cyan-300">
              取消
            </Button>,
            <Button 
              key="save" 
              type="primary" 
              onClick={saveThresholds} 
              loading={isLoading}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 border-0 text-white font-bold"
            >
              保存设置
            </Button>,
          ]}
          width={800}
          className="custom-modal"
          bodyStyle={{ backgroundColor: 'rgba(10,25,47,0.9)', border: '1px solid rgba(0, 230, 255, 0.3)' }}
        >
          <Form
            form={thresholdForm}
            layout="vertical"
            initialValues={{ remember: true }}
          >
            <h3 className="mb-4 text-lg font-semibold text-cyan-300">水质指标阈值</h3>
            
            {thresholds.map((item, index) => (
              <div key={item.parameter} className="mb-6 pb-6 border-b border-cyan-500/30">
                <h4 className="mb-3 text-md font-medium text-teal-300 flex items-center">
                  <span className="w-3 h-3 bg-cyan-500 rounded-full mr-2"></span>
                  {item.parameter}
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Form.Item
                    label={<span className="text-cyan-200">下限值</span>}
                    name={`lower_${item.parameter}`}
                    rules={[
                      { required: true, message: '请输入下限值' },
                      {
                        validator(_, value) {
                          if (isNaN(parseFloat(value))) {
                            return Promise.reject('请输入有效的数字');
                          }
                          return Promise.resolve();
                        },
                      },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          const upperValue = getFieldValue(`upper_${item.parameter}`);
                          if (upperValue && parseFloat(value) >= parseFloat(upperValue)) {
                            return Promise.reject('下限值必须小于上限值');
                          }
                          return Promise.resolve();
                        },
                      }),
                    ]}
                  >
                    <InputNumber 
                      placeholder="请输入下限值" 
                      className="w-full bg-[rgba(10,40,70,0.5)] border border-cyan-500/50 text-white"
                      step={0.01}
                    />
                  </Form.Item>
                  
                  <Form.Item
                    label={<span className="text-cyan-200">上限值</span>}
                    name={`upper_${item.parameter}`}
                    rules={[
                      { required: true, message: '请输入上限值' },
                      {
                        validator(_, value) {
                          if (isNaN(parseFloat(value))) {
                            return Promise.reject('请输入有效的数字');
                          }
                          return Promise.resolve();
                        },
                      },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          const lowerValue = getFieldValue(`lower_${item.parameter}`);
                          if (lowerValue && parseFloat(value) <= parseFloat(lowerValue)) {
                            return Promise.reject('上限值必须大于下限值');
                          }
                          return Promise.resolve();
                        },
                      }),
                    ]}
                  >
                    <InputNumber 
                      placeholder="请输入上限值" 
                      className="w-full bg-[rgba(10,40,70,0.5)] border border-cyan-500/50 text-white"
                      step={0.01}
                    />
                  </Form.Item>
                </div>
              </div>
            ))}
          </Form>
        </Modal>
      </div>

      {/* 全局样式 */}
      <style jsx global>{`
        .water-quality-anomaly-detection {
          .ant-card {
            border-radius: 12px;
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
          }
          
          .ant-card-head {
            background: linear-gradient(90deg, rgba(10, 25, 47, 0.5), rgba(10, 40, 70, 0.3)) !important;
          }
          
          .ant-table {
            background: transparent;
            color: #e2e8f0;
          }
          
          .ant-table-thead > tr > th {
            background: rgba(10, 40, 70, 0.5) !important;
            color: #6df7e1 !important;
            border-bottom: 1px solid rgba(0, 230, 255, 0.2) !important;
          }
          
          .ant-table-tbody > tr > td {
            border-bottom: 1px solid rgba(0, 230, 255, 0.1) !important;
            background: rgba(10, 25, 47, 0.3) !important;
          }
          
          .ant-table-tbody > tr:hover > td {
            background: rgba(10, 40, 70, 0.4) !important;
          }
          
          .custom-range-picker .ant-picker {
            background: rgba(10, 40, 70, 0.5);
            border: 1px solid rgba(0, 230, 255, 0.3);
            color: #6df7e1;
          }
          
          .custom-range-picker .ant-picker-input > input {
            color: #6df7e1;
          }
          
          .custom-range-picker .ant-picker-suffix {
            color: #6df7e1;
          }
          
          .ant-modal-content {
            background: linear-gradient(135deg, #0a192f, #0c2a4a) !important;
            border: 1px solid rgba(0, 230, 255, 0.3) !important;
            border-radius: 12px !important;
          }
          
          .ant-modal-header {
            background: rgba(10, 25, 47, 0.7) !important;
            border-bottom: 1px solid rgba(0, 230, 255, 0.3) !important;
          }
          
          .ant-modal-title {
            color: #6df7e1 !important;
          }
          
          .ant-modal-close-x {
            color: #6df7e1 !important;
          }
          
          .ant-input-number {
            color: #e2e8f0;
          }
          
          .ant-input-number-handler-wrap {
            background: rgba(10, 40, 70, 0.5);
          }
          
          .ant-tag {
            margin-right: 0;
          }
        }
      `}</style>
    </div>
  );
}

export default WaterQualityAnomalyDetection;