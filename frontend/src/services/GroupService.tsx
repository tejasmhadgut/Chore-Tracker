import axios from "axios";
import { Group } from "../components/types/types";

const API_URL = 'http://localhost:5178/api/groups';

export const getGroupList = async (): Promise<Group[]> => {
    try {
        const response = await axios.get(`${API_URL}/my-groups`,{
            withCredentials: true,}
        );
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
        const response = await axios.post(`${API_URL}/get-group`, { inviteCode }, {
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

export const handleJoin = async (groupId: number): Promise<void> => {
    try {
        console.log(groupId);
        const response = await axios.post(`${API_URL}/join`, { groupId }, {
            withCredentials: true,
        });
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

