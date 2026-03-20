import type { FC } from 'react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import api from '@/api/axios'

type Club = {
  clubID: number
  name: string
  dateCreated: string
  memberCount: number
  theme: string
  privacy: string
  ownerID: number
  ownerName?: string
  dateJoined?: string
}

const ClubListPage: FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [allClubs, setAllClubs] = useState<Club[]>([])
  const [myClubs, setMyClubs] = useState<Club[]>([])
  const [localClubs, setLocalClubs] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'my' | 'local'>('all')
  const [error, setError] = useState('')
  const [joiningClubs, setJoiningClubs] = useState<Set<number>>(new Set())
  
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [clubName, setClubName] = useState('')
  const [clubTheme, setClubTheme] = useState('Fiction')
  const [clubPrivacy, setClubPrivacy] = useState<'Public' | 'Private'>('Public')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  useEffect(() => {
    const fetchClubs = async () => {
      if (!user) return

      try {
        setLoading(true)
        setError('')

        const [allResponse, myResponse, localResponse] = await Promise.all([
          api.get<Club[]>('/clubs'),
          api.get<Club[]>('/clubs/my', { params: { userId: user.userID } }),
          api.get<Club[]>('/clubs/local', { params: { userId: user.userID } })
        ])

        setAllClubs(allResponse.data)
        setMyClubs(myResponse.data)
        setLocalClubs(localResponse.data)
      } catch (err: any) {
        console.error('Error fetching clubs:', err)
        setError('Failed to load clubs')
      } finally {
        setLoading(false)
      }
    }

    fetchClubs()
  }, [user])

  const handleJoinClub = async (clubId: number) => {
    if (!user || joiningClubs.has(clubId)) return

    try {
      setJoiningClubs(prev => new Set(prev).add(clubId))
      const response = await api.post(`/clubs/${clubId}/join`, {
        userId: user.userID
      })

      if (response.data.success) {
        const [allResponse, myResponse, localResponse] = await Promise.all([
          api.get<Club[]>('/clubs'),
          api.get<Club[]>('/clubs/my', { params: { userId: user.userID } }),
          api.get<Club[]>('/clubs/local', { params: { userId: user.userID } })
        ])
        setAllClubs(allResponse.data)
        setMyClubs(myResponse.data)
        setLocalClubs(localResponse.data)
      }
    } catch (err: any) {
      console.error('Error joining club:', err)
      alert(err.response?.data?.message || 'Failed to join club')
    } finally {
      setJoiningClubs(prev => {
        const next = new Set(prev)
        next.delete(clubId)
        return next
      })
    }
  }

  const handleLeaveClub = async (clubId: number) => {
    if (!user) return

    if (!window.confirm('Are you sure you want to leave this club?')) {
      return
    }

    try {
      const response = await api.delete(`/clubs/${clubId}/leave`, {
        params: { userId: user.userID }
      })

      if (response.data.success) {
        // Refresh clubs
        const [allResponse, myResponse, localResponse] = await Promise.all([
          api.get<Club[]>('/clubs'),
          api.get<Club[]>('/clubs/my', { params: { userId: user.userID } }),
          api.get<Club[]>('/clubs/local', { params: { userId: user.userID } })
        ])
        setAllClubs(allResponse.data)
        setMyClubs(myResponse.data)
        setLocalClubs(localResponse.data)
      }
    } catch (err: any) {
      console.error('Error leaving club:', err)
      alert(err.response?.data?.message || 'Failed to leave club')
    }
  }

  const handleCreateClub = async () => {
    if (!user) return

    if (!clubName.trim()) {
      setCreateError('Club name is required')
      return
    }

    try {
      setCreating(true)
      setCreateError('')

      const response = await api.post('/clubs', {
        ownerId: user.userID,
        name: clubName.trim(),
        theme: clubTheme,
        privacy: clubPrivacy
      })

      if (response.data.success) {
        // Close modal and reset form
        setShowCreateModal(false)
        setClubName('')
        setClubTheme('Fiction')
        setClubPrivacy('Public')
        
        const [allResponse, myResponse, localResponse] = await Promise.all([
          api.get<Club[]>('/clubs'),
          api.get<Club[]>('/clubs/my', { params: { userId: user.userID } }),
          api.get<Club[]>('/clubs/local', { params: { userId: user.userID } })
        ])
        setAllClubs(allResponse.data)
        setMyClubs(myResponse.data)
        setLocalClubs(localResponse.data)
        
        navigate(`/clubs/${response.data.clubId}`)
      }
    } catch (err: any) {
      console.error('Error creating club:', err)
      setCreateError(err.response?.data?.message || 'Failed to create club')
    } finally {
      setCreating(false)
    }
  }

  const isMember = (clubId: number) => {
    return myClubs.some(c => c.clubID === clubId)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const getThemeColor = (theme: string) => {
    const colors: Record<string, string> = {
      'Fiction': '#667eea',
      'Non-Fiction': '#f093fb',
      'Mystery': '#4facfe',
      'Science Fiction': '#43e97b',
      'Romance': '#fa709a',
      'Fantasy': '#fee140',
      'Biography': '#30cfd0',
      'History': '#a8edea',
      'Other': '#d299c2'
    }
    return colors[theme] || colors['Other']
  }

  const clubsToShow = activeTab === 'all' ? allClubs : activeTab === 'my' ? myClubs : localClubs

  // The HTML code was developed using AI assistance
  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h1 style={{ marginBottom: '20px' }}>Book Clubs</h1>
        <p>Loading clubs...</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Create Club Modal */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0, marginBottom: '24px', fontSize: '24px', fontWeight: 700 }}>
              Create New Club
            </h2>

            <div style={{ display: 'grid', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>
                  Club Name *
                </label>
                <input
                  type="text"
                  value={clubName}
                  onChange={(e) => setClubName(e.target.value)}
                  placeholder="Enter club name"
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #ddd',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>
                  Theme
                </label>
                <select
                  value={clubTheme}
                  onChange={(e) => setClubTheme(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #ddd',
                    fontSize: '14px',
                    cursor: 'pointer',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="Fiction">Fiction</option>
                  <option value="Non-Fiction">Non-Fiction</option>
                  <option value="Mystery">Mystery</option>
                  <option value="Science Fiction">Science Fiction</option>
                  <option value="Romance">Romance</option>
                  <option value="Fantasy">Fantasy</option>
                  <option value="Biography">Biography</option>
                  <option value="History">History</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>
                  Privacy
                </label>
                <select
                  value={clubPrivacy}
                  onChange={(e) => setClubPrivacy(e.target.value as 'Public' | 'Private')}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #ddd',
                    fontSize: '14px',
                    cursor: 'pointer',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="Public">Public</option>
                  <option value="Private">Private</option>
                </select>
              </div>
            </div>

            {createError && (
              <p style={{ color: '#dc3545', marginTop: '16px', marginBottom: 0, fontSize: '14px' }}>
                {createError}
              </p>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false)
                  setCreateError('')
                  setClubName('')
                }}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: '1px solid #ccc',
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateClub}
                disabled={creating || !clubName.trim()}
                style={{
                  padding: '10px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: creating || !clubName.trim() ? '#ccc' : '#007bff',
                  color: '#fff',
                  cursor: creating || !clubName.trim() ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                  opacity: creating ? 0.7 : 1
                }}
              >
                {creating ? 'Creating...' : 'Create Club'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ marginBottom: '8px', fontSize: '32px', fontWeight: 700 }}>
            Book Clubs
          </h1>
          <p style={{ color: '#666', fontSize: '16px' }}>
            Join communities of readers and share your love of books
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            padding: '12px 24px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: '#007bff',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#0056b3'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#007bff'
          }}
        >
          + Create Club
        </button>
      </div>

      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '24px',
        borderBottom: '2px solid #e5e7eb'
      }}>
        <button
          onClick={() => setActiveTab('all')}
          style={{
            padding: '12px 24px',
            border: 'none',
            backgroundColor: 'transparent',
            borderBottom: activeTab === 'all' ? '3px solid #007bff' : '3px solid transparent',
            color: activeTab === 'all' ? '#007bff' : '#666',
            fontWeight: activeTab === 'all' ? 600 : 400,
            cursor: 'pointer',
            fontSize: '16px',
            transition: 'all 0.2s'
          }}
        >
          All Clubs ({allClubs.length})
        </button>
        <button
          onClick={() => setActiveTab('my')}
          style={{
            padding: '12px 24px',
            border: 'none',
            backgroundColor: 'transparent',
            borderBottom: activeTab === 'my' ? '3px solid #007bff' : '3px solid transparent',
            color: activeTab === 'my' ? '#007bff' : '#666',
            fontWeight: activeTab === 'my' ? 600 : 400,
            cursor: 'pointer',
            fontSize: '16px',
            transition: 'all 0.2s'
          }}
        >
          My Clubs ({myClubs.length})
        </button>
        <button
          onClick={() => setActiveTab('local')}
          style={{
            padding: '12px 24px',
            border: 'none',
            backgroundColor: 'transparent',
            borderBottom: activeTab === 'local' ? '3px solid #007bff' : '3px solid transparent',
            color: activeTab === 'local' ? '#007bff' : '#666',
            fontWeight: activeTab === 'local' ? 600 : 400,
            cursor: 'pointer',
            fontSize: '16px',
            transition: 'all 0.2s'
          }}
        >
          Local Clubs ({localClubs.length})
        </button>
      </div>

      {error && (
        <div style={{
          padding: '16px',
          backgroundColor: '#fee',
          color: '#c33',
          borderRadius: '8px',
          marginBottom: '24px'
        }}>
          {error}
        </div>
      )}

      {clubsToShow.length === 0 ? (
        <div style={{
          padding: '60px',
          textAlign: 'center',
          backgroundColor: '#f8f9fa',
          borderRadius: '12px',
          border: '2px dashed #ddd'
        }}>
          <p style={{ fontSize: '18px', color: '#666', margin: 0 }}>
            {activeTab === 'all' 
              ? 'No clubs available yet' 
              : activeTab === 'my'
              ? "You haven't joined any clubs yet"
              : "No local clubs found based on your location and preferences"}
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '24px'
        }}>
          {clubsToShow.map((club) => {
            const member = isMember(club.clubID)
            const themeColor = getThemeColor(club.theme)

            return (
              <div
                key={club.clubID}
                onClick={() => navigate(`/clubs/${club.clubID}`)}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: '12px',
                  padding: '24px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  border: '1px solid #e5e7eb',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                {/* Theme accent bar */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  backgroundColor: themeColor
                }} />

                {/* Privacy badge */}
                <div style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  backgroundColor: club.privacy === 'Public' ? '#d4edda' : '#fff3cd',
                  color: club.privacy === 'Public' ? '#155724' : '#856404',
                  fontSize: '12px',
                  fontWeight: 600
                }}>
                  {club.privacy}
                </div>

                <h2 style={{
                  marginTop: 0,
                  marginBottom: '12px',
                  fontSize: '24px',
                  fontWeight: 700,
                  color: '#1a1a1a'
                }}>
                  {club.name}
                </h2>

                <div style={{ marginBottom: '16px', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    backgroundColor: '#f0f0f0',
                    fontSize: '14px',
                    fontWeight: 500
                  }}>
                    📚 {club.theme}
                  </div>
                  <div style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    backgroundColor: '#e3f2fd',
                    fontSize: '14px',
                    color: '#1976d2'
                  }}>
                    👥 {club.memberCount} {club.memberCount === 1 ? 'member' : 'members'}
                  </div>
                </div>

                <div style={{ marginBottom: '16px', fontSize: '14px', color: '#666' }}>
                  <div style={{ marginBottom: '4px' }}>
                    <strong>Owner:</strong> {club.ownerName || 'Unknown'}
                  </div>
    <div>
                    <strong>Created:</strong> {formatDate(club.dateCreated)}
                  </div>
                  {member && club.dateJoined && (
                    <div style={{ marginTop: '4px', color: '#007bff' }}>
                      <strong>Joined:</strong> {formatDate(club.dateJoined)}
                    </div>
                  )}
                </div>

                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{ marginTop: '16px' }}
                >
                  {member ? (
                    <button
                      onClick={() => handleLeaveClub(club.clubID)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '8px',
                        border: '1px solid #dc3545',
                        backgroundColor: '#fff',
                        color: '#dc3545',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 600,
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#dc3545'
                        e.currentTarget.style.color = '#fff'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#fff'
                        e.currentTarget.style.color = '#dc3545'
                      }}
                    >
                      Leave Club
                    </button>
                  ) : (
                    <button
                      onClick={() => handleJoinClub(club.clubID)}
                      disabled={joiningClubs.has(club.clubID)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: joiningClubs.has(club.clubID) ? '#ccc' : '#007bff',
                        color: '#fff',
                        cursor: joiningClubs.has(club.clubID) ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: 600,
                        transition: 'all 0.2s',
                        opacity: joiningClubs.has(club.clubID) ? 0.7 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (!joiningClubs.has(club.clubID)) {
                          e.currentTarget.style.backgroundColor = '#0056b3'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!joiningClubs.has(club.clubID)) {
                          e.currentTarget.style.backgroundColor = '#007bff'
                        }
                      }}
                    >
                      {joiningClubs.has(club.clubID) ? 'Joining...' : 'Join Club'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ClubListPage
