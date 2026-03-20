import { FC } from 'react'
import { useAuth } from '../hooks/useAuth'

const ProfilePage: FC = () => {
  const { user } = useAuth()

  // The HTML code was developed using AI assistance
  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Profile</h1>
      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '8px', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginTop: '20px'
      }}>
        <div style={{ marginBottom: '15px' }}>
          <strong>User ID:</strong> {user.userID}
        </div>
        <div style={{ marginBottom: '15px' }}>
          <strong>Username:</strong> {user.username}
        </div>
        <div style={{ marginBottom: '15px' }}>
          <strong>Email:</strong> {user.email}
        </div>
        <div style={{ marginBottom: '15px' }}>
          <strong>Name:</strong> {user.name}
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
