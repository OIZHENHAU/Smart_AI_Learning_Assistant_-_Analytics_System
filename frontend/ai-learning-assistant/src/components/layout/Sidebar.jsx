import React from 'react';
import { Link, useNavigate, useLocation, useMatch } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCurrentClass } from '../../context/ClassContext';
import { LayoutDashboard, Brain, Notebook, Activity, CircleQuestionMarkIcon, Trophy, ClipboardListIcon, FileQuestion, CalendarClockIcon, UserCircle2, Users, School, X, GraduationCap, ArrowLeft, Megaphone, ListChecks, Video, Settings, ShieldCheck, ClipboardCheck, Home, BookOpen } from 'lucide-react';
import ProfilePage from '../../pages/Profile/ProfilePage';

const Sidebar = ({isSidebarOpen, toggleSidebar}) => {
    const { logout, user } = useAuth();
    const { currentClass } = useCurrentClass();
    const navigate = useNavigate();
    const location = useLocation();

    const isActive = (to) => {
        // When navigating to a quiz page from the Documents context, keep Documents highlighted
        const fromDocuments = location.state?.from === 'documents';
        if (fromDocuments && location.pathname.startsWith('/quizzes')) {
            return to === '/documents';
        }
        return location.pathname === to || location.pathname.startsWith(to + '/');
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    }

    const baseNavLinks = [
        {to: '/dashboard', icon: Brain, text: 'Dashboard' },
        {to: '/documents', icon: Notebook, text: 'Documents'},
        {to: '/quizzes', icon: CircleQuestionMarkIcon, text: 'Quiz'},
        {to: '/achievements', icon: Trophy, text: 'Achievements'},
        {to: '/flashcards', icon: ClipboardListIcon, text: 'Flashcards'},
        {to: '/fill-in-the-blank', icon: FileQuestion, text: 'Fill-In Questions'},
        {to: '/progress', icon: Activity, text: 'Performance'},
        {to: '/scheduling', icon: CalendarClockIcon, text: "Timetable"},
        {to: '/classes', icon: GraduationCap, text: 'Class', roles: ['student', 'lecturer', 'parents', 'admin']},
        {to: '/admin/users', icon: Users, text: 'User Management', roles: ['admin']},
        {to: '/profile', icon: UserCircle2, text: "Profile"}
    ]

    //Inside /classes/:classId/... the sidebar shows the class sections instead of the normal menu.
    const classMatch = useMatch('/classes/:classId/*');
    const classBase = classMatch ? `/classes/${classMatch.params.classId}` : '';

    const classNavLinks = [
        {to: '/classes', icon: ArrowLeft, text: 'Back to Classes', back: true},
        {to: `${classBase}/home`, icon: Home, text: 'Home'},
        {to: `${classBase}/announcement`, icon: Megaphone, text: 'Announcement'},
        {to: `${classBase}/documents`, icon: Notebook, text: 'Documents'},
        {to: `${classBase}/problem-sets`, icon: ListChecks, text: 'Problem Sets'},
        {to: `${classBase}/leaderboard`, icon: Trophy, text: 'Leaderboard'},
        {to: `${classBase}/video`, icon: Video, text: 'Video'},
        {to: `${classBase}/submission`, icon: ClipboardCheck, text: 'Submission'},
        {to: `${classBase}/lesson-plan`, icon: BookOpen, text: 'Lesson Plan'},
        {to: `${classBase}/users`, icon: Users, text: 'Users'},
        {to: `${classBase}/permission`, icon: ShieldCheck, text: 'Permission', roles: ['lecturer', 'parents', 'admin']},
        {to: `${classBase}/settings`, icon: Settings, text: 'Settings'},
    ]

    //Links with a `roles` list are only shown to those roles; links without one are shown to everyone.
    const navLinks = (classMatch ? classNavLinks : baseNavLinks)
        .filter(link => !link.roles || link.roles.includes(user?.role))

    return <>
        <div className={`fixed inset-0 bg-black/30 z-40 md:hidden transition-opacity duration-300
                        ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={toggleSidebar}
            aria-hidden="true"  
        >
        </div>
        <aside className={`fixed top-0 left-0 h-full w-64 bg-white/90 backdrop-blur-lg border-r border-slate-200/60 z-50 md:relative md:w-64 md:shrink-0 md:flex md:flex-col md:translate-x-0 transition-transform duration-300 ease-in-out
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                {/* Logo and Close button*/}
                <div className='flex items-center justify-between h-16 px-5 border-b border-slate-200/60'>
                    <div className='flex items-center gap-3'>
                        <div className='flex items-center justify-center w-9 h-9 rounded-xl bg-linear-to-br from-purple-400 to-purple-500 shadow-md show-purple-500/20'>
                            <Brain className='text-white' size={20} strokeWidth={2.5}/>
                        </div>
                        <h1 className='text-sm md:text-base font-bold text-slate-900 tracking-light'>LearnAI</h1>
                    </div>
                    <button onClick={toggleSidebar} className='md:hidden text-slate-500 hover:text-slate-800'>
                        <X size={24} />
                    </button>
                </div>

                {/* The class that is open (only inside a class) */}
                {classMatch && currentClass && String(currentClass.id) === classMatch.params.classId && (
                    <div className='px-5 py-4 border-b border-slate-200/60'>
                        <div className='flex items-center gap-3'>
                            <div className='w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center shrink-0'>
                                <School className='w-6 h-6 text-purple-500' strokeWidth={2} />
                            </div>
                            <div className='min-w-0'>
                                <h2 className='text-lg font-bold text-slate-900 leading-tight truncate' title={currentClass.class_name}>
                                    {currentClass.class_name}
                                </h2>
                                <p className='text-xs text-slate-500 truncate'>Lecturer: {currentClass.owner_name}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Nvigation bar */}
                <nav className={`flex-1 px-3 space-y-1.5 ${classMatch ? 'py-4' : 'py-6'}`}>
                    {
                        navLinks.map((link) => {
                            const active = !link.back && isActive(link.to);
                            return (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    onClick={toggleSidebar}
                                    className={`group flex items-center gap-3 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200
                                        ${active
                                            ? "bg-linear-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/25"
                                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                        }`}
                                >
                                    <link.icon
                                        size={18}
                                        strokeWidth={2.5}
                                        className={`transition-transform duration-200 ${active ? '' : 'group-hover:scale-110'}`}
                                    />
                                    {link.text}
                                </Link>
                            );
                        })
                    }
                </nav>
        </aside>
    </>
}

export default Sidebar;