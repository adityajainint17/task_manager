export type UserRole = "ADMIN" | "PLS" | "QLS" | "TASKER";

export type User = {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
  role: UserRole;
};

export type ProjectRole = "ADMIN" | "MEMBER";
export type TaskStatus = "BACKLOG" | "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type Comment = {
  id: string;
  content: string;
  createdAt: string;
  author: User;
};

export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "ON_LEAVE";
export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED";

export type Attendance = {
  id: string;
  userId: string;
  punchIn: string;
  punchOut?: string | null;
  totalHours?: number | null;
  status: AttendanceStatus;
};

export type TaskSession = {
  id: string;
  taskId: string;
  userId: string;
  startedAt: string;
  pausedAt?: string | null;
  endedAt?: string | null;
  activeDuration: number;
};

export type LeaveRequest = {
  id: string;
  userId: string;
  reason: string;
  status: LeaveStatus;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
};


export type Task = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  order: number;
  projectId: string;
  assigneeId?: string | null;
  assignee?: User | null;
  creator?: User;
  comments: Comment[];
  taskSessions?: TaskSession[];
  project?: {
    id: string;
    name: string;
    key: string;
    color: string;
  };
};

export type Activity = {
  id: string;
  type: string;
  message: string;
  createdAt: string;
  actor?: User | null;
  project?: {
    key: string;
    color: string;
    name: string;
  };
};

export type Project = {
  id: string;
  name: string;
  key: string;
  description: string;
  color: string;
  role: ProjectRole;
  progress: number;
  taskCount: number;
  doneTasks: number;
  members: Array<User & { role: ProjectRole }>;
  recentActivity: Activity[];
};

export type ProjectDetail = {
  id: string;
  name: string;
  key: string;
  description: string;
  color: string;
  owner: User;
  members: Array<User & { role: ProjectRole }>;
  tasks: Task[];
  activities: Activity[];
};

export type DashboardStats = {
  stats: {
    totalProjects: number;
    totalTasks: number;
    assignedTasks: number;
    overdueTasks: number;
    dueTodayTasks: number;
    completionRate: number;
  };
  overdueTasks: Task[];
  dueTodayTasks: Task[];
  assignedTasks: Task[];
  statusBreakdown: Array<{ status: TaskStatus; count: number }>;
  priorityBreakdown: Array<{ priority: TaskPriority; count: number }>;
  projectProgress: Array<{
    id: string;
    name: string;
    key: string;
    color: string;
    progress: number;
    total: number;
    completed: number;
  }>;
  recentActivity: Activity[];
};

