'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Zap,
  Award,
  ArrowRight
} from 'lucide-react'
// Helper function for date formatting
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

interface WebhookLog {
  id: string
  messageId: string
  event: string
  status: 'RECEIVED' | 'PROCESSING' | 'SUCCESS' | 'FAILED'
  domain?: string
  errorMessage?: string
  createdAt: string
  updatedAt: string
  payload: any
}

interface ActivityItem {
  id: string
  type: 'webhook' | 'certificate'
  title: string
  description: string
  status: string
  timestamp: string
  domain?: string
  errorMessage?: string
  details: any
}

export default function ActivityPage() {
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchWebhookLogs()
  }, [])

  const fetchWebhookLogs = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/webhooks')
      if (response.ok) {
        const data = await response.json()
        setWebhookLogs(data.webhooks || [])
      }
    } catch (error) {
      console.error('Failed to fetch webhook logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'PROCESSING':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      case 'RECEIVED':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return 'bg-green-100 text-green-800'
      case 'FAILED':
        return 'bg-red-100 text-red-800'
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-800'
      case 'RECEIVED':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getEventIcon = (event: string) => {
    if (event.includes('course.enrollment.completed')) {
      return <Award className="h-4 w-4 text-purple-500" />
    }
    return <Zap className="h-4 w-4 text-blue-500" />
  }

  const filteredLogs = webhookLogs.filter(log =>
    log.messageId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.event.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.domain?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.status.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-64 mb-4"></div>
          <div className="h-4 bg-gray-300 rounded w-96 mb-8"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Activity Log
        </h1>
        <p className="text-gray-600">
          Monitor webhook processing and certificate generation activities
        </p>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search activity logs..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={fetchWebhookLogs}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {filteredLogs.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Zap className="mx-auto h-12 w-12" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {webhookLogs.length === 0 ? 'No activity yet' : 'No matching activity'}
            </h3>
            <p className="text-gray-600">
              {webhookLogs.length === 0 
                ? 'Webhook events and certificate activities will appear here'
                : 'Try adjusting your search terms'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredLogs.map((log) => (
            <Card key={log.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      {getEventIcon(log.event)}
                      {getStatusIcon(log.status)}
                      <h3 className="text-lg font-medium">
                        {log.event === 'course.enrollment.completed' 
                          ? 'Course Completion Webhook' 
                          : log.event
                        }
                      </h3>
                      <Badge className={getStatusColor(log.status)}>
                        {log.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                      <div>
                        <span className="font-medium">Message ID:</span>
                        <div className="font-mono text-xs">{log.messageId}</div>
                      </div>
                      <div>
                        <span className="font-medium">Domain:</span>
                        <div>{log.domain || 'Unknown'}</div>
                      </div>
                      <div>
                        <span className="font-medium">Received:</span>
                        <div>{formatDate(log.createdAt)}</div>
                      </div>
                      <div>
                        <span className="font-medium">Last Updated:</span>
                        <div>{formatDate(log.updatedAt)}</div>
                      </div>
                    </div>

                    {/* Payload details for course completion */}
                    {log.event === 'course.enrollment.completed' && log.payload?.event?.body?.payload && (
                      <div className="bg-gray-50 rounded-lg p-4 mb-3">
                        <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                          <ArrowRight className="h-4 w-4 mr-2" />
                          Course Completion Details
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">User ID:</span>
                            <div className="font-medium">{log.payload.event.body.payload.user_id}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Course ID:</span>
                            <div className="font-medium">{log.payload.event.body.payload.course_id}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Completion Date:</span>
                            <div className="font-medium">
                              {new Date(log.payload.event.body.payload.completion_date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric', 
                                year: 'numeric'
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {log.errorMessage && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                        <div className="flex">
                          <XCircle className="h-4 w-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                          <span className="text-sm text-red-700">{log.errorMessage}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}