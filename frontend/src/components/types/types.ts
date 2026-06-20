import { RecurrenceType } from "../KanbanBoard/Types/CardTypes";

export type Position = {
    top: number;
    left: number;
    width: number;
    height: number,
    opacity: number;
};
export type Member = {
    userId?: string;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    profilePictureUrl: string | null;
}
export interface Group {
    id: number;
    name: string;
    inviteCode: string;
    description: string;
    createdAt:string;
    members:Member[];
};
export interface CreateGroup {
    Name: string;
    Description: string;
    MemberEmails: string[];
}

export enum StatusType {
    todo = 0,
    doing = 1,
    done = 2
  }
export type CardType = {
    name: string;
    id: number;
    description: string;
    recurrence: RecurrenceType;
    recurrenceEndDate: string | null;
    status: StatusType;
};

// Member profile viewing
export interface MemberProfile {
    userId: string;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    profilePictureUrl: string | null;
}

export interface SharedGroup {
    id: number;
    name: string;
    description: string;
    memberCount: number;
    createdAt: string;
}

export interface MemberStatistics {
    totalChoresCompleted: number;
    completionRate: number;
    averageCompletionsPerWeek: number;
    mostActiveGroup: string;
    totalSharedGroups: number;
    recentStreak: number;
}

export interface Activity {
    type: string;
    timestamp: string;
    actor: string;
    actorUsername: string;
    actorUserId?: string;
    groupName: string;
    groupId: number;
    details: string;
    actorProfilePictureUrl: string;
}
