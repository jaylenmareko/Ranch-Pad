import React, { createContext, useContext, useState } from "react";

interface NavigationContextType {
  hasNavigated: boolean;
  markNavigated: () => void;
  resetNavigation: () => void;
}

const NavigationContext = createContext<NavigationContextType>({
  hasNavigated: false,
  markNavigated: () => {},
  resetNavigation: () => {},
});

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [hasNavigated, setHasNavigated] = useState(
    () => sessionStorage.getItem("ranchpad_navigated") === "1"
  );

  const markNavigated = () => {
    sessionStorage.setItem("ranchpad_navigated", "1");
    setHasNavigated(true);
  };

  const resetNavigation = () => {
    sessionStorage.removeItem("ranchpad_navigated");
    setHasNavigated(false);
  };

  return (
    <NavigationContext.Provider value={{ hasNavigated, markNavigated, resetNavigation }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  return useContext(NavigationContext);
}
