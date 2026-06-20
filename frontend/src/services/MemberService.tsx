import { axiosInstance } from './axiosConfig';

/**
 * Get basic profile information for a member
 */
export const getMemberProfile = async (userId: string) => {
  try {
    const response = await axiosInstance.get(`/api/users/${userId}/profile`);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error.message;
  }
};

/**
 * Get all groups shared between current user and a member
 */
export const getMemberSharedGroups = async (userId: string) => {
  try {
    const response = await axiosInstance.get(`/api/users/${userId}/shared-groups`);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error.message;
  }
};

/**
 * Get recent activities from a member (only from shared groups)
 */
export const getMemberActivities = async (userId: string, limit: number = 15) => {
  try {
    const response = await axiosInstance.get(
      `/api/users/${userId}/activities?limit=${limit}`
    );
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error.message;
  }
};

/**
 * Get statistics for a member (calculated from shared groups only)
 */
export const getMemberStatistics = async (
  userId: string,
  startDate?: string,
  endDate?: string
) => {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await axiosInstance.get(
      `/api/users/${userId}/statistics${params.toString() ? '?' + params.toString() : ''}`
    );
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error.message;
  }
};
