import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import auth from '@react-native-firebase/auth';

// Base API URL - update this to match your backend
// const API_BASE_URL =
//   'https://realyai-backend-649493914329.europe-west1.run.app/api'; // Change this to your actual backend URL

const API_BASE_URL = 'https://api-agent.realyai.io/api';

// Types for API responses
export interface User {
  id: string;
  username: string;
  companyName: string;
  companyAddress?: {
    street?: string;
    area?: string;
    city: string;
    state: string;
    country: string;
    pincode?: string;
  };
  phoneNumber: string;
  email: string;
  telegramBotActive?: boolean;
  whatsappBotActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Property {
  id: string;
  userId: string;
  locationId: string;
  images: string[];
  videos?: any[];
  description: string;
  pricePerSqft: number;
  totalPrice?: number;
  contactInfo: string;
  propertyType?: string;
  area?: number;
  bedrooms?: number;
  bathrooms?: number;
  features?: any[];
  status: 'AVAILABLE' | 'RESERVED' | 'SOLD' | 'UNDER_MAINTENANCE';
  mainImageIndex?: number;
  amenities?: any[];
  floorPlan?: string;
  virtualTour?: string;
  isActive: boolean;
  isFeatured: boolean;
  viewCount: number;
  lastViewed?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    username: string;
    companyName: string;
  };
  location?: Location;
}

export interface Lead {
  id: string;
  telegramUserId: string;
  name?: string;
  phoneNumber?: string;
  budget?: number;
  expectations?: string;
  status: 'NOT_QUALIFIED' | 'MEDIUM' | 'HIGH';
  language: string;
  createdAt: string;
  updatedAt: string;
  followUpStatus?: string;
  lastInteraction?: string;
  chatHistory?: ChatMessage[];
  followUps?: FollowUp[];
}

export interface ChatMessage {
  id: string;
  telegramUserId: string;
  leadId?: string;
  message: string;
  response?: string;
  messageType: string;
  language: string;
  timestamp: string;
}

export interface FollowUp {
  id: string;
  leadId: string;
  activity: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  today: {
    date: string;
    totalLeads: number;
    newLeads: number;
    chatMessages: number;
    leadsByStatus: Record<string, number>;
  };
  thisWeek: {
    leads: number;
    newLeads: number;
    chatMessages: number;
    properties: number;
    conversion: number;
  };
  thisMonth: {
    leads: number;
    newLeads: number;
    chatMessages: number;
    properties: number;
    conversion: number;
  };
  overall: {
    totalLeads: number;
    totalProperties: number;
    totalUsers: number;
    totalMessages: number;
    conversionRate: number;
    leadsByStatus: Record<string, number>;
  };
  recentActivity: {
    leads: Lead[];
    chats: ChatMessage[];
  };
}

export interface Location {
  id: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    properties: number;
  };
}

export interface VideoReel {
  id: string;
  userId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  prompt: string;
  image1: string;
  image2: string;
  image3?: string;
  videoUrl?: string; // New field for video URL
  videoData?: string;
  videoFormat?: string;
  videoDuration?: number;
  videoSize?: number;
  modelUsed?: string;
  aspectRatio?: string;
  estimatedCost?: number;
  generationTime?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    username: string;
    companyName: string;
  };
  location?: Location;
}

class ApiService {
  private token: string | null = null;

  async setToken(token: string) {
    this.token = token;
    await AsyncStorage.setItem('auth_token', token);
    console.log('Token set in AsyncStorage:', token.substring(0, 20) + '...');
  }

  async getToken(): Promise<string | null> {
    if (!this.token) {
      this.token = await AsyncStorage.getItem('auth_token');
      console.log(
        'Token retrieved from AsyncStorage:',
        this.token ? this.token.substring(0, 20) + '...' : 'null',
      );
    }
    return this.token;
  }

  async clearToken() {
    this.token = null;
    await AsyncStorage.removeItem('auth_token');
  }

