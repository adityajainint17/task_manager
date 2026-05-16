export const USER_ROLES = ["ADMIN", "PLS", "QLS", "TASKER"] as const;
export const PROJECT_ROLES = ["ADMIN", "MEMBER"] as const;
export const TASK_STATUSES = ["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"] as const;
export const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
export const ATTENDANCE_STATUSES = ["PRESENT", "ABSENT", "LATE", "ON_LEAVE"] as const;
export const LEAVE_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;

export const ACTIVITY_TYPES = [
  "PROJECT_CREATED",
  "PROJECT_UPDATED",
  "PROJECT_DELETED",
  "MEMBER_ADDED",
  "MEMBER_REMOVED",
  "ROLE_UPDATED",
  "TASK_CREATED",
  "TASK_UPDATED",
  "TASK_DELETED",
  "TASK_STATUS_CHANGED",
  "COMMENT_ADDED",
  "PUNCH_IN",
  "PUNCH_OUT",
  "TASK_STARTED",
  "TASK_PAUSED",
  "TASK_RESUMED",
  "TASK_COMPLETED",
  "LEAVE_APPLIED",
  "LEAVE_STATUS_CHANGED"
] as const;

export type UserRole = (typeof USER_ROLES)[number];
export type ProjectRole = (typeof PROJECT_ROLES)[number];
export type TaskStatus = (typeof TASK_STATUSES)[number];
export type TaskPriority = (typeof TASK_PRIORITIES)[number];
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];
export type LeaveStatus = (typeof LEAVE_STATUSES)[number];
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

