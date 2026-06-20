import { axiosInstance } from './axiosConfig';

export interface Buddy {
  id: string;
  userName: string;
  email: string;
  firstName: string;
  lastName: string;
  profilePictureUrl: string | null;
}

export const fetchBuddyRecommendations = async (): Promise<Buddy[]> => {
  try {
    const response = await axiosInstance.get('/api/groups/buddy-recommendations');
    return response.data || [];
  } catch (err) {
    console.error('Failed to fetch buddy recommendations:', err);
    return [];
  }
};
