import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import Toast from './components/UI/Toast';
import LoadingSpinner from './components/UI/LoadingSpinner';

// Eager-load critical pages
import PublicLandingPage from './pages/PublicLandingPage';
import LandingPage from './pages/LandingPage';

// Lazy-load game pages
const CasesPage = lazy(() => import('./pages/CasesPage'));
const GamePage = lazy(() => import('./pages/GamePage'));
const LocationPage = lazy(() => import('./pages/LocationPage'));
const InterrogationPage = lazy(() => import('./pages/InterrogationPage'));
const BoardPage = lazy(() => import('./pages/BoardPage'));
const NotebookPage = lazy(() => import('./pages/NotebookPage'));
const AccusationPage = lazy(() => import('./pages/AccusationPage'));
const ResultPage = lazy(() => import('./pages/ResultPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const AdminCasePreviewPage = lazy(() => import('./pages/AdminCasePreviewPage'));

function SuspenseFallback() {
  return (
    <div className="h-[100dvh] bg-noir-900 flex items-center justify-center">
      <LoadingSpinner size={48} />
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
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
      <Suspense fallback={<SuspenseFallback />}>
        <Routes>
          <Route path="/" element={<PublicLandingPage />} />
          <Route path="/auth" element={<LandingPage />} />
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
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/cases/:caseId/preview"
            element={
              <ProtectedRoute>
                <AdminCasePreviewPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
