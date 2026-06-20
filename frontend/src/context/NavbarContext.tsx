// contexts/NavbarContext.tsx
import React, { createContext, useContext, useState } from 'react';

type NavbarContextType = {
  refreshGroups?: () => void;
  onGroupJoined?: (groupID: number) => void;
  setNavbarProps: (props: {
    refreshGroups?: () => void;
    onGroupJoined?: (groupID: number) => void;
  }) => void;
};

const NavbarContext = createContext<NavbarContextType>({
  setNavbarProps: () => {}
});

export const NavbarProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [props, setProps] = useState<Omit<NavbarContextType, 'setNavbarProps'>>({});

  return (
    <NavbarContext.Provider value={{ ...props, setNavbarProps: setProps }}>
      {children}
    </NavbarContext.Provider>
  );
};

export const useNavbar = () => useContext(NavbarContext);