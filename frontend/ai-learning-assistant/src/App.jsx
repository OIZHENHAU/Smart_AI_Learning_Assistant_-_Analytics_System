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
import ProgressPage from './pages/Progress/ProgressPage';
import { useAuth } from "../src/context/AuthContext"
import AchievementListPage from './pages/Achievements/AchievementListPage';
import AllBadgesPage from './pages/Achievements/AllBadgesPage';
import AllFeaturesPage from './pages/Achievements/AllFeaturesPage';
import LeaderboardPage from './pages/Achievements/LeaderboardPage';
import QuizListPage from './pages/Quizzes/QuizListPage';
import FillInBlankListPage from './pages/FillInBlank/FillInBlankListPage';
import FillInBlankTakePage from './pages/FillInBlank/FillInBlankTakePage';
import FillInBlankResultPage from './pages/FillInBlank/FillInBlankResultPage';
import SchedulingPage from './pages/Scheduling/SchedulingPage';
import UserManagementPage from './pages/Admin/UserManagementPage';
import ClassListPage from './pages/Classes/ClassListPage';
import ClassLayout from './pages/Classes/ClassLayout';
import ClassSectionPage from './pages/Classes/ClassSectionPage';
import ClassPermissionPage from './pages/Classes/ClassPermissionPage';
import ClassSettingsPage from './pages/Classes/ClassSettingsPage';
import ClassAnnouncementPage from './pages/Classes/ClassAnnouncementPage';
import ClassDocumentsPage from './pages/Classes/ClassDocumentsPage';
import ClassDocumentDetailPage from './pages/Classes/ClassDocumentDetailPage';
import ClassProblemSetsPage from './pages/Classes/ClassProblemSetsPage';
import ProblemSetBuilderPage from './pages/Classes/ProblemSetBuilderPage';
import { Trophy, Video, ClipboardCheck, BookOpen, Users, Home } from 'lucide-react';


const App = () => {
    const { isAuthenticate, loading } = useAuth();

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
                    <Route path="/quizzes" element={<QuizListPage />} />
                    <Route path="/quizzes/:id" element={<QuizTakePage />} />
                    <Route path="/quizzes/:id/results" element={<QuizResultPage />} />
                    <Route path="/fill-in-the-blank" element={<FillInBlankListPage />} />
                    <Route path="/fill-in-the-blank/:id" element={<FillInBlankTakePage />} />
                    <Route path="/fill-in-the-blank/:id/results" element={<FillInBlankResultPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path='/progress' element={<ProgressPage />}/>
                    <Route path='/achievements' element={<AchievementListPage/>}/>
                    <Route path='/achievements/badges' element={<AllBadgesPage/>}/>
                    <Route path='/achievements/features' element={<AllFeaturesPage/>}/>
                    <Route path='/achievements/leaderboard' element={<LeaderboardPage/>}/>
                    <Route path='/scheduling' element={<SchedulingPage/>}/>
                    <Route path='/admin/users' element={<UserManagementPage/>}/>
                    <Route path='/classes' element={<ClassListPage/>}/>
                    <Route path='/classes/:classId' element={<ClassLayout/>}>
                        <Route index element={<Navigate to='announcement' replace/>}/>
                        <Route path='home' element={<ClassSectionPage title='Home' description='An overview of this class.' icon={Home}/>}/>
                        <Route path='announcement' element={<ClassAnnouncementPage/>}/>
                        <Route path='lesson-plan' element={<ClassSectionPage title='Lesson Plan' description='The lesson plan for this class.' icon={BookOpen}/>}/>
                        <Route path='documents' element={<ClassDocumentsPage/>}/>
                        <Route path='documents/:documentId' element={<ClassDocumentDetailPage/>}/>
                        <Route path='users' element={<ClassSectionPage title='Users' description='The people who joined this class.' icon={Users}/>}/>
                        <Route path='leaderboard' element={<ClassSectionPage title='Leaderboard' description='See how everyone in the class ranks.' icon={Trophy}/>}/>
                        <Route path='problem-sets' element={<ClassProblemSetsPage/>}/>
                        <Route path='problem-sets/:setId' element={<ProblemSetBuilderPage/>}/>
                        <Route path='video' element={<ClassSectionPage title='Video' description='Lecture videos for this class.' icon={Video}/>}/>
                        <Route path='settings' element={<ClassSettingsPage/>}/>
                        <Route path='permission' element={<ClassPermissionPage/>}/>
                        <Route path='submission' element={<ClassSectionPage title='Submission' description='Assignments submitted by students.' icon={ClipboardCheck}/>}/>
                    </Route>
                </Route>

                <Route path="*" element={<NotFoundPage />}/>
            </Routes>
        </Router>
    )
}

export default App
