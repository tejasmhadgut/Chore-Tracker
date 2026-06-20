import React, { createContext, useState, useCallback, useContext, useEffect } from "react";
import { getGroupList } from "../services/GroupService";
import { Group } from "../components/types/types";
import { useAuth } from "./AuthContext";

type GroupContextType = {
  groups: Group[];
  refreshGroups: () => void;
};

const GroupContext = createContext<GroupContextType | undefined>(undefined);

export const GroupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const { user, loading } = useAuth();

  const fetchGroups = useCallback(async () => {
    try {
      const data = await getGroupList();
      setGroups(data);
    } catch (error) {
      console.error("Failed to fetch groups", error);
    }
  }, []);

  useEffect(() => {
    // Only fetch groups if user is authenticated and auth is done loading
    if (!loading && user) {
      fetchGroups();
    }
  }, [user, loading]);

  return (
    <GroupContext.Provider value={{ groups, refreshGroups: fetchGroups }}>
      {children}
    </GroupContext.Provider>
  );
};

export const useGroups = () => {
  const context = useContext(GroupContext);
  if (!context) {
    throw new Error("useGroups must be used within a GroupProvider");
  }
  return context;
};
