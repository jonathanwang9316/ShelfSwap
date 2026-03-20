import AuthProvider from '@/features/auth/contexts/AuthContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FC, PropsWithChildren, Suspense } from 'react'

const queryClient = new QueryClient()

const AppProviders: FC<PropsWithChildren> = ({ children }) => {
  // The HTML code was developed using AI assistance
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    </Suspense>
  )
}

export default AppProviders
