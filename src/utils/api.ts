const baseURL = process.env.PUBLIC_DJANGO_API_URL || 'http://localhost:8000';

const refreshToken = async (): Promise<boolean> => {
  const refresh = localStorage.getItem('refresh');
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
      localStorage.setItem('token', data.access);
      localStorage.setItem('refresh', data.refresh);
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

  const token = localStorage.getItem('token');
  if (token) {
    headers.append('Authorization', `Bearer ${token}`);
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
          localStorage.clear();
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
          localStorage.clear();
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