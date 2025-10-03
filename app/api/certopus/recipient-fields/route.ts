import { NextRequest, NextResponse } from 'next/server'

// GET /api/certopus/recipient-fields?categoryId={id}&organizationId={id}&eventId={id} - Get recipient fields for mapping attributes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')
    const organizationId = searchParams.get('organizationId')
    const eventId = searchParams.get('eventId')
    
    if (!categoryId || !organizationId || !eventId) {
      return NextResponse.json(
        { error: 'categoryId, organizationId, and eventId parameters are all required' },
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

    const apiUrl = new URL(`${certopusApiUrl}/recipient_fields`)
    apiUrl.searchParams.set('categoryId', categoryId)
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
    const recipientFields = Array.isArray(data) ? data : data.data || []
    
    const transformedFields = recipientFields.map((field: any) => ({
      key: field.key || field.name,
      label: field.label || field.title || field.name,
      type: field.type || 'text',
      required: field.required || false,
      placeholder: field.placeholder || '',
      description: field.description || ''
    }))

    return NextResponse.json(transformedFields)
  } catch (error) {
    console.error('Error fetching Certopus recipient fields:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recipient fields' },
      { status: 500 }
    )
  }
}