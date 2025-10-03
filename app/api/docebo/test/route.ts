import { NextResponse } from 'next/server'

// GET /api/docebo/test - Test Docebo API connectivity
export async function GET() {
  try {
    const doceboApiUrl = process.env.DOCEBO_API_URL
    const doceboUsername = process.env.DOCEBO_API_USERNAME
    const doceboPassword = process.env.DOCEBO_API_PASSWORD

    console.log('Environment variables check:')
    console.log('DOCEBO_API_URL:', doceboApiUrl)
    console.log('DOCEBO_API_USERNAME:', doceboUsername)
    console.log('DOCEBO_API_PASSWORD:', doceboPassword ? '***' : 'NOT SET')

    if (!doceboApiUrl || !doceboUsername || !doceboPassword) {
      return NextResponse.json({
        error: 'Missing Docebo API configuration',
        missing: {
          url: !doceboApiUrl,
          username: !doceboUsername,
          password: !doceboPassword
        }
      }, { status: 500 })
    }

    // Test basic connectivity to Docebo
    try {
      console.log(`Testing connectivity to: ${doceboApiUrl}`)
      
      const testResponse = await fetch(`${doceboApiUrl}/api/course/v1/courses?page_size=1`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${btoa(`${doceboUsername}:${doceboPassword}`)}`,
          'Content-Type': 'application/json'
        }
      })

      const responseText = await testResponse.text()
      
      return NextResponse.json({
        status: 'test_completed',
        docebo_url: doceboApiUrl,
        response_status: testResponse.status,
        response_headers: Object.fromEntries(testResponse.headers.entries()),
        response_body: responseText.substring(0, 500), // First 500 chars
        auth_method: 'basic_auth'
      })
    } catch (fetchError) {
      console.error('Fetch error:', fetchError)
      
      return NextResponse.json({
        error: 'Network error connecting to Docebo',
        details: fetchError instanceof Error ? fetchError.message : 'Unknown error',
        docebo_url: doceboApiUrl
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Test endpoint error:', error)
    return NextResponse.json({
      error: 'Test endpoint failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}