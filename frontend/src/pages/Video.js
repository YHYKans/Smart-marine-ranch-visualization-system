import React, { useState, useEffect } from 'react';

const VideoList = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/videos');
        const data = await response.json();
        setVideos(data.videos);
      } catch (error) {
        console.error('Error fetching videos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  if (loading) {
    return <div>Loading videos...</div>;
  }

  return (
    <div className="video-container">
      <h1>Video List</h1>
      {videos.length === 0 ? (
        <p>No videos found</p>
      ) : (
        videos.map((video, index) => (
          <div key={index} className="video-item">
            <h3>{video}</h3>
            <video 
              controls 
              width="600"
              preload="auto"
              crossOrigin="anonymous"
              onLoadedMetadata={(e) => {
                // 确保元数据加载成功
                console.log('视频时长:', e.target.duration);
              }}
              onProgress={(e) => {
                // 显示加载进度
                const buffered = e.target.buffered;
                if (buffered.length > 0) {
                  console.log(`已缓冲至: ${buffered.end(0)}秒`);
                }
              }}
            >
              <source
                src={`http://localhost:3001/video/${video}?cache=${Date.now()}`}
                type="video/mp4"
              />
            </video>
          </div>
        ))
      )}
    </div>
  );
};


export default VideoList;