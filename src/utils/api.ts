const baseURL = process.env.PUBLIC_DJANGO_API_URL || 'http://localhost:8000';

const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch (e) {
    return true;
  }
};

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

const executeRequest = async (requestFn: () => Promise<Response>) => {
  const token = localStorage.getItem('token');
  
  if (token && isTokenExpired(token)) {
    const refreshed = await refreshToken();
    if (!refreshed) {
      // Handle failed refresh (e.g., logout)
      localStorage.clear();
      window.location.href = '/login';
      throw new Error('Session expired');
    }
  }

  const response = await requestFn();
  if (response.status === 401) {
    const refreshed = await refreshToken();
    if (refreshed) {
      return await requestFn();
    } else {
      localStorage.clear();
      window.location.href = '/login';
      throw new Error('Session expired');
    }
  }
  return response.json();
};

const api = {
  get: async (url: string, data?: any) => {
    return executeRequest(() => fetch(`${baseURL}${url}`, {
      method: 'GET',
      headers: getHeaders(),
      credentials: 'include',
      body: data ? JSON.stringify(data) : undefined,
    }));
  },

  post: async (url: string, data: any) => {
    return executeRequest(() => fetch(`${baseURL}${url}`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(data),
    }));
  },

  // Add other methods (put, delete, etc.) as needed
};

export default api;