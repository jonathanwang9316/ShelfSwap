import type { FC } from 'react'
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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
}

type Member = {
  userID: number
  username: string
  dateJoined: string
}

const ClubDetailPage: FC = () => {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [club, setClub] = useState<Club | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [isMember, setIsMember] = useState(false)
  const [error, setError] = useState('')
  const [joining, setJoining] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [removingMembers, setRemovingMembers] = useState<Set<number>>(new Set())

  useEffect(() => {
    const fetchClubData = async () => {
      if (!id || !user) return

      try {
        setLoading(true)
        setError('')

        const [clubResponse, membersResponse, myClubsResponse] = await Promise.all([
          api.get<Club>(`/clubs/${id}`),
          api.get<Member[]>(`/clubs/${id}/members`),
          api.get<Club[]>('/clubs/my', { params: { userId: user.userID } })
        ])

        setClub(clubResponse.data)
        setMembers(membersResponse.data)
        setIsMember(myClubsResponse.data.some(c => c.clubID === parseInt(id)))
      } catch (err: any) {
        console.error('Error fetching club data:', err)
        setError('Failed to load club information')
      } finally {
        setLoading(false)
      }
    }

    fetchClubData()
  }, [id, user])

  const handleJoin = async () => {
    if (!user || !id) return

    try {
      setJoining(true)
      const response = await api.post(`/clubs/${id}/join`, {
        userId: user.userID
      })

      if (response.data.success) {
        setIsMember(true)
        const [clubResponse, membersResponse] = await Promise.all([
          api.get<Club>(`/clubs/${id}`),
          api.get<Member[]>(`/clubs/${id}/members`)
        ])
        setClub(clubResponse.data)
        setMembers(membersResponse.data)
      }
    } catch (err: any) {
      console.error('Error joining club:', err)
      alert(err.response?.data?.message || 'Failed to join club')
    } finally {
      setJoining(false)
    }
  }

  const handleLeave = async () => {
    if (!user || !id) return

    if (!window.confirm('Are you sure you want to leave this club?')) {
      return
    }

    try {
      setLeaving(true)
      const response = await api.delete(`/clubs/${id}/leave`, {
        params: { userId: user.userID }
      })

      if (response.data.success) {
        setIsMember(false)
        const [clubResponse, membersResponse] = await Promise.all([
          api.get<Club>(`/clubs/${id}`),
          api.get<Member[]>(`/clubs/${id}/members`)
        ])
        setClub(clubResponse.data)
        setMembers(membersResponse.data)
      }
    } catch (err: any) {
      console.error('Error leaving club:', err)
      alert(err.response?.data?.message || 'Failed to leave club')
    } finally {
      setLeaving(false)
    }
  }

  const handleDeleteClub = async () => {
    if (!user || !id || !club) return

    if (!window.confirm(`Are you sure you want to delete "${club.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      setDeleting(true)
      const response = await api.delete(`/clubs/${id}`, {
        params: { userId: user.userID }
      })

      if (response.data.success) {
        navigate('/clubs')
      }
    } catch (err: any) {
      console.error('Error deleting club:', err)
      alert(err.response?.data?.message || 'Failed to delete club')
    } finally {
      setDeleting(false)
    }
  }

  const handleRemoveMember = async (memberUserId: number) => {
    if (!user || !id || !club) return

    const member = members.find(m => m.userID === memberUserId)
    if (!member) return

    if (!window.confirm(`Are you sure you want to remove ${member.username} from this club?`)) {
      return
    }

    try {
      setRemovingMembers(prev => new Set(prev).add(memberUserId))
      const response = await api.delete(`/clubs/${id}/members/${memberUserId}`, {
        params: { ownerId: user.userID }
      })

      if (response.data.success) {
        const [clubResponse, membersResponse] = await Promise.all([
          api.get<Club>(`/clubs/${id}`),
          api.get<Member[]>(`/clubs/${id}/members`)
        ])
        setClub(clubResponse.data)
        setMembers(membersResponse.data)
      }
    } catch (err: any) {
      console.error('Error removing member:', err)
      alert(err.response?.data?.message || 'Failed to remove member')
    } finally {
      setRemovingMembers(prev => {
        const next = new Set(prev)
        next.delete(memberUserId)
        return next
      })
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
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

  // The HTML code was developed using AI assistance
  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Loading club information...</p>
      </div>
    )
  }

  if (error || !club) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h1 style={{ marginBottom: '16px' }}>Club Not Found</h1>
        <p style={{ color: '#666', marginBottom: '24px' }}>
          {error || 'The club you are looking for does not exist.'}
        </p>
        <button
          onClick={() => navigate('/clubs')}
          style={{
            padding: '10px 24px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: '#007bff',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 600
          }}
        >
          Back to Clubs
        </button>
      </div>
    )
  }

  const themeColor = getThemeColor(club.theme)

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Back button */}
      <button
        onClick={() => navigate('/clubs')}
        style={{
          marginBottom: '24px',
          padding: '8px 16px',
          borderRadius: '8px',
          border: '1px solid #ddd',
          backgroundColor: '#fff',
          cursor: 'pointer',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        ← Back to Clubs
      </button>

      {/* Club Header */}
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '16px',
        padding: '32px',
        marginBottom: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        border: '1px solid #e5e7eb',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Theme accent bar */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '6px',
          backgroundColor: themeColor
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '24px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: '36px', fontWeight: 700, color: '#1a1a1a' }}>
                {club.name}
              </h1>
              <div style={{
                padding: '6px 16px',
                borderRadius: '20px',
                backgroundColor: club.privacy === 'Public' ? '#d4edda' : '#fff3cd',
                color: club.privacy === 'Public' ? '#155724' : '#856404',
                fontSize: '14px',
                fontWeight: 600
              }}>
                {club.privacy}
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
              <div style={{
                padding: '8px 16px',
                borderRadius: '8px',
                backgroundColor: '#f0f0f0',
                fontSize: '16px',
                fontWeight: 500
              }}>
                📚 {club.theme}
              </div>
              <div style={{
                padding: '8px 16px',
                borderRadius: '8px',
                backgroundColor: '#e3f2fd',
                fontSize: '16px',
                color: '#1976d2'
              }}>
                👥 {club.memberCount} {club.memberCount === 1 ? 'member' : 'members'}
              </div>
            </div>

            <div style={{ fontSize: '15px', color: '#666', lineHeight: '1.6' }}>
              <div style={{ marginBottom: '8px' }}>
                <strong>Owner:</strong> {club.ownerName || 'Unknown'}
              </div>
              <div>
                <strong>Created:</strong> {formatDate(club.dateCreated)}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-end' }}>
            {user && club.ownerID === user.userID && (
              <button
                onClick={handleDeleteClub}
                disabled={deleting}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: '1px solid #dc3545',
                  backgroundColor: '#fff',
                  color: '#dc3545',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: 600,
                  opacity: deleting ? 0.7 : 1,
                  transition: 'all 0.2s',
                  minWidth: '140px',
                  width: '140px'
                }}
                onMouseEnter={(e) => {
                  if (!deleting) {
                    e.currentTarget.style.backgroundColor = '#dc3545'
                    e.currentTarget.style.color = '#fff'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!deleting) {
                    e.currentTarget.style.backgroundColor = '#fff'
                    e.currentTarget.style.color = '#dc3545'
                  }
                }}
              >
                {deleting ? 'Deleting...' : 'Delete Club'}
              </button>
            )}
            {isMember ? (
              <button
                onClick={handleLeave}
                disabled={leaving}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: '1px solid #dc3545',
                  backgroundColor: '#fff',
                  color: '#dc3545',
                  cursor: leaving ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: 600,
                  opacity: leaving ? 0.7 : 1,
                  transition: 'all 0.2s',
                  minWidth: '140px',
                  width: '140px'
                }}
                onMouseEnter={(e) => {
                  if (!leaving) {
                    e.currentTarget.style.backgroundColor = '#dc3545'
                    e.currentTarget.style.color = '#fff'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!leaving) {
                    e.currentTarget.style.backgroundColor = '#fff'
                    e.currentTarget.style.color = '#dc3545'
                  }
                }}
              >
                {leaving ? 'Leaving...' : 'Leave Club'}
              </button>
            ) : (
              <button
                onClick={handleJoin}
                disabled={joining}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#007bff',
                  color: '#fff',
                  cursor: joining ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: 600,
                  opacity: joining ? 0.7 : 1,
                  transition: 'all 0.2s',
                  minWidth: '140px',
                  width: '140px'
                }}
                onMouseEnter={(e) => {
                  if (!joining) {
                    e.currentTarget.style.backgroundColor = '#0056b3'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!joining) {
                    e.currentTarget.style.backgroundColor = '#007bff'
                  }
                }}
              >
                {joining ? 'Joining...' : 'Join Club'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Members Section */}
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '16px',
        padding: '32px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        border: '1px solid #e5e7eb'
      }}>
        <h2 style={{
          marginTop: 0,
          marginBottom: '24px',
          fontSize: '24px',
          fontWeight: 700,
          color: '#1a1a1a'
        }}>
          Members ({members.length})
        </h2>

        {members.length === 0 ? (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: '#666'
          }}>
            <p>No members yet</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '16px'
          }}>
            {members.map((member) => (
              <div
                key={member.userID}
                style={{
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  backgroundColor: '#fafafa',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f0f0f0'
                  e.currentTarget.style.borderColor = '#007bff'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#fafafa'
                  e.currentTarget.style.borderColor = '#e5e7eb'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '8px'
                }}>
                  <div>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: 600,
                      marginBottom: '4px',
                      color: '#1a1a1a'
                    }}>
                      {member.username}
                      {member.userID === club.ownerID && (
                        <span style={{
                          marginLeft: '8px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: '#007bff',
                          color: '#fff',
                          fontSize: '12px',
                          fontWeight: 600
                        }}>
                          Owner
                        </span>
                      )}
                    </div>
                    <div style={{
                      fontSize: '13px',
                      color: '#666'
                    }}>
                      Joined {formatDate(member.dateJoined)}
                    </div>
                  </div>
                  {user && club.ownerID === user.userID && member.userID !== club.ownerID && (
                    <button
                      onClick={() => handleRemoveMember(member.userID)}
                      disabled={removingMembers.has(member.userID)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid #dc3545',
                        backgroundColor: '#fff',
                        color: '#dc3545',
                        cursor: removingMembers.has(member.userID) ? 'not-allowed' : 'pointer',
                        fontSize: '12px',
                        fontWeight: 600,
                        opacity: removingMembers.has(member.userID) ? 0.7 : 1,
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (!removingMembers.has(member.userID)) {
                          e.currentTarget.style.backgroundColor = '#dc3545'
                          e.currentTarget.style.color = '#fff'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!removingMembers.has(member.userID)) {
                          e.currentTarget.style.backgroundColor = '#fff'
                          e.currentTarget.style.color = '#dc3545'
                        }
                      }}
                    >
                      {removingMembers.has(member.userID) ? 'Removing...' : 'Remove'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ClubDetailPage
