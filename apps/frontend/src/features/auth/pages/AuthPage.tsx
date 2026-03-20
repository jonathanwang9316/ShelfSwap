import { FC, useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import axios from '@/api/axios'

const AuthPage: FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { login } = useAuth()
  const isLogin = location.pathname === '/login'

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!username) {
      setError('Please enter a username')
      return
    }

    setIsLoading(true)

    try {
      const response = await axios.get(`/auth/login`, {
        params: { username }
      })

      if (response.data.success) {
        login(response.data.user)
        navigate('/')
      } else {
        setError(response.data.message || 'Login failed')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Username not found. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // The HTML code was developed using AI assistance
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '80vh',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '400px',
        width: '100%',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        backgroundColor: 'white'
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>
          {isLogin ? 'Login to ShelfSwap' : 'Sign Up for ShelfSwap'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="username" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid #ddd',
                fontSize: '14px'
              }}
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="password" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="******************"
              disabled
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid #ddd',
                fontSize: '14px',
                backgroundColor: '#f5f5f5',
                cursor: 'not-allowed'
              }}
            />
            <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              Password not required (temporary)
            </p>
          </div>
          {error && (
            <div style={{
              padding: '10px',
              marginBottom: '20px',
              backgroundColor: '#fee',
              color: '#c33',
              borderRadius: '4px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: isLoading ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? 'Loading...' : isLogin ? 'Sign In' : 'Sign Up'}
          </button>
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <p style={{ fontSize: '14px', color: '#666' }}>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <Link 
                to={isLogin ? '/signup' : '/login'}
                style={{ color: '#007bff', textDecoration: 'none' }}
              >
                {isLogin ? 'Sign Up' : 'Login'}
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AuthPage
