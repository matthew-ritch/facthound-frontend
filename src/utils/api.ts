const baseURL = process.env.PUBLIC_DJANGO_API_URL || 'http://localhost:8000';

const getHeaders = () => {
  const headers = new Headers({
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  });

  const token = localStorage.getItem('token');
  if (token) {
    headers.append('Authorization', `Bearer ${token}`);
    console.log(headers)
  }

  return headers;
};

const api = {
  get: async (url: string, data?: any) => {
    const response = await fetch(`${baseURL}${url}`, {
      method: 'GET',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  post: async (url: string, data: any) => {
    const response = await fetch(`${baseURL}${url}`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  // Add other methods (put, delete, etc.) as needed
};

export default api;