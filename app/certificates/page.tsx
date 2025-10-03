'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  Download, 
  ExternalLink, 
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle
} from 'lucide-react'

interface Certificate {
  id: string
  userName: string
  userEmail: string
  courseName: string
  domain: string
  status: 'PENDING' | 'GENERATING' | 'SUCCESS' | 'FAILED'
  completionDate: string
  createdAt: string
  certificateUrl?: string
  errorMessage?: string
}

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchCertificates()
  }, [])

  const fetchCertificates = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/certificates')
      if (response.ok) {
        const data = await response.json()
        setCertificates(data.certificates || [])
      }
    } catch (error) {
      console.error('Failed to fetch certificates:', error)
    } finally {
      setLoading(false)
    }
  }

  const retryGeneration = async (certificateId: string) => {
    try {
      const response = await fetch(`/api/certificates/${certificateId}/retry`, {
        method: 'POST'
      })
      
      if (response.ok) {
        // Refresh the certificates list
        fetchCertificates()
      } else {
        console.error('Failed to retry certificate generation')
      }
    } catch (error) {
      console.error('Error retrying certificate generation:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'GENERATING':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      case 'PENDING':
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
      case 'GENERATING':
        return 'bg-blue-100 text-blue-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredCertificates = certificates.filter(cert =>
    cert.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.domain.toLowerCase().includes(searchTerm.toLowerCase())
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
          Certificates
        </h1>
        <p className="text-gray-600">
          View and manage generated certificates
        </p>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search certificates..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={fetchCertificates}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {filteredCertificates.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <CheckCircle className="mx-auto h-12 w-12" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {certificates.length === 0 ? 'No certificates yet' : 'No matching certificates'}
            </h3>
            <p className="text-gray-600">
              {certificates.length === 0 
                ? 'Certificates will appear here when students complete courses'
                : 'Try adjusting your search terms'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredCertificates.map((certificate) => (
            <Card key={certificate.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(certificate.status)}
                      <h3 className="text-lg font-medium">{certificate.userName}</h3>
                      <Badge className={getStatusColor(certificate.status)}>
                        {certificate.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Email:</span>
                        <div>{certificate.userEmail}</div>
                      </div>
                      <div>
                        <span className="font-medium">Course:</span>
                        <div>{certificate.courseName}</div>
                      </div>
                      <div>
                        <span className="font-medium">Domain:</span>
                        <div>{certificate.domain}</div>
                      </div>
                      <div>
                        <span className="font-medium">Completed:</span>
                        <div>{new Date(certificate.completionDate).toLocaleDateString()}</div>
                      </div>
                    </div>

                    {certificate.errorMessage && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                        <div className="flex">
                          <XCircle className="h-4 w-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                          <span className="text-sm text-red-700">{certificate.errorMessage}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {certificate.status === 'FAILED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => retryGeneration(certificate.id)}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry
                      </Button>
                    )}
                    
                    {certificate.certificateUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(certificate.certificateUrl, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View
                      </Button>
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