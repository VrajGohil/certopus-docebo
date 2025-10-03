import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function setupSingleClient() {
  try {
    console.log('Setting up single client configuration...')

    // Check if domain already exists
    const existingDomain = await prisma.doceboDomain.findFirst()
    
    if (existingDomain) {
      console.log('Domain already exists:', existingDomain.name)
      return
    }

    // Create default domain from environment variables
    const doceboApiUrl = process.env.DOCEBO_API_URL
    const doceboUsername = process.env.DOCEBO_API_USERNAME
    const doceboPassword = process.env.DOCEBO_API_PASSWORD

    if (!doceboApiUrl || !doceboUsername || !doceboPassword) {
      throw new Error('Missing required environment variables: DOCEBO_API_URL, DOCEBO_API_USERNAME, DOCEBO_API_PASSWORD')
    }

    // Extract domain name from URL
    const domainName = doceboApiUrl.replace(/^https?:\/\//, '').replace(/\/.*$/, '')

    const domain = await prisma.doceboDomain.create({
      data: {
        name: domainName,
        apiUrl: doceboApiUrl,
        username: doceboUsername,
        password: doceboPassword, // Note: In production, this should be encrypted
        active: true
      }
    })

    console.log('Created domain:', domain.name)
    console.log('Single client setup completed successfully!')

  } catch (error) {
    console.error('Error setting up single client:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the setup
if (require.main === module) {
  setupSingleClient()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

export { setupSingleClient }