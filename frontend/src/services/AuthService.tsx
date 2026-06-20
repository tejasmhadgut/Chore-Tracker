import axios from "axios";
import { axiosInstance } from './axiosConfig';

interface LoginResponse {
    message: string;
    user: {
        firstName: string;
        lastName: string;
        userName: string;
        email: string;
        profilePictureUrl: string | null;
    };
};

interface RegisterResponse {
    message: string;
    user: {
        firstName: string;
        lastName: string;
        userName: string;
        email: string;
        profilePictureUrl: string | null;
    };
    token: string;
}

export const login = async (userName: string, password: string): Promise<LoginResponse> => {
    try {
        const response = await axiosInstance.post('/api/account/login', {
            UserName: userName,
            Password: password
        });
        return response.data;
    } catch (error: unknown) {
        if(axios.isAxiosError(error) && error.response)
        {
            throw new Error(error.response.data?.message || "Login failed");
        } else if (error instanceof Error) {
            throw new Error(error?.message || "Login failed");
        } else {
            throw new Error("Unknown Error")
        }
    }
};

export const register = async (
    userName: string,
    email: string,
    password: string,
    firstName: string,
    lastName: string
): Promise<RegisterResponse> => {
    try {
        const response = await axiosInstance.post('/api/account/register', {
            userName: userName.toLowerCase(),
            email,
            password,
            firstName,
            lastName
        });
        return response.data;
    } catch(error: unknown)
    {
        if(axios.isAxiosError(error) && error.response)
            {
                throw new Error(
                    error.response.data.message ||
                    error.response.data[0]?.description ||  // Handles ASP.NET Identity error array
                    "Registration failed"
                );
            } else {
                throw new Error("Unknown Error")
            }
    }
};

export const googleLogin = async () => {
    try {
        const response = await axiosInstance.get("/api/auth/google-response");
        return response.data;
    } catch(error: unknown) {
        if(error instanceof Error)
            {
                throw new Error(error?.message || "Login failed");
            } else {
                throw new Error("Unknown Error")
            }
    }
};

export const getProfileInfo = async (username?: string) => {
    try {
        const response = await axiosInstance.get(`/api/account/users/${username}`);
        return response.data;
    } catch (error: unknown)
    {
        if(axios.isAxiosError(error) && error.response)
            {
                throw new Error(
                    error.response.data.message ||
                    error.response.data[0]?.description ||  // Handles ASP.NET Identity error array
                    "Failed to fetch profile information"
                );
            } else {
                throw new Error("Unknown Error")
            }
    }
}

export const getCurrentUser = async () => {
    try {
        const response = await axiosInstance.get('/api/account/me');
        return response.data;
    } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response) {
            // If 401, user is not authenticated
            if (error.response.status === 401) {
                return null;
            }
            throw new Error(
                error.response.data.message ||
                "Failed to fetch current user information"
            );
        } else {
            throw new Error("Unknown Error");
        }
    }
}

export const logout = async (): Promise<void> => {
    try {
        // Call the logout endpoint on the backend
        await axiosInstance.post('/api/account/logout');
    } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(
                error.response.data.message ||
                "Failed to logout"
            );
        } else if (error instanceof Error) {
            throw new Error(error.message || "Logout failed");
        } else {
            throw new Error("Unknown Error");
        }
    }
}