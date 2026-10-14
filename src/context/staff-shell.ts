import { createContext, useContext } from 'react';
export const StaffShellContext = createContext(false);
export const useStaffShell = () => useContext(StaffShellContext);
