
// API client utilities for the Job Tracker frontend.


import axios, { AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Cache for storing responses
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 60000; // 1 minute

// Add request interceptor for logging
apiClient.interceptors.request.use((config) => {
  console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
  return config;
});

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log(`[API] Response: ${response.status}`);
    return response;
  },
  (error: AxiosError) => {
    console.error(`[API] Error: ${error.message}`);
    return Promise.reject(error);
  }
);

export interface JobApplication {
  id: number;
  company: string;
  position_title: string;
  current_stage: string;
  status: string;
  application_date: string;
  rejection_reason?: string;
  job_url?: string;
  notes?: string;
  salary_min?: number;
  salary_max?: number;
  location?: string;
  application_source: string;
  follow_up_date?: string;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsOverview {
  total_applications: number;
  active_applications: number;
  rejection_rate: number;
  interview_conversion_rate: number;
  average_response_time_days: number;
  offers_received: number;
  applications_by_stage: Record<string, number>;
  applications_by_source: Record<string, number>;
  top_rejecting_companies: Array<{ company: string; rejections: number }>;
}

export interface RejectionAnalysis {
  rejections_by_stage: Record<string, number>;
  rejections_by_company: Record<string, number>;
  total_rejections: number;
  rejection_rate: number;
}

export interface PredictionResponse {
  success_probability: number;
  confidence: number;
  recommendations: string[];
}

export interface TimeSeriesData {
  data: Array<{
    date: string;
    applications: number;
    rejections: number;
  }>;
}

// Helper function to use cache
function getCachedOrFetch<T>(
  key: string,
  fetchFn: () => Promise<T>
): Promise<T> {
  const cached = cache.get(key);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`[Cache] HIT: ${key}`);
    return Promise.resolve(cached.data as T);
  }

  console.log(`[Cache] MISS: ${key}`);
  return fetchFn().then((data) => {
    cache.set(key, { data, timestamp: Date.now() });
    return data;
  });
}

// Application endpoints
export const applicationAPI = {
  /**
   * Create a new job application
   */
  create: async (data: Omit<JobApplication, 'id' | 'created_at' | 'updated_at'>) => {
    const response = await apiClient.post<JobApplication>('/api/applications', data);
    // Invalidate cache
    cache.delete('applications-list');
    return response.data;
  },

  /**
   * Get all applications with optional filters
   */
  getAll: async (params?: {
    skip?: number;
    limit?: number;
    company?: string;
    stage?: string;
    status?: string;
  }) => {
    const cacheKey = `applications-list-${JSON.stringify(params || {})}`;
    return getCachedOrFetch(cacheKey, async () => {
      const response = await apiClient.get<JobApplication[]>('/api/applications', {
        params,
      });
      return response.data;
    });
  },

  /**
   * Get a specific application by ID
   */
  getById: async (id: number) => {
    const cacheKey = `application-${id}`;
    return getCachedOrFetch(cacheKey, async () => {
      const response = await apiClient.get<JobApplication>(`/api/applications/${id}`);
      return response.data;
    });
  },

  /**
   * Update an application
   */
  update: async (id: number, data: Partial<JobApplication>) => {
    const response = await apiClient.put<JobApplication>(
      `/api/applications/${id}`,
      data
    );
    // Invalidate cache
    cache.delete(`application-${id}`);
    cache.delete('applications-list');
    return response.data;
  },

  /**
   * Delete an application
   */
  delete: async (id: number) => {
    await apiClient.delete(`/api/applications/${id}`);
    // Invalidate cache
    cache.delete(`application-${id}`);
    cache.delete('applications-list');
  },
};

// Analytics endpoints
export const analyticsAPI = {
  /**
   * Get analytics overview
   */
  getOverview: async () => {
    const cacheKey = 'analytics-overview';
    return getCachedOrFetch(cacheKey, async () => {
      const response = await apiClient.get<AnalyticsOverview>('/api/analytics/overview');
      return response.data;
    });
  },

  /**
   * Get rejection analysis
   */
  getRejectionAnalysis: async (params?: {
    company?: string;
    days?: number;
  }) => {
    const cacheKey = `rejection-analysis-${JSON.stringify(params || {})}`;
    return getCachedOrFetch(cacheKey, async () => {
      const response = await apiClient.get<RejectionAnalysis>(
        '/api/analytics/rejections',
        { params }
      );
      return response.data;
    });
  },

  /**
   * Get time series data
   */
  getTimeSeries: async (days?: number) => {
    const cacheKey = `time-series-${days || 90}`;
    return getCachedOrFetch(cacheKey, async () => {
      const response = await apiClient.get<TimeSeriesData>('/api/analytics/time-series', {
        params: { days },
      });
      return response.data;
    });
  },

  /**
   * Get ML prediction
   */
  predict: async (params: {
    company: string;
    source: string;
    day_of_week: number;
  }) => {
    const response = await apiClient.post<PredictionResponse>(
      '/api/analytics/predict',
      null,
      { params }
    );
    return response.data;
  },
};

// Health check
export const healthCheck = async () => {
  try {
    const response = await apiClient.get('/health');
    return response.status === 200;
  } catch {
    return false;
  }
};

export default apiClient;
