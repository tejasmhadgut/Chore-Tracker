export type Position = {
    left: number;
    width: number;
    height: number,
    opacity: number;
};
export interface Group {
    id: number;
    name: string;
    description: string;
    createdAt:string;
    memberNames:string[];
};

export type StatusType =   "todo" | "doing" | "done";

export type CardType = {
    name: string;
    id: number;
    description: string;
    recurrence: string;
    nextOccurrence: string;
    recurrenceEndDate: string | null;
    status: StatusType;
};
