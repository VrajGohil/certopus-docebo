import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Copy, ExternalLink, Webhook } from 'lucide-react'

export default function WebhooksPage() {
  const webhookUrl = process.env.NODE_ENV === 'production' 
    ? 'https://yourdomain.com/api/webhook'
    : 'https://your-domain.ngrok.io/api/webhook' // For development

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Webhook Setup
        </h1>
        <p className="text-gray-600">
          Configure Docebo to send course completion events to this service
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Webhook Configuration</CardTitle>
            <CardDescription>
              Use these settings in your Docebo webhook configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Webhook URL</label>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 p-2 bg-gray-100 rounded text-sm font-mono">
                    {webhookUrl}
                  </code>
                  <Button variant="outline" size="sm">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">HTTP Method</label>
                <code className="block p-2 bg-gray-100 rounded text-sm font-mono">
                  POST
                </code>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Content Type</label>
                <code className="block p-2 bg-gray-100 rounded text-sm font-mono">
                  application/json
                </code>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Event Type</label>
                <code className="block p-2 bg-gray-100 rounded text-sm font-mono">
                  course.enrollment.completed
                </code>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Docebo Webhook Setup Steps</CardTitle>
            <CardDescription>
              Follow these steps to configure webhooks in your Docebo instance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <div>
                  <h4 className="font-medium">Access Docebo Admin Panel</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    Log in to your Docebo instance as an administrator
                  </p>
                  <Button variant="outline" size="sm">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open Docebo
                  </Button>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <div>
                  <h4 className="font-medium">Navigate to API and SSO</h4>
                  <p className="text-sm text-gray-600">
                    Go to Admin Menu → API and SSO → Webhooks
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <div>
                  <h4 className="font-medium">Create New Webhook</h4>
                  <p className="text-sm text-gray-600">
                    Click "Add Webhook" and configure with the settings shown above
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                  4
                </div>
                <div>
                  <h4 className="font-medium">Select Course Completion Event</h4>
                  <p className="text-sm text-gray-600">
                    Choose "course.enrollment.completed" as the trigger event
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                  5
                </div>
                <div>
                  <h4 className="font-medium">Test the Webhook</h4>
                  <p className="text-sm text-gray-600">
                    Complete a test course enrollment to verify the webhook is working
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Webhook Event Logs</CardTitle>
            <CardDescription>
              Monitor incoming webhook events and their processing status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Webhook className="mx-auto h-12 w-12" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No webhook events yet
              </h3>
              <p className="text-gray-600 mb-4">
                Webhook events will appear here once Docebo starts sending them
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Development & Testing</CardTitle>
            <CardDescription>
              Tips for testing webhooks during development
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2">Development Setup</h4>
              <p className="text-sm text-yellow-700 mb-3">
                For local development, use a service like ngrok to expose your local server to the internet:
              </p>
              <code className="block p-2 bg-yellow-100 rounded text-sm font-mono text-yellow-800">
                npx ngrok http 3000
              </code>
              <p className="text-sm text-yellow-700 mt-2">
                Then use the ngrok URL (e.g., https://abc123.ngrok.io/api/webhook) in your Docebo webhook configuration.
              </p>
            </div>
            
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">Testing Webhooks</h4>
              <p className="text-sm text-blue-700">
                You can test the webhook endpoint manually using curl or a tool like Postman with sample payloads.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}