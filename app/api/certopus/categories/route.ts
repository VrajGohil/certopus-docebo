import { NextRequest, NextResponse } from 'next/server'

// GET /api/certopus/categories?organizationId={id}&eventId={id} - Get categories for an organization and event
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    const eventId = searchParams.get('eventId')
    
    if (!organizationId || !eventId) {
      return NextResponse.json(
        { error: 'Both organizationId and eventId parameters are required' },
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

    const apiUrl = new URL(`${certopusApiUrl}/categories`)
    apiUrl.searchParams.set('organisationId', organizationId)
    apiUrl.searchParams.set('eventId', eventId)

    const response = await fetch(apiUrl.toString(), {
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
    const categories = Array.isArray(data) ? data : data.categories || data.data || []
    
    const transformedCategories = categories.map((category: any) => ({
      id: category.id || category._id,
      name: category.name || category.title || category.category_name
    }))

    return NextResponse.json(transformedCategories)
  } catch (error) {
    console.error('Error fetching Certopus categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}