import { FC, PropsWithChildren } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const ProtectedRoute: FC<PropsWithChildren> = ({ children }) => {
  const { isAuthenticated } = useAuth()

  // The HTML code was developed using AI assistance
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
