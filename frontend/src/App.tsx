import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import Toast from './components/UI/Toast';
import LandingPage from './pages/LandingPage';
import CasesPage from './pages/CasesPage';
import GamePage from './pages/GamePage';
import LocationPage from './pages/LocationPage';
import InterrogationPage from './pages/InterrogationPage';
import BoardPage from './pages/BoardPage';
import NotebookPage from './pages/NotebookPage';
import AccusationPage from './pages/AccusationPage';
import ResultPage from './pages/ResultPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  const { loadFromStorage } = useAuthStore();

  useEffect(() => {
    loadFromStorage();
  }, []);

  return (
    <BrowserRouter>
      <Toast />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/cases"
          element={
            <ProtectedRoute>
              <CasesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/game/:sessionId"
          element={
            <ProtectedRoute>
              <GamePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/game/:sessionId/location/:slug"
          element={
            <ProtectedRoute>
              <LocationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/game/:sessionId/interrogation/:characterSlug"
          element={
            <ProtectedRoute>
              <InterrogationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/game/:sessionId/board"
          element={
            <ProtectedRoute>
              <BoardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/game/:sessionId/notebook"
          element={
            <ProtectedRoute>
              <NotebookPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/game/:sessionId/accuse"
          element={
            <ProtectedRoute>
              <AccusationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/game/:sessionId/result"
          element={
            <ProtectedRoute>
              <ResultPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
