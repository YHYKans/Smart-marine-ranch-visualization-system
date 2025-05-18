import React, { useState } from 'react';

function Underwater() {
  // 状态声明
  const [selectedDate, setSelectedDate] = useState('2020-05-08');
  const [lineChart, setLineChart] = useState(null);
  const [pieChart, setPieChart] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 常量配置
  const minDate = '2020-05-08';
  const maxDate = '2021-04-05';

  // 样式对象
  const styles = {
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '2rem',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    },
    header: {
      textAlign: 'center',
      color: '#2c3e50',
      marginBottom: '2rem',
      fontSize: '2.5rem',
      textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
    },
    form: {
      display: 'flex',
      gap: '1rem',
      justifyContent: 'center',
      marginBottom: '2rem'
    },
    dateInput: {
      padding: '0.8rem',
      borderRadius: '8px',
      border: '2px solid #3498db',
      fontSize: '1.1rem',
      width: '220px',
      outline: 'none',
      transition: 'all 0.3s ease',
      ':focus': {
        borderColor: '#2980b9',
        boxShadow: '0 0 8px rgba(52,152,219,0.5)'
      }
    },
    submitButton: {
      padding: '0.8rem 2rem',
      backgroundColor: '#3498db',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '1.1rem',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      ':hover': {
        backgroundColor: '#2980b9',
        transform: 'translateY(-1px)'
      },
      ':disabled': {
        backgroundColor: '#bdc3c7',
        cursor: 'not-allowed',
        transform: 'none'
      }
    },
    error: {
      backgroundColor: '#ffe6e6',
      color: '#e74c3c',
      padding: '1rem',
      borderRadius: '8px',
      margin: '1rem auto',
      maxWidth: '600px',
      textAlign: 'center',
      border: '1px solid #e74c3c'
    },
    chartContainer: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
      gap: '2rem',
      marginTop: '2rem'
    },
    chartCard: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '1.5rem',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      transition: 'transform 0.3s ease',
      ':hover': {
        transform: 'translateY(-5px)'
      }
    },
    chartTitle: {
      color: '#2c3e50',
      marginBottom: '1rem',
      textAlign: 'center'
    },
    chartImage: {
      width: '100%',
      height: 'auto',
      borderRadius: '8px'
    },
    loadingOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    },
    spinner: {
      width: '50px',
      height: '50px',
      borderRadius: '50%',
      border: '4px solid #f3f3f3',
      borderTop: '4px solid #3498db',
      animation: 'spin 1s linear infinite'
    }
  };

  // 生成文件路径
  const generateFilePath = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `config/软件工程大作业数据/水质数据/${year}-${month}/${year}-${month}-${day}.json`;
  };

  // 提交处理
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const filePath = generateFilePath(selectedDate);
      
      const response = await fetch('http://localhost:3001/visualize-water', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_path: filePath })
      });

      if (!response.ok) throw new Error(await response.text());
      
      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setLineChart(data.line_chart);
      setPieChart(data.pie_chart);
    } catch (err) {
      setError(err.message);
      setLineChart(null);
      setPieChart(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>水下环境监测可视化系统</h1>

      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          min={minDate}
          max={maxDate}
          required
          style={styles.dateInput}
        />
        <button
          type="submit"
          style={{
            ...styles.submitButton,
            ...(isLoading && styles.submitButton[':disabled'])
          }}
          disabled={isLoading}
        >
          {isLoading ? '数据生成中...' : '开始可视化分析'}
        </button>
      </form>

      {error && <div style={styles.error}>⚠️ {error}</div>}

      {isLoading && (
        <div style={styles.loadingOverlay}>
          <div style={styles.spinner}></div>
          <p style={{ marginTop: '1rem', color: '#3498db' }}>正在分析水质数据...</p>
        </div>
      )}

      <div style={styles.chartContainer}>
        {lineChart && (
          <div style={styles.chartCard}>
            <h2 style={styles.chartTitle}>水质参数趋势分析</h2>
            <img 
              src={`data:image/png;base64,${lineChart}`} 
              alt="水质趋势图"
              style={styles.chartImage}
            />
          </div>
        )}

        {pieChart && (
          <div style={styles.chartCard}>
            <h2 style={styles.chartTitle}>水质类别分布统计</h2>
            <img
              src={`data:image/png;base64,${pieChart}`}
              alt="水质分布图"
              style={styles.chartImage}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default Underwater;