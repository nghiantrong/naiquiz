import './App.css'
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import HomePage from './pages/HomePage'
import QuizPage from './pages/QuizPage'
import VocabListsPage from './pages/VocabListsPage'
import VocabDetailPage from './pages/VocabDetailPage'
import LoginPage from './features/auth/pages/LoginPage'
import ProtectedRoute from './components/ProtectedRoute'

function App() {

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected routes — require authentication */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/vocabs" element={<VocabListsPage />} />
            <Route path="/vocab/:listId" element={<VocabDetailPage />} />
            <Route path="/quiz" element={<QuizPage />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App
