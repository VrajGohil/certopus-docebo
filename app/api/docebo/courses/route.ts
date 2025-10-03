import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Helper function to get Docebo API token
async function getDoceboToken(apiUrl: string, username: string, password: string) {
  // Use correct Docebo OAuth2 authentication with proper client credentials
  try {
    const clientId = process.env.DOCEBO_CLIENT_ID
    const clientSecret = process.env.DOCEBO_CLIENT_SECRET
    
    if (!clientId || !clientSecret) {
      throw new Error('DOCEBO_CLIENT_ID and DOCEBO_CLIENT_SECRET are required')
    }

    const formData = new FormData()
    formData.append('client_id', clientId)
    formData.append('client_secret', clientSecret)
    formData.append('grant_type', 'password')
    formData.append('scope', 'api')
    formData.append('username', username)
    formData.append('password', password)

    const response = await fetch(`${apiUrl}/oauth2/token`, {
      method: 'POST',
      body: formData
    })

    if (response.ok) {
      const data = await response.json()
      return data.access_token
    } else {
      const errorText = await response.text()
      console.log('OAuth2 authentication failed:', response.status, errorText)
      throw new Error(`OAuth2 failed (${response.status}): ${errorText}`)
    }
  } catch (error) {
    console.log('OAuth2 authentication error:', error)
    throw error
  }
}

// GET /api/docebo/courses - Get courses from Docebo API with search
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    console.log(`Fetching Docebo courses - search: "${search}", page: ${page}, limit: ${limit}`)

    // Use environment variables for API configuration
    const doceboApiUrl = process.env.DOCEBO_API_URL
    const doceboUsername = process.env.DOCEBO_API_USERNAME
    const doceboPassword = process.env.DOCEBO_API_PASSWORD
    
    if (!doceboApiUrl || !doceboUsername || !doceboPassword) {
      return NextResponse.json({ error: 'Docebo API configuration missing' }, { status: 500 })
    }

    console.log(`Using Docebo API URL: ${doceboApiUrl}`)

    let response
    let apiUrl = new URL(`${doceboApiUrl}/api/course/v1/courses`)
    apiUrl.searchParams.set('page_size', limit.toString())
    apiUrl.searchParams.set('page', page.toString())
    
    if (search) {
      apiUrl.searchParams.set('search_text', search)
    }

    try {
      // Try OAuth2 authentication first
      const accessToken = await getDoceboToken(doceboApiUrl, doceboUsername, doceboPassword)
      
      response = await fetch(apiUrl.toString(), {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })
    } catch (authError) {
      console.log('OAuth authentication failed, trying basic auth...', authError)
      
      // Fallback to basic authentication
      response = await fetch(apiUrl.toString(), {
        headers: {
          'Authorization': `Basic ${btoa(`${doceboUsername}:${doceboPassword}`)}`,
          'Content-Type': 'application/json'
        }
      })
    }

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Docebo API error:', response.status, errorText)
      return NextResponse.json(
        { error: `Docebo API error (${response.status}): ${errorText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    // Transform courses to our expected format
    const courses = data.data?.items || data.items || []
    
    const transformedCourses = courses.map((course: any) => ({
      id: course.id || course.course_id,
      name: course.name || course.title || course.course_name,
      description: course.description || '',
      status: course.status || 'active',
      type: course.type || course.course_type || 'elearning',
      thumbnail: course.thumbnail || course.image_url || null,
      created_at: course.date_created || course.created_at || null,
      updated_at: course.date_modified || course.updated_at || null
    }))

    return NextResponse.json({
      courses: transformedCourses,
      pagination: {
        page: page,
        limit: limit,
        total: data.data?.count || data.total_count || transformedCourses.length,
        total_pages: Math.ceil((data.data?.count || data.total_count || transformedCourses.length) / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching Docebo courses:', error)
    return NextResponse.json(
      { error: `Failed to fetch courses: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}