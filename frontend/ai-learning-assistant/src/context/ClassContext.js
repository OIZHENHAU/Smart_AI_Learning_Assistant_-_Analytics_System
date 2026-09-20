import { createContext, useContext } from 'react';

//Shares the class that is currently open (set by ClassLayout) with the sidebar, which lives outside the class pages.
export const ClassContext = createContext({ currentClass: null, setCurrentClass: () => {} });

export const useCurrentClass = () => useContext(ClassContext);
