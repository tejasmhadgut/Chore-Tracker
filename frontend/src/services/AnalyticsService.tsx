import axios from "axios";
import { axiosInstance } from "./axiosConfig";

// Analytics DTOs
export interface AnalyticsSummary {
    totalTasksCompleted: number;
    activeMembers: number;
    completionRate: number;
    topPerformer: string;
    totalTasks: number;
    startDate: string;
    endDate: string;
    averageTasksPerMember: number;
}

export interface UserContribution {
    userId: string;
    userName: string;
    firstName: string;
    lastName: string;
    tasksCompleted: number;
    percentage: number;
    profilePictureUrl: string;
    rank: number;
}

export interface TimelineData {
    date: string;
    totalCompletions: number;
    userBreakdown: { [key: string]: number };
}

export interface TaskBreakdown {
    todoCount: number;
    inProgressCount: number;
    doneCount: number;
    totalTasks: number;
    todoPercentage: number;
    inProgressPercentage: number;
    donePercentage: number;
}

export interface ActivityHeatmap {
    dayOfWeek: number;
    dayName: string;
    hour: number;
    completionCount: number;
}

export interface DayOfWeekStats {
    dayOfWeek: number;
    dayName: string;
    completionCount: number;
    percentage: number;
}

export interface HourOfDayStats {
    hour: number;
    timeRange: string;
    completionCount: number;
    percentage: number;
}

export interface ChoreTypeStats {
    choreName: string;
    completionCount: number;
    percentage: number;
    lastCompleted: string;
    mostFrequentCompleter: string;
}

export interface DateRange {
    startDate?: Date;
    endDate?: Date;
}

// Helper function to format date parameters
const formatDateParam = (date?: Date): string | undefined => {
    if (!date) return undefined;
    return date.toISOString();
};

// Helper function to build query params
const buildQueryParams = (dateRange?: DateRange): string => {
    const params = new URLSearchParams();
    if (dateRange?.startDate) {
        params.append('startDate', formatDateParam(dateRange.startDate)!);
    }
    if (dateRange?.endDate) {
        params.append('endDate', formatDateParam(dateRange.endDate)!);
    }
    return params.toString();
};

// Analytics API calls
export const getAnalyticsSummary = async (
    groupId: number,
    dateRange?: DateRange
): Promise<AnalyticsSummary> => {
    try {
        const queryParams = buildQueryParams(dateRange);
        const url = `/api/groups/${groupId}/analytics/summary${queryParams ? `?${queryParams}` : ''}`;
        const response = await axiosInstance.get(url);
        return response.data;
    } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(error.response.data?.message || "Error fetching analytics summary");
        } else if (error instanceof Error) {
            throw new Error(error.message || "Error fetching analytics summary");
        } else {
            throw new Error("Unknown error fetching analytics summary");
        }
    }
};

export const getUserContributions = async (
    groupId: number,
    dateRange?: DateRange
): Promise<UserContribution[]> => {
    try {
        const queryParams = buildQueryParams(dateRange);
        const url = `/api/groups/${groupId}/analytics/user-contributions${queryParams ? `?${queryParams}` : ''}`;
        const response = await axiosInstance.get(url);
        return response.data;
    } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(error.response.data?.message || "Error fetching user contributions");
        } else if (error instanceof Error) {
            throw new Error(error.message || "Error fetching user contributions");
        } else {
            throw new Error("Unknown error fetching user contributions");
        }
    }
};

export const getTimelineData = async (
    groupId: number,
    dateRange?: DateRange
): Promise<TimelineData[]> => {
    try {
        const queryParams = buildQueryParams(dateRange);
        const url = `/api/groups/${groupId}/analytics/timeline${queryParams ? `?${queryParams}` : ''}`;
        const response = await axiosInstance.get(url);
        return response.data;
    } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(error.response.data?.message || "Error fetching timeline data");
        } else if (error instanceof Error) {
            throw new Error(error.message || "Error fetching timeline data");
        } else {
            throw new Error("Unknown error fetching timeline data");
        }
    }
};

export const getTaskBreakdown = async (
    groupId: number,
    dateRange?: DateRange
): Promise<TaskBreakdown> => {
    try {
        const queryParams = buildQueryParams(dateRange);
        const url = `/api/groups/${groupId}/analytics/task-breakdown${queryParams ? `?${queryParams}` : ''}`;
        const response = await axiosInstance.get(url);
        return response.data;
    } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(error.response.data?.message || "Error fetching task breakdown");
        } else if (error instanceof Error) {
            throw new Error(error.message || "Error fetching task breakdown");
        } else {
            throw new Error("Unknown error fetching task breakdown");
        }
    }
};

export const getActivityHeatmap = async (
    groupId: number,
    dateRange?: DateRange
): Promise<ActivityHeatmap[]> => {
    try {
        const queryParams = buildQueryParams(dateRange);
        const url = `/api/groups/${groupId}/analytics/activity-heatmap${queryParams ? `?${queryParams}` : ''}`;
        const response = await axiosInstance.get(url);
        return response.data;
    } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(error.response.data?.message || "Error fetching activity heatmap");
        } else if (error instanceof Error) {
            throw new Error(error.message || "Error fetching activity heatmap");
        } else {
            throw new Error("Unknown error fetching activity heatmap");
        }
    }
};

export const getDayOfWeekStats = async (
    groupId: number,
    dateRange?: DateRange
): Promise<DayOfWeekStats[]> => {
    try {
        const queryParams = buildQueryParams(dateRange);
        const url = `/api/groups/${groupId}/analytics/day-of-week-stats${queryParams ? `?${queryParams}` : ''}`;
        const response = await axiosInstance.get(url);
        return response.data;
    } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(error.response.data?.message || "Error fetching day of week stats");
        } else if (error instanceof Error) {
            throw new Error(error.message || "Error fetching day of week stats");
        } else {
            throw new Error("Unknown error fetching day of week stats");
        }
    }
};

export const getHourOfDayStats = async (
    groupId: number,
    dateRange?: DateRange
): Promise<HourOfDayStats[]> => {
    try {
        const queryParams = buildQueryParams(dateRange);
        const url = `/api/groups/${groupId}/analytics/hour-of-day-stats${queryParams ? `?${queryParams}` : ''}`;
        const response = await axiosInstance.get(url);
        return response.data;
    } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(error.response.data?.message || "Error fetching hour of day stats");
        } else if (error instanceof Error) {
            throw new Error(error.message || "Error fetching hour of day stats");
        } else {
            throw new Error("Unknown error fetching hour of day stats");
        }
    }
};

export const getChoreTypeStats = async (
    groupId: number,
    dateRange?: DateRange
): Promise<ChoreTypeStats[]> => {
    try {
        const queryParams = buildQueryParams(dateRange);
        const url = `/api/groups/${groupId}/analytics/chore-types${queryParams ? `?${queryParams}` : ''}`;
        const response = await axiosInstance.get(url);
        return response.data;
    } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(error.response.data?.message || "Error fetching chore type stats");
        } else if (error instanceof Error) {
            throw new Error(error.message || "Error fetching chore type stats");
        } else {
            throw new Error("Unknown error fetching chore type stats");
        }
    }
};
