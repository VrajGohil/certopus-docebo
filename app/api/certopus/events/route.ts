import { NextRequest, NextResponse } from 'next/server'

// GET /api/certopus/events?organizationId={id} - Get events for an organization
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    
    if (!organizationId) {
      return NextResponse.json(
        { error: 'organizationId parameter is required' },
        { status: 400 }
      )
    }

    const certopusApiUrl = process.env.CERTOPUS_API_URL
    const certopusApiKey = process.env.CERTOPUS_API_KEY

    if (!certopusApiUrl || !certopusApiKey) {
      return NextResponse.json(
        { error: 'Certopus API configuration missing' },
        { status: 500 }
      )
    }

    const response = await fetch(`${certopusApiUrl}/events/${organizationId}`, {
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
    const events = Array.isArray(data) ? data : data.events || data.data || []
    
    const transformedEvents = events.map((event: any) => ({
      id: event.id || event._id,
      name: event.name || event.title || event.event_name
    }))

    return NextResponse.json(transformedEvents)
  } catch (error) {
    console.error('Error fetching Certopus events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}