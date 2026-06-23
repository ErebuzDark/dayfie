import { createBrowserRouter } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import RootLayout from '@/components/shared/RootLayout'
import { Spin } from 'antd'
import { useOutletContext } from 'react-router-dom'

const LoginPage = lazy(() => import('@/pages/LoginPage'))
const HomePageWrapper = lazy(() => import('@/pages/HomePageWrapper'))
const ProfilePage = lazy(() => import('@/pages/ProfilePage'))

function PageLoader() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '6rem 0' }}>
      <Spin size="large" />
    </div>
  )
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<PageLoader />}>
            <HomePageWrapper />
          </Suspense>
        ),
      },
      {
        path: 'profile/:uid',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ProfilePage />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: '/login',
    element: (
      <Suspense fallback={<PageLoader />}>
        <LoginPage />
      </Suspense>
    ),
  },
])
