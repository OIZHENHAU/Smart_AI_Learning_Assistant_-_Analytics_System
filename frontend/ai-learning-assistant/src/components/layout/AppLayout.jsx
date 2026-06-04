import React, { useState, useEffect, useRef } from "react";
import Sidebar from './Sidebar';
import Header from './Header';
import progressService from "../../services/ProgressService";

const AppLayout = ({children}) => {
    const [isSideBarOpen, setIsSideBarOpen] = useState(false);
    const sessionIdRef = useRef(null);

    useEffect(() => {
        const startSession = async () => {
            try {
                const data = await progressService.getStartSession();
                sessionIdRef.current = data?.data?.sessionId || null;
            } catch {
                // silently ignore — session tracking is non-critical
            }
        };

        const endSession = () => {
            if (sessionIdRef.current) {
                progressService.getEndSession(sessionIdRef.current).catch(() => {});
                sessionIdRef.current = null;
            }
        };

        startSession();

        window.addEventListener("beforeunload", endSession);
        return () => {
            endSession();
            window.removeEventListener("beforeunload", endSession);
        };
    }, []);

    const toggleSidebar = () => {
        setIsSideBarOpen(!isSideBarOpen);
    }

    return (
        <div className="flex h-screen bg-neutral-50 text-neutral-900">
            <Sidebar isSideBarOpen={isSideBarOpen} toggleSidebar={toggleSidebar}/>
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header toggleSidebar={toggleSidebar}/>
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}

export default AppLayout