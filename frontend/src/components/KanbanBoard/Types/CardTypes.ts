export enum StatusType {
    todo = 0,
    doing = 1,
    done = 2
  }
  
  export enum RecurrenceType {
    Daily = 0,
    Weekly = 1,
    Monthly = 2,
    Custom = 3,
    None = 4
  }
export type ChoreCardType = {
    name: string;
    id: number;
    description: string;
    status: StatusType;
    recurrence: RecurrenceType;
    intervalDays: number | null;
    recurrenceEndDate: string | null;
    difficulty?: number; // 1=Easy, 3=Medium, 5=Hard
  };