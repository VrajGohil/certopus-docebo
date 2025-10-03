import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get counts for different entities
    const [
      domainsCount,
      courseMappingsCount,
      certificatesCount,
      recentWebhooksCount
    ] = await Promise.all([
      prisma.doceboDomain.count({
        where: { active: true }
      }),
      prisma.courseMapping.count({
        where: { active: true }
      }),
      prisma.certificate.count(),
      prisma.webhookLog.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      })
    ])

    // Get certificate status breakdown
    const certificatesByStatus = await prisma.certificate.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    })

    // Transform certificate status data
    const statusBreakdown = {
      SUCCESS: 0,
      FAILED: 0,
      PENDING: 0,
      GENERATING: 0
    }

    certificatesByStatus.forEach((item: any) => {
      if (item.status in statusBreakdown) {
        statusBreakdown[item.status as keyof typeof statusBreakdown] = item._count.status
      }
    })

    const stats = {
      domains: domainsCount,
      courseMappings: courseMappingsCount,
      certificates: certificatesCount,
      recentWebhooks: recentWebhooksCount,
      certificatesByStatus: statusBreakdown
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    )
  }
}