import axios from "axios";

interface LoginResponse {
    token: string;
}

interface RegisterResponse {
    message: string;
}
const API_URL = 'http://localhost:5178/api/account';

export const login = async (userName: string, password: string): Promise<LoginResponse> => {
    try {
        const response = await axios.post(`${API_URL}/login`,{UserName: userName,Password: password},{withCredentials:true});
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
        const payload = { userName, email, password, firstName, lastName };
        console.log("Registering user with data:", payload); // Log request payload
        const response = await axios.post(`${API_URL}/register`,{userName: userName.toLowerCase(),email,password,firstName,lastName},{withCredentials:true});
        return response.data
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
      //  const response = await axios.get("http://localhost:500/auth/google",{
      //      withCredentials: true,
      //  });
        const response = await axios.get("http://localhost:5178/api/auth/google-response",{
              withCredentials: true,
          });
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