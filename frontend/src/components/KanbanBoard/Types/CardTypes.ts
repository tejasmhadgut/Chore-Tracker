export type StatusType =   "todo" | "doing" | "done";

export type RecurrenceType =   "Daily" | "Weekly" | "Monthly" | "Custom" | "None";
export type ChoreCardType = {
    name: string;
    id: number;
    description: string;
    recurrence: RecurrenceType;
    nextOccurrence: string;
    recurrenceEndDate: string | null;
    status: StatusType;
  };