import axios from 'axios';
import { getSubdomain } from '../utils/tenant';

// Cliente axios con baseURL /api. nginx (en producción) o Vite (en desarrollo)
// redirigen /api hacia el backend preservando el host.
const client = axios.create({ baseURL: '/api' });

// Agrega el token de sesión y el encabezado de tenant a cada petición.
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Si se detecta un subdominio específico en el cliente, se envía como header de soporte
  const subdominio = getSubdomain();
  if (subdominio) {
    config.headers['X-Tenant-Slug'] = subdominio;
  }

  return config;
});

// Si el backend responde 401, se cierra la sesión y se vuelve al login.
client.interceptors.response.use(
  (respuesta) => respuesta,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default client;
