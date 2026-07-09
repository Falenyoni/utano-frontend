import { Outlet } from 'react-router'
import { Sidebar } from '@/app/layout/Sidebar'
import { Navbar } from '@/app/layout/Navbar'

function App() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default App