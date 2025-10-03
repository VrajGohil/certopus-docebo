import { NextResponse } from 'next/server'

// GET /api/certopus/organizations - Get all Certopus organizations
export async function GET() {
  try {
    const certopusApiUrl = process.env.CERTOPUS_API_URL
    const certopusApiKey = process.env.CERTOPUS_API_KEY

    if (!certopusApiUrl || !certopusApiKey) {
      return NextResponse.json(
        { error: 'Certopus API configuration missing' },
        { status: 500 }
      )
    }

    const response = await fetch(`${certopusApiUrl}/organisations`, {
      headers: {
        'X-API-KEY': certopusApiKey,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      console.error('Certopus API error:', response.status, response.statusText)
      const errorText = await response.text()
      return NextResponse.json(
        { error: `Certopus API error (${response.status}): ${errorText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    // Transform the response to match our expected format
    const organizations = Array.isArray(data) ? data : data.organizations || data.data || []
    
    const transformedOrganizations = organizations.map((org: any) => ({
      id: org.id || org._id,
      name: org.name || org.title || org.organization_name
    }))

    return NextResponse.json(transformedOrganizations)
  } catch (error) {
    console.error('Error fetching Certopus organizations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch organizations' },
      { status: 500 }
    )
  }
}