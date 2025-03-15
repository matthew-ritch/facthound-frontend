/**
 * Base URL for all API requests, defaults to localhost in development
 */
const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

/**
 * Determines if code is running on server or client
 */
const isServer = typeof window === 'undefined';

/**
 * Returns appropriate storage object based on environment
 * Prevents server-side errors when accessing localStorage
 * @returns Storage interface (localStorage or dummy implementation)
 */
const getStorage = () => {
  if (isServer) return { getItem: () => null, setItem: () => null, clear: () => null };
  return localStorage;
};

/**
 * Attempts to refresh the authentication token
 * @returns Promise<boolean> - true if refresh succeeded, false otherwise
 */
const refreshToken = async (): Promise<boolean> => {
  const storage = getStorage();
  const refresh = storage.getItem('refresh');
  if (!refresh) return false;

  try {
    const response = await fetch(`${baseURL}/api/auth/token/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh }),
    });
    
    if (response.ok) {
      const data = await response.json();
      storage.setItem('token', data.access);
      storage.setItem('refresh', data.refresh);
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
};

/**
 * Decodes a JWT token to extract its payload
 * @param token - JWT token to decode
 * @returns Decoded token payload or null if invalid
 */
const decodeToken = (token: string): { exp: number } | null => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
};

/**
 * Checks if a token is expired or about to expire
 * @param token - JWT token to check
 * @returns boolean - true if token is expired or will expire soon
 */
const isTokenExpired = (token: string): boolean => {
  const decoded = decodeToken(token);
  if (!decoded) return true;
  // Check if token will expire in the next 300 seconds
  return decoded.exp * 1000 < Date.now() + 300000;
};

/**
 * Generates request headers with authentication token if available
 * Handles token refresh if current token is expired
 * @returns Promise<Headers> - Headers object with appropriate authentication
 */
const getHeaders = async () => {
  const headers = new Headers({
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  });

  if (!isServer) {
    const storage = getStorage();
    let token = storage.getItem('token');
    
    if (token && isTokenExpired(token)) {
      const refreshed = await refreshToken();
      if (!refreshed) {
        storage.clear();
        window.location.href = '/login';
        throw new Error('Session expired');
      }
      token = storage.getItem('token');
    }

    if (token) {
      headers.append('Authorization', `Bearer ${token}`);
    }
  }

  return headers;
};

/**
 * API utility for making authenticated requests to the backend
 * Handles authentication, token refresh, and request formatting
 */
const api = {
  /**
   * Makes an authenticated GET request
   * @param url - API endpoint path
   * @param data - Optional data to send in request body
   * @returns Promise with JSON response
   */
  get: async (url: string, data?: any) => {
    try {
      const headers = await getHeaders();
      const response = await fetch(`${baseURL}${url}`, {
        method: 'GET',
        headers,
        credentials: 'include',
        body: data ? JSON.stringify(data) : undefined,
      });
      
      return response.json();
    } catch (error) {
      throw error;
    }
  },

  /**
   * Makes an authenticated POST request
   * @param url - API endpoint path
   * @param data - Data to send in request body
   * @returns Promise with JSON response
   */
  post: async (url: string, data: any) => {
    try {
      const headers = await getHeaders();
      const response = await fetch(`${baseURL}${url}`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      return response.json();
    } catch (error) {
      throw error;
    }
  },

  // Add other methods (put, delete, etc.) as needed
};

export default api;