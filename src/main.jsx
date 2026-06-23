import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConfigProvider } from 'antd'
import { AuthProvider } from '@/store/AuthContext'
import { router } from '@/routes'
import '@/styles/globals.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
})

const antdTheme = {
  token: {
    colorPrimary: '#6366f1',
    colorSuccess: '#16a34a',
    colorWarning: '#d97706',
    colorError: '#dc2626',
    borderRadius: 10,
    borderRadiusLG: 14,
    fontFamily: "'Poppins', system-ui, sans-serif",
    fontSize: 14,
  },
  components: {
    Modal: { borderRadiusLG: 20 },
    Button: { borderRadius: 999 },
  },
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ConfigProvider theme={antdTheme}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </QueryClientProvider>
    </ConfigProvider>
  </StrictMode>
)
