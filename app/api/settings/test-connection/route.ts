import { NextRequest, NextResponse } from 'next/server'
import { CertopusService } from '@/lib/certopus-service'

export async function POST(request: NextRequest) {
  try {
    const { service, settings } = await request.json()

    switch (service) {
      case 'certopus':
        return await testCertopusConnection(settings)
      case 'docebo':
        return await testDoceboConnection(settings)
      default:
        return NextResponse.json(
          { success: false, message: 'Unknown service' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error testing connection:', error)
    return NextResponse.json(
      { success: false, message: 'Connection test failed' },
      { status: 500 }
    )
  }
}

async function testCertopusConnection(settings: any) {
  try {
    if (!settings.apiKey) {
      return NextResponse.json({
        success: false,
        message: 'API key is required'
      })
    }

    // Test Certopus service
    const certopusService = new CertopusService(settings.apiKey, settings.apiUrl)

    // Try to get organisations as a test
    await certopusService.getOrganisations()

    return NextResponse.json({
      success: true,
      message: 'Certopus connection successful'
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: `Certopus connection failed: ${error.message}`
    })
  }
}

async function testDoceboConnection(settings: any) {
  try {
    if (!settings.defaultApiUrl) {
      return NextResponse.json({
        success: false,
        message: 'API URL is required'
      })
    }

    // For Docebo, we can only test if the URL is reachable
    // since we need domain-specific credentials
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    
    const response = await fetch(settings.defaultApiUrl, {
      method: 'HEAD',
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)

    if (response.ok || response.status === 404) {
      // 404 is acceptable - it means the server is reachable
      return NextResponse.json({
        success: true,
        message: 'Docebo API URL is reachable'
      })
    } else {
      return NextResponse.json({
        success: false,
        message: `Docebo API returned status: ${response.status}`
      })
    }
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: `Docebo connection failed: ${error.message}`
    })
  }
}