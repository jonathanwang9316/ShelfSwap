import { lazy } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import AppLayout from '@/layouts/AppLayout'
import ProtectedRoute from '@/features/auth/components/ProtectedRoute'

const HomePage = lazy(() => import('@/pages/HomePage'))
const AuthPage = lazy(() => import('@/features/auth/pages/AuthPage'))
const ProfilePage = lazy(() => import('@/features/auth/pages/ProfilePage'))
const LibraryDashboard = lazy(
  () => import('@/features/library/pages/LibraryDashboard'),
)
const SearchPage = lazy(() => import('@/features/search/pages/SearchPage'))
const BookDetailPage = lazy(
  () => import('@/features/books/pages/BookDetailPage'),
)
const SwapCenter = lazy(() => import('@/features/swaps/pages/SwapCenter'))
const ClubListPage = lazy(() => import('@/features/clubs/pages/ClubListPage'))
const ClubDetailPage = lazy(
  () => import('@/features/clubs/pages/ClubDetailPage'),
)
const AnalyticsDashboard = lazy(
  () => import('@/features/analytics/pages/AnalyticsDashboard'),
)

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <AuthPage />,
  },
  {
    path: '/signup',
    element: <AuthPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: '/profile',
        element: <ProfilePage />,
      },
      {
        path: '/library',
        element: <LibraryDashboard />,
      },
      {
        path: '/search',
        element: <SearchPage />,
      },
      {
        path: '/books/:id',
        element: <BookDetailPage />,
      },
      {
        path: '/swaps',
        element: <SwapCenter />,
      },
      {
        path: '/clubs',
        element: <ClubListPage />,
      },
      {
        path: '/clubs/:id',
        element: <ClubDetailPage />,
      },
      {
        path: '/analytics',
        element: <AnalyticsDashboard />,
      },
    ],
  },
])