  private async refreshTokenIfNeeded(): Promise<void> {
    try {
      const currentUser = auth().currentUser;
      if (currentUser) {
        // Force refresh token to ensure it's valid
        const freshToken = await currentUser.getIdToken(true);
        await this.setToken(freshToken);
        console.log('Token refreshed successfully, new token set');
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw error;
    }
  }

  private async request(endpoint: string, options: any = {}): Promise<any> {
    const url = `${API_BASE_URL}${endpoint}`;
    let token = await this.getToken();
    console.log(`Making request to ${endpoint}, token available:`, !!token);
    console.log(
      `Token value:`,
      token ? token.substring(0, 50) + '...' : 'null',
    );

    // Ensure we have a valid token for authenticated requests
    if (!token && !endpoint.includes('/auth/')) {
      console.warn('No auth token available for authenticated request');
      throw {
        status: 401,
        message: 'Authentication required',
      };
    }

    const headers: any = {
      'Content-Type': 'application/json',
      'X-Firebase-Locale': 'en',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    console.log(`Request headers:`, {
      'Content-Type': headers['Content-Type'],
      'X-Firebase-Locale': headers['X-Firebase-Locale'],
      Authorization: headers.Authorization
        ? 'Bearer [TOKEN_PRESENT]'
        : 'No Auth Header',
    });

    try {
      console.log(`API Request: ${options.method || 'GET'} ${endpoint}`);
      const response = await axios({
        url,
        method: options.method || 'GET',
        headers,
        data: options.body,
        params: options.params,
        timeout: 30000, // 30 second timeout
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const status = error.response.status;
        const message =
          error.response.data?.message ||
          error.response.data?.error ||
          error.message;

        console.error(`API Error ${status}: ${message}`);

        // If 401, try refreshing token once and retry the request
        if (status === 401 && !endpoint.includes('/auth/')) {
          console.log('Authentication failed, attempting token refresh...');
          try {
            await this.refreshTokenIfNeeded();
            const newToken = await this.getToken();

            if (newToken && newToken !== token) {
              console.log('Retrying request with refreshed token');
              const newHeaders = {
                ...headers,
                Authorization: `Bearer ${newToken}`,
              };

              const retryResponse = await axios({
                url,
                method: options.method || 'GET',
                headers: newHeaders,
                data: options.body,
                params: options.params,
                timeout: 30000,
              });
              return retryResponse.data;
            }
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
          }

          // If refresh failed or no new token, clear token and throw error
          await this.clearToken();
          throw {
            status: 401,
            message: 'Authentication failed. Please log in again.',
          };
        }

        throw {
          status,
          message,
        };
      }

      // Network or other errors
      console.error('Network error:', error);
      throw {
        status: 0,
        message: 'Network error - please check your connection',
      };
    }
  }

  // Auth endpoints
  async signIn(email: string, password: string) {
    const response = await this.request('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (response.token) {
      await this.setToken(response.token);
    }
    return response;
  }

  async signUp(userData: {
    username: string;
    companyName: string;
    phoneNumber: string;
    email: string;
    password: string;
  }) {
    const response = await this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    if (response.token) {
      await this.setToken(response.token);
    }
    return response;
  }

  async getProfile(): Promise<{ user: User }> {
    return this.request('/auth/profile');
  }

  async createProfile(profileData: {
    firebaseUid: string;
    email: string | null;
    username: string;
    companyName: string;
    phoneNumber: string;
  }) {
    return this.request('/auth/create-profile', {
      method: 'POST',
      body: JSON.stringify(profileData),
    });
  }

  async updateProfile(updates: Partial<User>) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async checkUserExists(firebaseUid: string): Promise<{ exists: boolean }> {
    return this.request(`/auth/check-user/${firebaseUid}`);
  }

  // Properties endpoints
  async getProperties(params?: {
    search?: string;
    propertyType?: string;
    minPrice?: number;
    maxPrice?: number;
    minArea?: number;
    maxArea?: number;
    bedrooms?: number;
    bathrooms?: number;
    location?: string;
    page?: number;
    limit?: number;
  }): Promise<{ properties: Property[]; pagination: any }> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    return this.request('/properties', { params });
  }

  async getPropertyById(id: string): Promise<{ property: Property }> {
    return this.request(`/properties/${id}`);
  }

  async createProperty(
    propertyData: Partial<Property>,
  ): Promise<{ property: Property }> {
    return this.request('/properties', {
      method: 'POST',
      body: JSON.stringify(propertyData),
    });
  }

  async updateProperty(
    id: string,
    updates: Partial<Property>,
  ): Promise<{ property: Property }> {
    return this.request(`/properties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteProperty(id: string) {
    return this.request(`/properties/${id}`, {
      method: 'DELETE',
    });
  }

  async getUserProperties(params?: {
    page?: number;
    limit?: number;
  }): Promise<{ properties: Property[]; pagination: any }> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    return this.request('/properties/user', { params });
  }

  // Leads endpoints
  async getLeads(params?: {
    status?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ leads: Lead[]; pagination: any }> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    return this.request('/leads', { params });
  }

  async getLeadById(id: string): Promise<{ lead: Lead }> {
    return this.request(`/leads/${id}`);
  }

  async createLead(leadData: Partial<Lead>) {
    return this.request('/leads', {
      method: 'POST',
      body: JSON.stringify(leadData),
    });
  }

  async updateLead(id: string, updates: Partial<Lead>) {
    return this.request(`/leads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async updateLeadStatus(id: string, status: string) {
    return this.request(`/leads/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async deleteLead(id: string) {
    return this.request(`/leads/${id}`, {
      method: 'DELETE',
    });
  }

  // Chat endpoints
  async getChatHistory(
    telegramUserId: string,
    params?: { page?: number; limit?: number },
  ): Promise<{
    telegramUserId: string;
    lead?: Lead;
    chatHistory: ChatMessage[];
    pagination: any;
  }> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    return this.request(`/chat/history/${telegramUserId}`, { params });
  }

  async saveChatMessage(messageData: {
    telegramUserId: string;
    message: string;
    response?: string;
    messageType?: string;
    language?: string;
  }) {
    return this.request('/chat', {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  }

  // Stats endpoints
  async getDashboardStats(): Promise<DashboardStats> {
    return this.request('/stats/dashboard');
  }

  async getDailyStats(params?: {
    startDate?: string;
    endDate?: string;
    leadStatus?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    return this.request('/stats/daily', { params });
  }

  async getWeeklyStats(params?: {
    startDate?: string;
    endDate?: string;
    leadStatus?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    return this.request('/stats/weekly', { params });
  }

  async getMonthlyStats(params?: {
    startDate?: string;
    endDate?: string;
    leadStatus?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    return this.request('/stats/monthly', { params });
  }

  // Location endpoints
  async getLocations(params?: {
    search?: string;
    city?: string;
    state?: string;
    country?: string;
    page?: number;
    limit?: number;
  }): Promise<{ locations: Location[]; pagination: any }> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    return this.request('/locations', { params });
  }

  async getLocationById(id: string): Promise<{ location: Location }> {
    return this.request(`/locations/${id}`);
  }

  async createLocation(locationData: {
    address: string;
    city: string;
    state: string;
    country: string;
    postalCode?: string;
    latitude?: number;
    longitude?: number;
  }): Promise<{ location: Location }> {
    return this.request('/locations', {
      method: 'POST',
      body: JSON.stringify(locationData),
    });
  }

  async updateLocation(
    id: string,
    updates: Partial<{
      address: string;
      city: string;
      state: string;
      country: string;
      postalCode?: string;
      latitude?: number;
      longitude?: number;
    }>,
  ): Promise<{ location: Location }> {
    return this.request(`/locations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteLocation(id: string) {
    return this.request(`/locations/${id}`, {
      method: 'DELETE',
    });
  }

  // Video Reel endpoints
  async getUserVideoReels(params?: {
    page?: number;
    limit?: number;
  }): Promise<{ videoReels: VideoReel[]; pagination: any }> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    return this.request('/video-reels', { params });
  }

  async getVideoReelById(id: string): Promise<{ videoReel: VideoReel }> {
    return this.request(`/video-reels/${id}`);
  }

  async createVideoReel(videoReelData: {
    user_id: string;
    prompt: string;
    aspect_ratio: string;
    images: string[];
  }): Promise<any> {
    // Send directly to Python server instead of our backend
    const PYTHON_SERVER_URL =
      'https://realyai-video-generation-649104059255.europe-west1.run.app/generate-video';

    const response = await fetch(PYTHON_SERVER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(videoReelData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Python server error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  async getVideoReelStatus(id: string): Promise<{ videoReel: VideoReel }> {
    return this.request(`/video-reels/${id}/status`);
  }

  async deleteVideoReel(id: string) {
    return this.request(`/video-reels/${id}`, {
      method: 'DELETE',
    });
  }

  // Schedule endpoints
  async getAllSchedules(params?: {
    status?: string;
    startDate?: string;
    endDate?: string;
    leadId?: string;
    emailLeadId?: string;
    propertyId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ schedules: any[]; pagination: any }> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    return this.request('/schedules', { params });
  }

  async getScheduleById(id: string): Promise<{ schedule: any }> {
    return this.request(`/schedules/${id}`);
  }

  async createSchedule(scheduleData: {
    leadId?: string;
    emailLeadId?: string;
    propertyId?: string;
    scheduledAt: string;
    status?: string;
    notes?: string;
  }): Promise<{ schedule: any }> {
    return this.request('/schedules', {
      method: 'POST',
      body: JSON.stringify(scheduleData),
    });
  }

  async updateSchedule(
    id: string,
    updates: Partial<{
      leadId?: string;
      emailLeadId?: string;
      propertyId?: string;
      scheduledAt?: string;
      status?: string;
      notes?: string;
    }>,
  ): Promise<{ schedule: any }> {
    return this.request(`/schedules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteSchedule(id: string) {
    return this.request(`/schedules/${id}`, {
      method: 'DELETE',
    });
  }

  // Subscription endpoints
  async getUserSubscription(): Promise<{ subscription: any }> {
    return this.request('/subscription/user');
  }

  async getSubscriptionUsage(): Promise<{ subscription: any; usage: any }> {
    return this.request('/subscription/usage');
  }
  // Pincode API endpoint (external) - Using free postalpincode.in API
  async getPincodeDetails(pincode: string): Promise<any> {
    try {
      console.log('Making pincode API request for:', pincode);
      const url = `https://api.postalpincode.in/pincode/${pincode}`;
      console.log('API URL:', url);

      const response = await fetch(url, {
        method: 'GET',
      });

      console.log('API Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error response:', errorText);
        throw new Error(
          `API request failed: ${response.status} ${response.statusText} - ${errorText}`,
        );
      }

      const data = await response.json();
      console.log('API Response data:', data);

      // Transform postalpincode.in response to match expected format
      if (
        Array.isArray(data) &&
        data.length > 0 &&
        data[0].Status === 'Success'
      ) {
        const postOffices = data[0].PostOffice;
        if (postOffices && postOffices.length > 0) {
          // Return in the format expected by LocationPicker
          return {
            status: 'success',
            data: postOffices.map((office: any) => ({
              pincode: office.Pincode,
              area: office.Name,
              city: office.District,
              state: office.State,
              country: office.Country,
              latitude: null, // This API doesn't provide coordinates
              longitude: null,
            })),
          };
        }
      }

      return {
        status: 'error',
        message: 'No data found for this pincode',
      };
    } catch (error) {
      console.error('Pincode API error:', error);
      throw error;
    }
  }
}

export const apiService = new ApiService();
