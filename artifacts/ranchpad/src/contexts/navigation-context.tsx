import React, { createContext, useContext, useState } from "react";

interface NavigationContextType {
  hasNavigated: boolean;
  markNavigated: () => void;
}

const NavigationContext = createContext<NavigationContextType>({
  hasNavigated: false,
  markNavigated: () => {},
});

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [hasNavigated, setHasNavigated] = useState(
    () => sessionStorage.getItem("ranchpad_navigated") === "1"
  );

  const markNavigated = () => {
    sessionStorage.setItem("ranchpad_navigated", "1");
    setHasNavigated(true);
  };

  return (
    <NavigationContext.Provider value={{ hasNavigated, markNavigated }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  return useContext(NavigationContext);
}
