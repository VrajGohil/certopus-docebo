'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Activity, BookOpen, Settings, Webhook, Globe, Award, CheckCircle, XCircle, Clock, AlertTriangle, Copy, Check } from 'lucide-react'
import { useEffect, useState } from 'react'

interface DashboardStats {
  courseMappings: number
  certificates: number
  domains: number
  recentWebhooks: number
  certificatesByStatus: {
    SUCCESS: number
    FAILED: number
    PENDING: number
    GENERATING: number
  }
}

export default function HomePage() {
  const [stats, setStats] = useState<DashboardStats>({
    courseMappings: 0,
    certificates: 0,
    domains: 0,
    recentWebhooks: 0,
    certificatesByStatus: {
      SUCCESS: 0,
      FAILED: 0,
      PENDING: 0,
      GENERATING: 0
    }
  })
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  
  const webhookUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/api/webhook`
    : '/api/webhook'

  const copyWebhookUrl = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy webhook URL:', error)
    }
  }

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-64 mb-4"></div>
          <div className="h-4 bg-gray-300 rounded w-96 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
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
          Docebo-Certopus Integration
        </h1>
        <p className="text-gray-600">
          Automatically generate certificates when students complete Docebo courses
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Configured Domains
            </CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.domains}</div>
            <p className="text-xs text-muted-foreground">
              Connected Docebo instances
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Course Mappings
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.courseMappings}</div>
            <p className="text-xs text-muted-foreground">
              Courses mapped to certificates
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Certificates
            </CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.certificates}</div>
            <p className="text-xs text-muted-foreground">
              Certificates generated
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Recent Webhooks
            </CardTitle>
            <Webhook className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentWebhooks}</div>
            <p className="text-xs text-muted-foreground">
              Events received today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Webhook URL Section */}
      <Card className="mb-8 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center text-purple-900">
            <Webhook className="mr-2 h-5 w-5" />
            Webhook Endpoint
          </CardTitle>
          <CardDescription>
            Configure this URL in your Docebo instance to receive course completion events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-white border border-gray-300 rounded-lg px-4 py-3 font-mono text-sm break-all">
              {webhookUrl}
            </div>
            <Button
              onClick={copyWebhookUrl}
              variant={copied ? "default" : "outline"}
              size="lg"
              className={copied ? "bg-green-600 hover:bg-green-700" : ""}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-600 mt-3">
            <strong>Setup Instructions:</strong> Go to Docebo → Settings → API & SSO → Webhooks → Create Webhook → 
            Select "Course Enrollment Completed" event → Paste this URL
          </p>
        </CardContent>
      </Card>

      {/* Certificate Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="mr-2 h-5 w-5" />
              Certificate Status Overview
            </CardTitle>
            <CardDescription>
              Current status of certificate generation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-sm font-medium">Successful</span>
                </div>
                <Badge className="bg-green-100 text-green-800">
                  {stats.certificatesByStatus.SUCCESS}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <XCircle className="h-4 w-4 text-red-500 mr-2" />
                  <span className="text-sm font-medium">Failed</span>
                </div>
                <Badge className="bg-red-100 text-red-800">
                  {stats.certificatesByStatus.FAILED}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-yellow-500 mr-2" />
                  <span className="text-sm font-medium">Pending</span>
                </div>
                <Badge className="bg-yellow-100 text-yellow-800">
                  {stats.certificatesByStatus.PENDING}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <AlertTriangle className="h-4 w-4 text-blue-500 mr-2" />
                  <span className="text-sm font-medium">Generating</span>
                </div>
                <Badge className="bg-blue-100 text-blue-800">
                  {stats.certificatesByStatus.GENERATING}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common configuration and management tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link href="/settings" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="mr-2 h-4 w-4" />
                  API Configuration
                </Button>
              </Link>
              
              <Link href="/mappings" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Course Mappings
                </Button>
              </Link>
              
              <Link href="/certificates" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Award className="mr-2 h-4 w-4" />
                  View Certificates
                </Button>
              </Link>
              
              <Link href="/settings" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="mr-2 h-4 w-4" />
                  System Settings
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Getting Started Section */}
      {stats.domains === 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-900">
              <Settings className="mr-2 h-5 w-5" />
              Getting Started
            </CardTitle>
            <CardDescription className="text-blue-700">
              Set up your integration in a few simple steps
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <div>
                  <p className="font-medium text-blue-900">Configure API Settings</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Set up your Certopus API key and default Docebo API URL in Settings
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <div>
                  <p className="font-medium text-blue-900">Verify API Connection</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Test your Docebo and Certopus API connections
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <div>
                  <p className="font-medium text-blue-900">Create Course Mappings</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Map Docebo courses to Certopus certificate templates
                  </p>
                </div>
              </div>
              
              <div className="pt-4">
                <Link href="/settings">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Settings className="mr-2 h-4 w-4" />
                    Start Configuration
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}