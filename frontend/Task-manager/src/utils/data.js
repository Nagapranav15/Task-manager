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

// Admin side menu items
export const SIDE_MENU_DATA = [
  {
    id: '01',
    label: 'Dashboard',
    path: '/admin/dashboard',
    Icon: LuLayoutDashboard,
  },
  {
    id: '02',
    label: 'Manage Tasks',
    path: '/admin/tasks',
    Icon: LuClipboardList,
  },
  {
    id: 'verifications',
    label: 'Task Verification',
    path: '/admin/verifications',
    Icon: LuClipboardList,
  },
  {
    id: '03',
    label: 'Create Task',
    path: '/admin/create-task',
    Icon: LuSquarePlus,
  },
  {
    id: '04',
    label: 'Team Members',
    path: '/admin/users',
    Icon: LuUsers,
  },
  {
    id: 'attendance',
    label: 'Attendance logs',
    path: '/admin/attendance',
    Icon: LuClock,
  },
  {
    id: 'clock-in-out',
    label: 'Clock In/Out',
    path: '/admin/clock-in-out',
    Icon: LuClock,
  },
  {
    id: 'chat',
    label: 'Chat Workspace',
    path: '/admin/chat',
    Icon: LuMessageSquare,
  },
  {
    id: 'meetings',
    label: 'Meetings',
    path: '/admin/meetings',
    Icon: LuVideo,
  },
  {
    id: 'leave-requests',
    label: 'Leave Requests',
    path: '/admin/leaves',
    Icon: LuFileText,
  },
  {
    id: 'holiday-calendar',
    label: 'Public Holidays',
    path: '/admin/holidays',
    Icon: LuPartyPopper,
  },
  {
    id: 'profile',
    label: 'Profile Settings',
    path: '/admin/profile',
    Icon: LuUser,
  },
  {
    id: '05',
    label: 'Logout',
    path: 'logout',
    Icon: LuLogOut,
  },
];

// Manager side menu items
export const SIDE_MENU_MANAGER_DATA = [
  {
    id: '01',
    label: 'Dashboard',
    path: '/manager/dashboard',
    Icon: LuLayoutDashboard,
  },
  {
    id: '02',
    label: 'Manage Tasks',
    path: '/manager/tasks',
    Icon: LuClipboardList,
  },
  {
    id: 'verifications',
    label: 'Task Verification',
    path: '/manager/verifications',
    Icon: LuClipboardList,
  },
  {
    id: 'my-tasks',
    label: 'My Tasks',
    path: '/manager/my-tasks',
    Icon: LuClipboardList,
  },
  {
    id: '03',
    label: 'Create Task',
    path: '/manager/create-task',
    Icon: LuSquarePlus,
  },
  {
    id: '04',
    label: 'Team Members',
    path: '/manager/users',
    Icon: LuUsers,
  },
  {
    id: 'attendance',
    label: 'Clock In/Out',
    path: '/manager/attendance',
    Icon: LuClock,
  },
  {
    id: 'chat',
    label: 'Chat Workspace',
    path: '/manager/chat',
    Icon: LuMessageSquare,
  },
  {
    id: 'meetings',
    label: 'Meetings',
    path: '/manager/meetings',
    Icon: LuVideo,
  },
  {
    id: 'leave-requests',
    label: 'Leave Requests',
    path: '/manager/leaves',
    Icon: LuFileText,
  },
  {
    id: 'holiday-calendar',
    label: 'Public Holidays',
    path: '/manager/holidays',
    Icon: LuPartyPopper,
  },
  {
    id: 'profile',
    label: 'Profile Settings',
    path: '/manager/profile',
    Icon: LuUser,
  },
  {
    id: '05',
    label: 'Logout',
    path: 'logout',
    Icon: LuLogOut,
  },
];

// Member side menu items
export const SIDE_MENU_USER_DATA = [
  {
    id: '01',
    label: 'Dashboard',
    path: '/user/dashboard',
    Icon: LuLayoutDashboard,
  },
  {
    id: '02',
    label: 'My Tasks',
    path: '/user/my-tasks',
    Icon: LuClipboardList,
  },
  {
    id: 'attendance',
    label: 'Clock In/Out',
    path: '/user/attendance',
    Icon: LuClock,
  },
  {
    id: 'chat',
    label: 'Chat Workspace',
    path: '/user/chat',
    Icon: LuMessageSquare,
  },
  {
    id: 'meetings',
    label: 'Meetings',
    path: '/user/meetings',
    Icon: LuVideo,
  },
  {
    id: 'leave-requests',
    label: 'Leave Requests',
    path: '/user/leaves',
    Icon: LuFileText,
  },
  {
    id: 'holiday-calendar',
    label: 'Public Holidays',
    path: '/user/holidays',
    Icon: LuPartyPopper,
  },
  {
    id: 'profile',
    label: 'Profile Settings',
    path: '/user/profile',
    Icon: LuUser,
  },
  {
    id: '05',
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

