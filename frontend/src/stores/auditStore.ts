import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuditLog } from '../types';

interface AuditState {
  logs: AuditLog[];
  addLog: (entry: { userId: string; role: string; action: string; details: string }) => void;
  clearLogs: () => void;
}

export const useAuditStore = create<AuditState>()(
  persist(
    (set) => ({
      logs: [],

      addLog: ({ userId, role, action, details }) => {
        const newLog: AuditLog = {
          id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          timestamp: new Date().toISOString(),
          userId,
          role,
          action,
          details,
        };
        set((state) => ({ logs: [newLog, ...state.logs] }));
      },

      clearLogs: () => set({ logs: [] }),
    }),
    {
      name: 'voting_audit_logs',
    }
  )
);
