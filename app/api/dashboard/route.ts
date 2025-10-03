import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get counts for dashboard statistics
    const [
      activeMappings,
      totalCertificates,
      todayWebhooks,
      activeDomains
    ] = await Promise.all([
      // Active course mappings
      prisma.courseMapping.count({
        where: { active: true }
      }),
      
      // Total certificates generated
      prisma.certificate.count(),
      
      // Webhook events processed today
      prisma.webhookLog.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      
      // Active Docebo domains
      prisma.doceboDomain.count({
        where: { active: true }
      })
    ])

    // Get recent activity (last 10 webhook events)
    const recentActivity = await prisma.webhookLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        doceboDomain: {
          select: { name: true }
        }
      }
    })

    // Get certificate generation stats for the last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const certificateStats = await prisma.certificate.groupBy({
      by: ['status'],
      where: {
        createdAt: { gte: sevenDaysAgo }
      },
      _count: {
        status: true
      }
    })

    // Get recent certificates
    const recentCertificates = await prisma.certificate.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        doceboDomain: {
          select: { name: true }
        },
        courseMapping: {
          select: { courseTitle: true }
        }
      }
    })

    const stats = {
      activeMappings,
      totalCertificates,
      todayWebhooks,
      activeDomains,
      recentActivity: recentActivity.map(activity => ({
        id: activity.id,
        event: activity.event,
        status: activity.status,
        domain: activity.doceboDomain?.name,
        timestamp: activity.createdAt,
        errorMessage: activity.errorMessage
      })),
      certificateStats: certificateStats.reduce((acc, stat) => {
        acc[stat.status.toLowerCase()] = stat._count.status
        return acc
      }, {} as Record<string, number>),
      recentCertificates: recentCertificates.map(cert => ({
        id: cert.id,
        userName: cert.userName,
        userEmail: cert.userEmail,
        courseName: cert.courseMapping?.courseTitle || `Course ${cert.doceboCourseId}`,
        domain: cert.doceboDomain.name,
        status: cert.status,
        completionDate: cert.completionDate,
        createdAt: cert.createdAt,
        certificateUrl: cert.certificateUrl
      }))
    }

    return NextResponse.json(stats)
    
  } catch (error) {
    console.error('Failed to fetch dashboard statistics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    )
  }
}