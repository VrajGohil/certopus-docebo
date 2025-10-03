import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const webhooks = await prisma.webhookLog.findMany({
      include: {
        doceboDomain: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100 // Limit to last 100 entries
    })

    // Transform the data to match our frontend interface
    const transformedWebhooks = webhooks.map((webhook: any) => ({
      id: webhook.id,
      messageId: webhook.messageId,
      event: webhook.event,
      status: webhook.status,
      domain: webhook.doceboDomain?.name,
      errorMessage: webhook.errorMessage,
      createdAt: webhook.createdAt.toISOString(),
      updatedAt: webhook.updatedAt.toISOString(),
      payload: webhook.payload
    }))

    return NextResponse.json({ 
      webhooks: transformedWebhooks 
    })
  } catch (error) {
    console.error('Error fetching webhook logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch webhook logs' },
      { status: 500 }
    )
  }
}