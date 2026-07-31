import React, { createContext, useContext, useState, useEffect } from "react";

// createContext() is a React API that creates a "container" for data you want to share 
// across many components without manually passing the props down through every level.
const AuthContext = createContext(); 

export const useAuth = () => {
    //useContext(AuthContext) - it wraps in the custom useAuth() hook.
    /*
    Here, instead of every component calling useContext(AuthContext) directly, 
    that call is placed inside another function — useAuth — and other components call useAuth() 
    instead. That's what "wrapped" means: useAuth is a thin custom hook whose 
    body is just useContext(AuthContext) plus one extra step (the safety check).
    */
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used within a AuthProvider.");
    }

    return context;
};

export const AuthProvider = ({children}) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => { checkAuthStatus(); }, []);

    const checkAuthStatus = async () => {
        try {
            const token = localStorage.getItem('token');
            const userStr = localStorage.getItem('user');

            if (token && userStr) {
                const userData = JSON.parse(userStr);
                setUser(userData);
                setIsAuthenticated(true);
            }

        } catch (error) {
            console.error("Authentication checked was failed due to: " + error);
            logout();

        } finally {
            setLoading(false);
        }

    };

    const login = (userData, token) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));

        setUser(userData);
        setIsAuthenticated(true);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        setUser(null);
        setIsAuthenticated(false);
        window.location.href = '/'

    };

    const updateUser = (updatedUserData) => {
        const newUserData = { ...user, ...updatedUserData };
        localStorage.setItem('user', JSON.stringify(newUserData));
        setUser(newUserData);
    }

    const value = {
        user,
        loading,
        isAuthenticated,
        login,
        logout,
        updateUser,
        checkAuthStatus
    };

    //AuthContext.Provider wraps components and supplies the value. Any components inside it can read that value.
    /*
    - AuthProvider holds the actual auth state (user, isAuthenticated, login, logout, etc) 
    and passes it into AuthContext.Provider as a value.
    - Anywhere else in the app, a component can call useAuth() to get user, login(), 
    logout(), etc. directly — no need to pass them down as props through every parent component.
    */
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>

}