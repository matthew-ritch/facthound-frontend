const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

const isServer = typeof window === 'undefined';

const getStorage = () => {
  if (isServer) return { getItem: () => null, setItem: () => null, clear: () => null };
  return localStorage;
};

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

const decodeToken = (token: string): { exp: number } | null => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
};

const isTokenExpired = (token: string): boolean => {
  const decoded = decodeToken(token);
  if (!decoded) return true;
  // Check if token will expire in the next 300 seconds
  return decoded.exp * 1000 < Date.now() + 300000;
};

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

const api = {
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