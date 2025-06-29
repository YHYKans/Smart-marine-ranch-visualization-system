import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import DashboardLayout from './pages/DashboardLayout';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Underwater from './pages/Underwater';
import FishVisualization from './pages/FishVisualization';
import Weather from './pages/Weather';
import Video from './pages/Video';
import FishLengthPredictionPage from './pages/FishLengthPredictionPage';
import FishRecognition from './pages/FishRecognitionPage';
import Chat from './pages/ChatPage';
import Check from './pages/Check';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/auth" replace />} />
          <Route path="/auth" element={<AuthPage />} />
          
          <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route path="/user-dashboard" element={<UserDashboard />} />
            <Route path="/underwater" element={<Underwater />} />
            <Route path="/fish" element={<FishVisualization />} />
            <Route path="/weather" element={<Weather />} />
            <Route path="/video" element={<Video />} />
            <Route path="/FishRecognition" element={<FishRecognition />} />
            <Route path="/Chat" element={<Chat />} />
            <Route path="/Check" element={<Check />} />
            <Route path="/fish-length-prediction" element={<FishLengthPredictionPage />} />
            <Route path="/admin-dashboard" element={
              <ProtectedRoute requireAdmin>
                <AdminDashboard />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;