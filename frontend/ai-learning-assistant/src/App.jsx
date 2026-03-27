import React from 'react'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom'
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import ProfilePage from './pages/Profile/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import DashboardPage from './pages/Dashboard/DashboardPage';
import DocumentDetailPage from './pages/Documents/DocumentDetailPage';
import DocumentListPage from './pages/Documents/DocumentListPage';
import FlashcardsListPage from './pages/Flashcards/FlashcardsListPage';
import FlashcardsPage from './pages/Flashcards/FlashcardsPage';
import QuizTakePage from './pages/Quizzes/QuizTakePage';
import QuizResultPage from './pages/Quizzes/QuizResultPage';


const App = () => {
    const isAuthenticate = false;
    const loading = false;

    if (loading) {
        return (
            <div className='flex items-center justify-center h-screen'>
                <p>Loading....</p>
            </div>
        );
    }

    return (
        <Router>
            <Routes>
                <Route path="/" element={isAuthenticate ? <Navigate to="/dashboard" replace/> : <Navigate to="/login" replace/>}/>

                <Route path="/login" element={<LoginPage />}/>
                <Route path="/register" element={<RegisterPage />}/>

                <Route element={<ProtectedRoute />}>
                    <Route path='/dashboard' element={<DashboardPage />}/>
                    <Route path="/documents" element={<DocumentListPage />} />
                    <Route path="/documents/:id" element={<DocumentDetailPage />} />
                    <Route path="/flashcards" element={<FlashcardsListPage />} />
                    <Route path="/documents/:id/flashcards" element={<FlashcardsPage />} />
                    <Route path="/quizzes/:id" element={<QuizTakePage />} />
                    <Route path="/quizzes/:id/results" element={<QuizResultPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                </Route>

                <Route path="*" element={<NotFoundPage />}/>
            </Routes>
        </Router>
    )
}

export default App
