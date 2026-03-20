import axios from 'axios'

// Automatically detect the correct API URL based on current host
const getApiBaseUrl = () => {
  // If VITE_API_URL is explicitly set, use it
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  
  // Otherwise, use the same host as the frontend
  const hostname = window.location.hostname
  const protocol = window.location.protocol
  
  // Use same host but port 3000 for API
  return `${protocol}//${hostname}:3000`
}

const API_BASE_URL = getApiBaseUrl()

const axiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 5000,
  headers: { 'Content-Type': 'application/json' },
})

export const getBookCoverUrl = (isbn: string) => `${API_BASE_URL}/getBookCover?isbn=${isbn}`

export default axiosInstance
