import axios from "axios";
import { axiosInstance } from "./axiosConfig";
import { errorHandler } from "./errorHandler";
import { CardType } from "../components/types/types";

export const getChoresByGroup = async (groupId: number) => {
    try {
      const response = await axiosInstance.get(`/api/chores/group/${groupId}`);
      return response.data;
    } catch (error: unknown) {
        const message = errorHandler.getUserFriendlyMessage(error, {
          operation: 'fetching chores',
          groupId: groupId
        });
        throw new Error(message);
    }
  };

export const getChoreById = async (choreId: number) => {
    try {
        const response = await axiosInstance.get(`/api/chores/${choreId}`);
      return response.data;
    } catch (error: unknown) {
        const message = errorHandler.getUserFriendlyMessage(error, {
          operation: 'fetching chore',
          choreId: choreId
        });
        throw new Error(message);
    }
  };
  
  export const updateChore = async (choreId: number, choreData: CardType) => {
    try {
      const response = await axiosInstance.put(`/api/chores/update/${choreId}`, choreData);
      return response.data;
    } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response) {
            console.log("Axios error");
            throw new Error(error.response.data?.message || "Error Updating Chore");
        } else if (error instanceof Error) {
            throw new Error(error.message || "Error Updating Chore");
        } else {
            throw new Error("Unknown Error");
        }
    }
  };

  export const createChore = async (groupId: number, choreData: CardType) => {
    try {
        const payload = {
            ...choreData,
            // Convert string dates to JavaScript Date objects
            recurrenceEndDate: choreData.recurrenceEndDate
              ? new Date(choreData.recurrenceEndDate)
              : null
          };
        const response = await axiosInstance.post(`/api/chores/${groupId}/create`, payload);

      return response.data;
    } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response) {
            console.log("Axios error");
            throw new Error(error.response.data?.message || "Error Creating Chore");
        } else if (error instanceof Error) {
            throw new Error(error.message || "Error Creating Chore");
        } else {
            throw new Error("Unknown Error");
        }
    }
  };
  
  export const deleteChore = async (choreId: number) => {
    try {
      const response = await axiosInstance.delete(`/api/chores/delete/${choreId}`);
      return response.data;
    } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response) {
            console.log("Axios error");
            throw new Error(error.response.data?.message || "Error Deleting Chore");
        } else if (error instanceof Error) {
            throw new Error(error.message || "Error Deleting Chore");
        } else {
            throw new Error("Unknown Error");
        }
    }
  };

  export const completeChore = async (choreId: number) => {
    try {
      const response = await axiosInstance.patch(`/api/chores/complete/${choreId}`);
      return response.data;
    } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response) {
            console.log("Axios error");
            throw new Error(error.response.data?.message || "Error Completing Chore");
        } else if (error instanceof Error) {
            throw new Error(error.message || "Error Completing Chore");
        } else {
            throw new Error("Unknown Error");
        }
    }
  };

  export const updateChoreStatus = async (choreId: number, status: number) => {
    try {
      const response = await axiosInstance.put(`/api/chores/update-status/${choreId}`, status);
      return response.data;
    } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response) {
            console.log("Axios error");
            throw new Error(error.response.data?.message || "Error Updating Chore Status");
        } else if (error instanceof Error) {
            throw new Error(error.message || "Error Updating Chore Status");
        } else {
            throw new Error("Unknown Error");
        }
    }
  };

  export const getChoresByStatus = async (groupId: number, status: string) => {
    try {
      const response = await axiosInstance.get(`/api/chores/group/${groupId}/status/${status}`);
      console.log("bystatus");
      console.log(response.data);
      return response.data;

    } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response) {
            console.log("Axios error");
            throw new Error(error.response.data?.message || "Error Fetching Chores by Status");
        } else if (error instanceof Error) {
            throw new Error(error.message || "Error Fetching Chores by Status");
        } else {
            throw new Error("Unknown Error");
        }
    }
  };
  
  // Get completed chores by date range
  export const getCompletedChores = async (groupId: number, startDate: Date, endDate: Date) => {
    try {
        const response = await axiosInstance.get(`/api/chores/${groupId}/completed-chores`, {
            params: { startDate, endDate },
          });

      return response.data;
    } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response) {
            console.log("Axios error");
            throw new Error(error.response.data?.message || "Error Fetching Completed Chores");
        } else if (error instanceof Error) {
            throw new Error(error.message || "Error Fetching Completed Chores");
        } else {
            throw new Error("Unknown Error");
        }
    }
  };
