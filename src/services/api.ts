import { User } from '../types';

const API_BASE = '/api';

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('cognilearn_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  auth: {
    register: async (payload: {
      fullName: string;
      email: string;
      password: string;
      role: 'student' | 'teacher';
      teacherType?: string;
      avatar?: string | null;
      gradeLevel?: string;
      learningStyle?: string;
      curriculumTrack?: string;
      studySchedule?: string;
      guardianEmail?: string;
      institutionName?: string;
      teacherIdNumber?: string;
      department?: string;
      assignedClasses?: string[];
    }) => {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      if (data.token) {
        localStorage.setItem('cognilearn_token', data.token);
      }
      return data;
    },

    login: async (payload: { email: string; password: string; role?: 'student' | 'teacher' }) => {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      if (data.token) {
        localStorage.setItem('cognilearn_token', data.token);
      }
      return data;
    },

    getMe: async (): Promise<User | null> => {
      const token = localStorage.getItem('cognilearn_token');
      if (!token) return null;

      try {
        const response = await fetch(`${API_BASE}/auth/me`, {
          headers: getAuthHeaders(),
        });
        if (!response.ok) return null;
        const data = await response.json();
        return data.user;
      } catch (err) {
        return null;
      }
    },

    logout: () => {
      localStorage.removeItem('cognilearn_token');
    },
  },

  student: {
    getProfile: async () => {
      const response = await fetch(`${API_BASE}/student/profile`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to load profile');
      return data;
    },

    recordSession: async (payload: { durationMinutes: number; xpEarned: number; avgFocusScore?: number }) => {
      const response = await fetch(`${API_BASE}/student/session`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to record session');
      return data;
    },

    updateAvatar: async (avatar: string) => {
      const response = await fetch(`${API_BASE}/student/avatar`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ avatar }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to update avatar photo');
      return data;
    },
  },

  baseline: {
    recordScore: async (payload: {
      subject: string;
      cognitiveScore: number;
      focusIndex: number;
      retentionRate?: number;
      notes?: string;
    }) => {
      const response = await fetch(`${API_BASE}/baseline/score`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to save baseline score');
      return data;
    },

    getScores: async () => {
      const response = await fetch(`${API_BASE}/baseline/scores`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch baseline scores');
      return data.scores;
    },
  },

  user: {
    updateProfile: async (updateData: Partial<User>) => {
      const response = await fetch(`${API_BASE}/user/profile`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updateData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to update profile');
      return data;
    },

    deleteAccount: async () => {
      const response = await fetch(`${API_BASE}/user/account`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to delete account');
      localStorage.removeItem('cognilearn_token');
      return data;
    },
  },
};
