import {
  LuLayoutDashboard,
  LuClipboardList,
  LuUsers,
  LuSquarePlus,
  LuLogOut,
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
];


export default { SIDE_MENU_DATA, SIDE_MENU_USER_DATA, PRIORITY_DATA, STATUS_DATA };

