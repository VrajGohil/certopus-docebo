import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const certificates = await prisma.certificate.findMany({
      include: {
        courseMapping: {
          include: {
            doceboDomain: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform the data to match our frontend interface
    const transformedCertificates = certificates.map((cert: any) => ({
      id: cert.id,
      userName: cert.userName,
      userEmail: cert.userEmail,
      courseName: cert.courseMapping?.courseTitle || `Course ${cert.doceboCourseId}`,
      domain: cert.courseMapping?.doceboDomain?.name || 'Unknown Domain',
      status: cert.status,
      completionDate: cert.completionDate.toISOString(),
      createdAt: cert.createdAt.toISOString(),
      certificateUrl: cert.certificateUrl,
      errorMessage: cert.errorMessage
    }))

    return NextResponse.json({ 
      certificates: transformedCertificates 
    })
  } catch (error) {
    console.error('Error fetching certificates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch certificates' },
      { status: 500 }
    )
  }
}