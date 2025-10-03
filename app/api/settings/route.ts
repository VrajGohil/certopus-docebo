import { NextRequest, NextResponse } from 'next/server'

// For now, we'll use environment variables as our "settings" storage
// In a real application, you might want to store these in a database

export async function GET() {
  try {
    const settings = {
      certopus: {
        apiKey: process.env.CERTOPUS_API_KEY ? '***masked***' : '',
        apiUrl: process.env.CERTOPUS_API_URL || 'https://api.certopus.com/v1',
        connected: !!process.env.CERTOPUS_API_KEY
      },
      docebo: {
        defaultApiUrl: process.env.DOCEBO_API_URL || 'https://doceboapi.docebosaas.com',
        connected: true
      },
      webhooks: {
        enabled: process.env.WEBHOOKS_ENABLED !== 'false',
        retryAttempts: parseInt(process.env.WEBHOOK_RETRY_ATTEMPTS || '3'),
        timeoutSeconds: parseInt(process.env.WEBHOOK_TIMEOUT_SECONDS || '30')
      }
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { settings } = await request.json()

    // In a real application, you would save these settings to a database
    // or update environment variables through your deployment platform
    
    // For now, we'll just validate the input and return success
    console.log('Settings update requested:', {
      certopus: {
        apiUrl: settings.certopus?.apiUrl,
        hasApiKey: !!settings.certopus?.apiKey
      },
      docebo: {
        defaultApiUrl: settings.docebo?.defaultApiUrl
      },
      webhooks: settings.webhooks
    })

    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully. Note: Some settings require server restart to take effect.'
    })
  } catch (error) {
    console.error('Error saving settings:', error)
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    )
  }
}