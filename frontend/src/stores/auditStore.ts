import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuditLog } from '../types';
import api from '../services/api';

interface AuditState {
  logs: AuditLog[];
  isLoading: boolean;
  fetchLogs: () => Promise<void>;
  addLog: (entry: { userId: string; role: string; action: string; details: string }) => void;
  clearLogs: () => void;
}

export const useAuditStore = create<AuditState>()(
  persist(
    (set) => ({
      logs: [],
      isLoading: false,

      fetchLogs: async () => {
        set({ isLoading: true });
        try {
          const response = await api.get('/audit-logs');
          if (response.data && response.data.success) {
            const backendLogs: AuditLog[] = response.data.data.map((l: any) => ({
              id: l.id?.toString() || `LOG-${Date.now()}`,
              timestamp: l.timestamp || new Date().toISOString(),
              userId: l.userId,
              role: l.role,
              action: l.action,
              details: l.details,
            }));
            set({ logs: backendLogs });
          }
        } catch (err) {
          console.error('Failed to fetch audit logs from backend:', err);
        } finally {
          set({ isLoading: false });
        }
      },

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

