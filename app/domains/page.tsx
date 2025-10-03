import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Globe } from 'lucide-react'

export default function DomainsPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Docebo Domains
          </h1>
          <p className="text-gray-600">
            Manage your Docebo domains and API configurations
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Domain
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Configured Domains</CardTitle>
            <CardDescription>
              Docebo domains with API access configured
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Globe className="mx-auto h-12 w-12" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No domains configured yet
              </h3>
              <p className="text-gray-600 mb-4">
                Add your first Docebo domain to start managing certificate generation
              </p>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add First Domain
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Domain Setup Requirements</CardTitle>
            <CardDescription>
              What you'll need to configure a Docebo domain
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Domain Information</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Docebo domain name (e.g., yourcompany.docebosaas.com)</li>
                  <li>• API base URL (usually standard)</li>
                </ul>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">API Credentials</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• API username</li>
                  <li>• API password</li>
                  <li>• Appropriate API permissions</li>
                </ul>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Required Permissions</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• User Management: Read access</li>
                  <li>• Course Management: Read access</li>
                  <li>• Webhook configuration access</li>
                </ul>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Webhook Configuration</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Webhook URL: /api/webhook</li>
                  <li>• Event: course.enrollment.completed</li>
                  <li>• Content-Type: application/json</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}