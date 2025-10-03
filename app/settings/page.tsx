'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Save, 
  TestTube, 
  CheckCircle, 
  XCircle, 
  Key,
  Globe,
  Zap,
  AlertCircle
} from 'lucide-react'

interface Settings {
  certopus: {
    apiKey: string
    apiUrl: string
    connected: boolean
    lastChecked?: string
  }
  docebo: {
    defaultApiUrl: string
    connected: boolean
    lastChecked?: string
  }
  webhooks: {
    enabled: boolean
    retryAttempts: number
    timeoutSeconds: number
  }
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    certopus: {
      apiKey: '',
      apiUrl: 'https://api.certopus.com/v1',
      connected: false
    },
    docebo: {
      defaultApiUrl: 'https://doceboapi.docebosaas.com',
      connected: false
    },
    webhooks: {
      enabled: true,
      retryAttempts: 3,
      timeoutSeconds: 30
    }
  })

  const [loading, setLoading] = useState(false)
  const [testingConnection, setTestingConnection] = useState<string | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(prev => ({ ...prev, ...data.settings }))
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    }
  }

  const saveSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings })
      })

      if (response.ok) {
        // Show success message
        console.log('Settings saved successfully')
      } else {
        console.error('Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const testConnection = async (service: 'certopus' | 'docebo') => {
    try {
      setTestingConnection(service)
      const response = await fetch(`/api/settings/test-connection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          service,
          settings: settings[service]
        })
      })

      const result = await response.json()
      
      setSettings(prev => ({
        ...prev,
        [service]: {
          ...prev[service],
          connected: result.success,
          lastChecked: new Date().toISOString()
        }
      }))
    } catch (error) {
      console.error(`Failed to test ${service} connection:`, error)
      setSettings(prev => ({
        ...prev,
        [service]: {
          ...prev[service],
          connected: false,
          lastChecked: new Date().toISOString()
        }
      }))
    } finally {
      setTestingConnection(null)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Settings
        </h1>
        <p className="text-gray-600">
          Configure API connections and system settings
        </p>
      </div>

      <div className="space-y-6">
        {/* Certopus Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Key className="mr-2 h-5 w-5" />
              Certopus API Configuration
            </CardTitle>
            <CardDescription>
              Configure your Certopus API credentials for certificate generation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Key
                </label>
                <Input
                  type="password"
                  placeholder="Enter Certopus API key"
                  value={settings.certopus.apiKey}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    setSettings(prev => ({
                      ...prev,
                      certopus: { ...prev.certopus, apiKey: e.target.value }
                    }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API URL
                </label>
                <Input
                  placeholder="https://api.certopus.com/v1"
                  value={settings.certopus.apiUrl}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    setSettings(prev => ({
                      ...prev,
                      certopus: { ...prev.certopus, apiUrl: e.target.value }
                    }))
                  }
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                {settings.certopus.connected ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <Badge className="bg-green-100 text-green-800">Connected</Badge>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-red-500" />
                    <Badge className="bg-red-100 text-red-800">Not Connected</Badge>
                  </>
                )}
                {settings.certopus.lastChecked && (
                  <span className="text-sm text-gray-500">
                    Last checked: {new Date(settings.certopus.lastChecked).toLocaleString()}
                  </span>
                )}
              </div>
              <Button
                variant="outline"
                onClick={() => testConnection('certopus')}
                disabled={testingConnection === 'certopus' || !settings.certopus.apiKey}
              >
                {testingConnection === 'certopus' ? (
                  <>
                    <TestTube className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <TestTube className="mr-2 h-4 w-4" />
                    Test Connection
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Docebo Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Globe className="mr-2 h-5 w-5" />
              Docebo API Configuration
            </CardTitle>
            <CardDescription>
              Configure default Docebo API settings (specific domains are configured separately)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default API URL
              </label>
              <Input
                placeholder="https://doceboapi.docebosaas.com"
                value={settings.docebo.defaultApiUrl}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  setSettings(prev => ({
                    ...prev,
                    docebo: { ...prev.docebo, defaultApiUrl: e.target.value }
                  }))
                }
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                <div className="text-sm text-blue-700">
                  <p>Individual Docebo domains are configured in the Domains section. This setting provides the default API URL for new domain configurations.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Webhook Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="mr-2 h-5 w-5" />
              Webhook Configuration
            </CardTitle>
            <CardDescription>
              Configure webhook processing behavior and retry settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Retry Attempts
                </label>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  value={settings.webhooks.retryAttempts}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    setSettings(prev => ({
                      ...prev,
                      webhooks: { ...prev.webhooks, retryAttempts: parseInt(e.target.value) || 0 }
                    }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Timeout (seconds)
                </label>
                <Input
                  type="number"
                  min="5"
                  max="300"
                  value={settings.webhooks.timeoutSeconds}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    setSettings(prev => ({
                      ...prev,
                      webhooks: { ...prev.webhooks, timeoutSeconds: parseInt(e.target.value) || 30 }
                    }))
                  }
                />
              </div>
              <div className="flex items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.webhooks.enabled}
                    onChange={(e) => 
                      setSettings(prev => ({
                        ...prev,
                        webhooks: { ...prev.webhooks, enabled: e.target.checked }
                      }))
                    }
                    className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Enable Webhooks</span>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button 
            onClick={saveSettings} 
            disabled={loading}
            className="min-w-32"
          >
            {loading ? (
              <>
                <Save className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}