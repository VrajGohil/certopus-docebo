'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  Home, 
  Globe, 
  BookOpen, 
  Webhook, 
  Activity, 
  Settings,
  Award,
  LogOut,
  User
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Course Mappings', href: '/mappings', icon: BookOpen },
  { name: 'Certificates', href: '/certificates', icon: Award },
  { name: 'Activity', href: '/activity', icon: Activity },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST'
      })

      if (response.ok) {
        toast.success('Logged out successfully')
        router.push('/login')
        router.refresh()
      } else {
        toast.error('Logout failed')
      }
    } catch (error) {
      toast.error('Logout failed')
    }
  }

  return (
    <div className="flex h-full w-64 flex-col bg-gray-900">
      <div className="flex h-16 shrink-0 items-center px-6">
        <div className="flex items-center">
          <Award className="h-8 w-8 text-blue-400" />
          <span className="ml-2 text-lg font-semibold text-white">
            Docebo-Certopus
          </span>
        </div>
      </div>
      <nav className="flex flex-1 flex-col px-6 pb-4">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      pathname === item.href
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800',
                      'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                    )}
                  >
                    <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
          
          {/* Logout button */}
          <li className="mt-auto">
            <div className="border-t border-gray-800 pt-4">
              <div className="flex items-center gap-x-3 px-2 py-2 text-sm text-gray-400 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800">
                  <User className="h-4 w-4" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-medium text-white truncate">
                    Administrator
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    Authenticated
                  </p>
                </div>
              </div>
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="w-full justify-start text-gray-400 hover:text-white hover:bg-gray-800"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </li>
        </ul>
      </nav>
    </div>
  )
}