import axios from "axios";
import { axiosInstance } from "./axiosConfig";
import { CreateGroup, Group } from "../components/types/types";

export const getGroupList = async (): Promise<Group[]> => {
    try {
        const response = await axiosInstance.get('/api/groups/my-groups');
        return response.data;

    } catch (error: unknown) {
        if(axios.isAxiosError(error) && error.response)
        {
            console.log("Axios error");
            throw new Error(error.response.data?.message || "Error Fetching Groups");
        } else if (error instanceof Error) {
            throw new Error(error?.message || "Error Fetching Groups");
        } else {
            throw new Error("Unknown Error")
        }

    }

};

export const getGroupByInvite = async (inviteCode: string): Promise<Group> => {
    try {
        console.log(inviteCode);
        const response = await axiosInstance.post('/api/groups/get-group', { InviteCode: inviteCode });
        return response.data;
    } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response) {
            console.log("Axios error");
            throw new Error(error.response.data?.message || "Error Fetching Group by Invite");
        } else if (error instanceof Error) {
            throw new Error(error.message || "Error Fetching Group by Invite");
        } else {
            throw new Error("Unknown Error");
        }
    }
};

export const handleJoin = async (groupId: number): Promise<void> => {
    try {
        console.log(groupId);
        const response = await axiosInstance.post('/api/groups/join', { groupId });
        return response.data;
    } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response) {
            console.log("Axios error");
            throw new Error(error.response.data?.message || "Error Joining Group");
        } else if (error instanceof Error) {
            throw new Error(error.message || "Error Joining Group");
        } else {
            throw new Error("Unknown Error");
        }
    }
};

export const handleGroupCreate = async (groupData: CreateGroup) => {
    try {
        const payload = {
            ...groupData
          };
        const response = await axiosInstance.post('/api/groups/create', payload);

      return response.data;
    } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response) {
            console.log("Axios error");
            throw new Error(error.response.data?.message || "Error Creating Group");
        } else if (error instanceof Error) {
            throw new Error(error.message || "Error Creating Group");
        } else {
            throw new Error("Unknown Error");
        }
    }
  };

  export const getGroupDetails = async (groupId: number) =>
  {
    try {
        const response = await axiosInstance.get(`/api/groups/group-details/${groupId}`);
          console.log("details");
          console.log(response.data);
        return response;
    } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response) {
            console.log("Axios error");
            throw new Error(error.response.data?.message || "Error Fetching Group Details");
        } else if (error instanceof Error) {
            throw new Error(error.message || "Error Fetching Group Details");
        } else {
            throw new Error("Unknown Error");
        }
    }
  }