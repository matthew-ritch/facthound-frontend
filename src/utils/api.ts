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
    const response = await fetch(`${baseURL}/api/token/refresh/`, {
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

const getHeaders = () => {
  const headers = new Headers({
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  });

  if (!isServer) {
    const token = getStorage().getItem('token');
    if (token) {
      headers.append('Authorization', `Bearer ${token}`);
    }
  }

  return headers;
};

const api = {
  get: async (url: string, data?: any) => {
    try {
      const response = await fetch(`${baseURL}${url}`, {
        method: 'GET',
        headers: getHeaders(),
        credentials: 'include',
        body: data ? JSON.stringify(data) : undefined,
      });

      if (response.status === 401) {
        const refreshed = await refreshToken();
        if (refreshed) {
          // Retry the request with new token
          const retryResponse = await fetch(`${baseURL}${url}`, {
            method: 'GET',
            headers: getHeaders(),
            credentials: 'include',
            body: data ? JSON.stringify(data) : undefined,
          });
          return retryResponse.json();
        } else {
          getStorage().clear();
          window.location.href = '/login';
          throw new Error('Session expired');
        }
      }

      return response.json();
    } catch (error) {
      throw error;
    }
  },

  post: async (url: string, data: any) => {
    try {
      const response = await fetch(`${baseURL}${url}`, {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (response.status === 401) {
        const refreshed = await refreshToken();
        if (refreshed) {
          // Retry the request with new token
          const retryResponse = await fetch(`${baseURL}${url}`, {
            method: 'POST',
            headers: getHeaders(),
            credentials: 'include',
            body: JSON.stringify(data),
          });
          return retryResponse.json();
        } else {
          getStorage().clear();
          window.location.href = '/login';
          throw new Error('Session expired');
        }
      }

      return response.json();
    } catch (error) {
      throw error;
    }
  },

  // Add other methods (put, delete, etc.) as needed
};

export default api;