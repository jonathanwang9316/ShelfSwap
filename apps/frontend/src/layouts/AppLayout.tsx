import { FC, useState, FormEvent } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'

const AppLayout: FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleSearch = (e: FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  // The HTML code was developed using AI assistance
  return (
    <div id="app-layout">
      <header>
        <nav>
          <div className="nav-content">
            <div className="logo">
              <Link to="/">ShelfSwap</Link>
            </div>
            
            <form onSubmit={handleSearch} className="search-form">
              <input
                type="text"
                placeholder="Search books, authors, genres..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <button type="submit" className="search-button" aria-label="Search">
                🔍
              </button>
            </form>

            <div className="nav-links">
              <Link to="/">Home</Link>
              <Link to="/library">My Library</Link>
              <Link to="/swaps">Swaps</Link>
              <Link to="/clubs">Clubs</Link>
              {user && (
                <>
                  <Link to="/profile" style={{ fontWeight: '500' }}>
                    {user.username}
                  </Link>
                  <button 
                    onClick={handleLogout}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}

export default AppLayout
