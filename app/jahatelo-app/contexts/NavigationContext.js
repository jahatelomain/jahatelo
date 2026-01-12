import React, { createContext, useContext, useRef } from 'react';

const NavigationContext = createContext(null);

export const NavigationProvider = ({ children }) => {
  const navigationRef = useRef(null);

  const navigate = (name, params) => {
    if (navigationRef.current) {
      navigationRef.current.navigate(name, params);
    }
  };

  const goBack = () => {
    if (navigationRef.current) {
      navigationRef.current.goBack();
    }
  };

  const getCurrentRoute = () => {
    if (navigationRef.current) {
      return navigationRef.current.getCurrentRoute();
    }
    return null;
  };

  return (
    <NavigationContext.Provider value={{ navigationRef, navigate, goBack, getCurrentRoute }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigationContext = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigationContext must be used within NavigationProvider');
  }
  return context;
};
