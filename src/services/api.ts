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

async function safeParseJson(response: Response): Promise<any> {
  const contentType = response.headers.get('content-type') || '';
  let parsedData: any = null;

  if (contentType.includes('application/json')) {
    try {
      parsedData = await response.json();
    } catch {
      // JSON parse fallback
    }
  }

  if (parsedData === null) {
    try {
      const rawText = await response.text();
      if (rawText) {
        try {
          parsedData = JSON.parse(rawText);
        } catch {
          parsedData = { rawText };
        }
      }
    } catch {
      parsedData = null;
    }
  }

  if (!response.ok) {
    const serverMsg =
      parsedData?.message ||
      parsedData?.error ||
      (typeof parsedData?.rawText === 'string' && !parsedData.rawText.trim().startsWith('<') ? parsedData.rawText : null);

    if (serverMsg) {
      throw new Error(serverMsg);
    }

    if (response.status === 500) {
      throw new Error('Server error (500). Please check your database connection or environment credentials.');
    } else if (response.status === 502 || response.status === 504) {
      throw new Error(`Server gateway error (${response.status}). Server function timed out or is restarting.`);
    } else if (response.status === 401) {
      throw new Error('Invalid email or password');
    } else {
      throw new Error(`HTTP Error (${response.status})`);
    }
  }

  return parsedData || {};
}

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

      const data = await safeParseJson(response);
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

      const data = await safeParseJson(response);
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
        const data = await safeParseJson(response);
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
      const data = await safeParseJson(response);
      if (!response.ok) throw new Error(data.message || 'Failed to load profile');
      return data;
    },

    recordSession: async (payload: { durationMinutes: number; xpEarned: number; avgFocusScore?: number }) => {
      const response = await fetch(`${API_BASE}/student/session`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await safeParseJson(response);
      if (!response.ok) throw new Error(data.message || 'Failed to record session');
      return data;
    },

    recordBreak: async (payload: {
      breakType: string;
      durationSeconds: number;
      triggerFocusScore: number;
      completed: boolean;
    }) => {
      const response = await fetch(`${API_BASE}/student/break`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await safeParseJson(response);
      if (!response.ok) throw new Error(data.message || 'Failed to record break');
      return data;
    },

    updateAvatar: async (avatar: string) => {
      const response = await fetch(`${API_BASE}/student/avatar`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ avatar }),
      });
      const data = await safeParseJson(response);
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
      const data = await safeParseJson(response);
      if (!response.ok) throw new Error(data.message || 'Failed to save baseline score');
      return data;
    },

    getScores: async () => {
      const response = await fetch(`${API_BASE}/baseline/scores`, {
        headers: getAuthHeaders(),
      });
      const data = await safeParseJson(response);
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
      const data = await safeParseJson(response);
      if (!response.ok) throw new Error(data.message || 'Failed to update profile');
      return data;
    },

    deleteAccount: async () => {
      const response = await fetch(`${API_BASE}/user/account`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await safeParseJson(response);
      if (!response.ok) throw new Error(data.message || 'Failed to delete account');
      localStorage.removeItem('cognilearn_token');
      return data;
    },

    resetDatabase: async () => {
      const response = await fetch(`${API_BASE}/user/reset-database`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await safeParseJson(response);
      if (!response.ok) throw new Error(data.message || 'Failed to reset database');
      localStorage.removeItem('cognilearn_token');
      localStorage.removeItem('cognilearn_recent_activities');
      return data;
    },
  },
};
