import {
  LuLayoutDashboard,
  LuClipboardList,
  LuUsers,
  LuSquarePlus,
  LuLogOut,
  LuUser,
  LuMessageSquare,
  LuClock,
  LuVideo,
  LuFileText,
  LuPartyPopper,
} from 'react-icons/lu';

// Admin side menu items (Hierarchical structure)
export const SIDE_MENU_DATA = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/admin/dashboard',
    Icon: LuLayoutDashboard,
  },
  {
    id: 'tasks-group',
    label: 'Tasks',
    Icon: LuClipboardList,
    children: [
      { id: 'tasks', label: 'Manage Tasks', path: '/admin/tasks' },
      { id: 'verifications', label: 'Task Verification', path: '/admin/verifications' },
      { id: 'create-task', label: 'Create Task', path: '/admin/create-task' },
    ]
  },
  {
    id: 'hr-group',
    label: 'HR Portal',
    Icon: LuUsers,
    children: [
      { id: 'users', label: 'Team Members', path: '/admin/users' },
      { id: 'attendance', label: 'Attendance logs', path: '/admin/attendance' },
      { id: 'clock-in-out', label: 'Clock In/Out', path: '/admin/clock-in-out' },
      { id: 'leave-requests', label: 'Leave Requests', path: '/admin/leaves' },
    ]
  },
  {
    id: 'comms-group',
    label: 'Communications',
    Icon: LuMessageSquare,
    children: [
      { id: 'chat', label: 'Chat Workspace', path: '/admin/chat' },
      { id: 'meetings', label: 'Meetings', path: '/admin/meetings' },
    ]
  },
  {
    id: 'system-group',
    label: 'System Settings',
    Icon: LuUser,
    children: [
      { id: 'holiday-calendar', label: 'Public Holidays', path: '/admin/holidays' },
      { id: 'profile', label: 'Profile Settings', path: '/admin/profile' },
    ]
  },
  {
    id: 'logout',
    label: 'Logout',
    path: 'logout',
    Icon: LuLogOut,
  },
];

// Manager side menu items (Hierarchical structure)
export const SIDE_MENU_MANAGER_DATA = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/manager/dashboard',
    Icon: LuLayoutDashboard,
  },
  {
    id: 'tasks-group',
    label: 'Tasks',
    Icon: LuClipboardList,
    children: [
      { id: 'tasks', label: 'Manage Tasks', path: '/manager/tasks' },
      { id: 'verifications', label: 'Task Verification', path: '/manager/verifications' },
      { id: 'my-tasks', label: 'My Tasks', path: '/manager/my-tasks' },
      { id: 'create-task', label: 'Create Task', path: '/manager/create-task' },
    ]
  },
  {
    id: 'hr-group',
    label: 'HR Portal',
    Icon: LuUsers,
    children: [
      { id: 'users', label: 'Team Members', path: '/manager/users' },
      { id: 'attendance', label: 'Clock In/Out', path: '/manager/attendance' },
      { id: 'leave-requests', label: 'Leave Requests', path: '/manager/leaves' },
    ]
  },
  {
    id: 'comms-group',
    label: 'Communications',
    Icon: LuMessageSquare,
    children: [
      { id: 'chat', label: 'Chat Workspace', path: '/manager/chat' },
      { id: 'meetings', label: 'Meetings', path: '/manager/meetings' },
    ]
  },
  {
    id: 'system-group',
    label: 'System Settings',
    Icon: LuUser,
    children: [
      { id: 'holiday-calendar', label: 'Public Holidays', path: '/manager/holidays' },
      { id: 'profile', label: 'Profile Settings', path: '/manager/profile' },
    ]
  },
  {
    id: 'logout',
    label: 'Logout',
    path: 'logout',
    Icon: LuLogOut,
  },
];

// Member side menu items (Hierarchical structure)
export const SIDE_MENU_USER_DATA = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/user/dashboard',
    Icon: LuLayoutDashboard,
  },
  {
    id: 'tasks',
    label: 'My Tasks',
    path: '/user/my-tasks',
    Icon: LuClipboardList,
  },
  {
    id: 'hr-group',
    label: 'HR Portal',
    Icon: LuClock,
    children: [
      { id: 'attendance', label: 'Clock In/Out', path: '/user/attendance' },
      { id: 'leave-requests', label: 'Leave Requests', path: '/user/leaves' },
    ]
  },
  {
    id: 'comms-group',
    label: 'Communications',
    Icon: LuMessageSquare,
    children: [
      { id: 'chat', label: 'Chat Workspace', path: '/user/chat' },
      { id: 'meetings', label: 'Meetings', path: '/user/meetings' },
    ]
  },
  {
    id: 'system-group',
    label: 'System Settings',
    Icon: LuUser,
    children: [
      { id: 'holiday-calendar', label: 'Public Holidays', path: '/user/holidays' },
      { id: 'profile', label: 'Profile Settings', path: '/user/profile' },
    ]
  },
  {
    id: 'logout',
    label: 'Logout',
    path: 'logout',
    Icon: LuLogOut,
  },
];

 
export const PRIORITY_DATA = [
  {
    
    label: 'Low',
    value: 'low',
  },
  {
    
    label: 'Medium',
    value: 'medium',
  },
  {
    
    label: 'High',
    value: 'high',
  },
];
export const STATUS_DATA = [
  {
    label: 'Pending',
    value: 'pending',
  },
  {
    label: 'In Progress',
    value: 'in-progress',
  },
  {
    label: 'Completed',
    value: 'completed',
  },
  {
    label: 'Blocked',
    value: 'blocked',
  },
];


export default { SIDE_MENU_DATA, SIDE_MENU_MANAGER_DATA, SIDE_MENU_USER_DATA, PRIORITY_DATA, STATUS_DATA };

