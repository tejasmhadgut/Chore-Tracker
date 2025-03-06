import axios from "axios";
import { CardType } from "../components/types/types";

const API_URL = 'http://localhost:5178/api/chores';

export const getChoresByGroup = async (groupId: number) => {
    try {
      const response = await axios.get(`${API_URL}/group/${groupId}`, {  withCredentials: true, });
      return response.data;
    } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response) {
            console.log("Axios error");
            throw new Error(error.response.data?.message || "Error Fetching Group");
        } else if (error instanceof Error) {
            throw new Error(error.message || "Error Fetching Group");
        } else {
            throw new Error("Unknown Error");
        }
    }
  };

export const getChoreById = async (choreId: number) => {
    try {
        const response = await axios.get(`${API_URL}/${choreId}`, {
            withCredentials: true,
        });
      return response.data;
    } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response) {
            console.log("Axios error");
            throw new Error(error.response.data?.message || "Error Fetching Group");
        } else if (error instanceof Error) {
            throw new Error(error.message || "Error Fetching Group");
        } else {
            throw new Error("Unknown Error");
        }
    }
  };
  
  export const updateChore = async (choreId: number, choreData: CardType) => {
    try {
      const response = await axios.put(`${API_URL}/update/${choreId}`, choreData,{
        withCredentials:true,
      });
      return response.data;
    } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response) {
            console.log("Axios error");
            throw new Error(error.response.data?.message || "Error Updating Chore");
        } else if (error instanceof Error) {
            throw new Error(error.message || "Error Fetching Group");
        } else {
            throw new Error("Unknown Error");
        }
    }
  };

  export const createChore = async ( choreData: CardType) => {
    try {
      const response = await axios.post(`${API_URL}/create`, choreData,{
        withCredentials:true,
      });
      return response.data;
    } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response) {
            console.log("Axios error");
            throw new Error(error.response.data?.message || "Error Fetching Group");
        } else if (error instanceof Error) {
            throw new Error(error.message || "Error Fetching Group");
        } else {
            throw new Error("Unknown Error");
        }
    }
  };
  
  export const deleteChore = async (choreId: number) => {
    try {
      const response = await axios.delete(`${API_URL}/delete/${choreId}`,{
        withCredentials:true,
      });
      return response.data;
    } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response) {
            console.log("Axios error");
            throw new Error(error.response.data?.message || "Error Fetching Group");
        } else if (error instanceof Error) {
            throw new Error(error.message || "Error Fetching Group");
        } else {
            throw new Error("Unknown Error");
        }
    }
  };

  export const completeChore = async (choreId: number) => {
    try {
      const response = await axios.patch(`${API_URL}/complete/${choreId}`,{
        withCredentials:true,
      });
      return response.data;
    } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response) {
            console.log("Axios error");
            throw new Error(error.response.data?.message || "Error Fetching Group");
        } else if (error instanceof Error) {
            throw new Error(error.message || "Error Fetching Group");
        } else {
            throw new Error("Unknown Error");
        }
    }
  };

  export const updateChoreStatus = async (choreId: number, status: string) => {
    try {
      const response = await axios.put(`${API_URL}/update-status/${choreId}`, { status},
        {withCredentials:true,
       });
      return response.data;
    } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response) {
            console.log("Axios error");
            throw new Error(error.response.data?.message || "Error Fetching Group");
        } else if (error instanceof Error) {
            throw new Error(error.message || "Error Fetching Group");
        } else {
            throw new Error("Unknown Error");
        }
    }
  };

  export const getChoresByStatus = async (groupId: number, status: string) => {
    try {
      const response = await axios.get(`${API_URL}/group/${groupId}/status/${status}`,
        {withCredentials:true,}
      );
      return response.data;
      
    } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response) {
            console.log("Axios error");
            throw new Error(error.response.data?.message || "Error Fetching Group");
        } else if (error instanceof Error) {
            throw new Error(error.message || "Error Fetching Group");
        } else {
            throw new Error("Unknown Error");
        }
    }
  };
  
  // Get completed chores by date range
  export const getCompletedChores = async (groupId: number, startDate: Date, endDate: Date) => {
    try {
        const response = await axios.get(`${API_URL}/${groupId}/completed-chores`, {
            params: { startDate, endDate },
            withCredentials: true, // Move this inside the config object
          });
    
      return response.data;
    } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response) {
            console.log("Axios error");
            throw new Error(error.response.data?.message || "Error Fetching Group");
        } else if (error instanceof Error) {
            throw new Error(error.message || "Error Fetching Group");
        } else {
            throw new Error("Unknown Error");
        }
    }
  };
