import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { TrackQueueProvider } from './contexts/TrackQueueContext';
import { PrivateRoute } from './components/PrivateRoute';
import { MainLayout } from './layouts/MainLayout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Toaster } from 'react-hot-toast';
import { useTagStatsInit } from './hooks/useTagStatsInit';

const AppContent = () => {
  useTagStatsInit();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/*"
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <TrackQueueProvider>
          <AppContent />
          <Toaster position="top-right" />
        </TrackQueueProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;