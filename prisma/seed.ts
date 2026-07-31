import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Clean existing records (optional for re-seeding)
  await prisma.activityLog.deleteMany({});
  await prisma.coaching.deleteMany({});
  await prisma.dealPipeline.deleteMany({});
  await prisma.rentalAnalysis.deleteMany({});
  await prisma.flipAnalysis.deleteMany({});
  await prisma.propertyAnalysis.deleteMany({});
  await prisma.subscription.deleteMany({});
  await prisma.profile.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Create Demo Investor User
  const investor = await prisma.user.create({
    data: {
      clerkId: 'mock_clerk_investor_123',
      email: 'investor@propintel.com',
      name: 'Alex Investor',
      role: 'INVESTOR',
      profile: {
        create: {
          phone: '+1 (555) 019-2834',
          company: 'Apex Equity Partners',
          investorType: 'Fix & Flip / Buy & Hold',
        },
      },
      subscription: {
        create: {
          stripeCustomerId: 'cus_demo_investor',
          stripeSubscriptionId: 'sub_demo_investor_pro',
          plan: 'PRO',
          status: 'ACTIVE',
        },
      },
    },
  });

  // 3. Create Demo Admin User
  const admin = await prisma.user.create({
    data: {
      clerkId: 'mock_clerk_admin_456',
      email: 'admin@propintel.com',
      name: 'Sarah Admin',
      role: 'ADMIN',
      profile: {
        create: {
          phone: '+1 (555) 987-6543',
          company: 'PropIntel Corp',
          investorType: 'Platform Administrator',
        },
      },
      subscription: {
        create: {
          stripeCustomerId: 'cus_demo_admin',
          stripeSubscriptionId: 'sub_demo_admin_ent',
          plan: 'ENTERPRISE',
          status: 'ACTIVE',
        },
      },
    },
  });

  console.log(`👤 Created Users: ${investor.email} (INVESTOR), ${admin.email} (ADMIN)`);

  // 4. Seed Property Analyses for Investor
  await prisma.propertyAnalysis.createMany({
    data: [
      {
        userId: investor.id,
        address: '742 Evergreen Terrace',
        city: 'Springfield',
        state: 'IL',
        zip: '62704',
        purchasePrice: 250000,
        rehabCost: 35000,
        arv: 340000,
        rent: 2400,
        downPayment: 20,
        taxes: 3600,
        insurance: 1200,
        hoa: 50,
        vacancyRate: 5,
        maintenanceRate: 5,
        mortgageRate: 6.5,
        mortgageTerm: 30,
        cashFlow: 540.25,
        roi: 18.5,
        capRate: 8.2,
        dscr: 1.42,
        cashOnCash: 12.8,
      },
      {
        userId: investor.id,
        address: '1042 Ocean Drive',
        city: 'Miami',
        state: 'FL',
        zip: '33139',
        purchasePrice: 480000,
        rehabCost: 60000,
        arv: 620000,
        rent: 4200,
        downPayment: 25,
        taxes: 6500,
        insurance: 2400,
        hoa: 150,
        vacancyRate: 6,
        maintenanceRate: 5,
        mortgageRate: 6.8,
        mortgageTerm: 30,
        cashFlow: 780.00,
        roi: 15.2,
        capRate: 7.9,
        dscr: 1.35,
        cashOnCash: 10.4,
      },
    ],
  });

  // 5. Seed Flip Analyses
  await prisma.flipAnalysis.createMany({
    data: [
      {
        userId: investor.id,
        address: '456 Oak Street',
        purchasePrice: 180000,
        rehabCost: 45000,
        arv: 290000,
        financingCost: 7200,
        holdingCost: 3600,
        sellingCost: 17400,
        profit: 36800,
        roi: 16.2,
        mao: 158000,
      },
    ],
  });

  // 6. Seed CRM Deal Pipeline Leads
  await prisma.dealPipeline.createMany({
    data: [
      {
        userId: investor.id,
        propertyAddress: '124 Conch Street, Austin TX',
        sellerName: 'Robert Smith',
        sellerPhone: '+1 (555) 234-5678',
        sellerEmail: 'robert.smith@gmail.com',
        buyerName: 'Lone Star Investments',
        offerAmount: 210000,
        assignmentFee: 15000,
        notes: 'Seller motivated due to relocation. Roof needs minor repair.',
        stage: 'UNDER_CONTRACT',
      },
      {
        userId: investor.id,
        propertyAddress: '889 Pine Ridge Rd, Denver CO',
        sellerName: 'Emily Davis',
        sellerPhone: '+1 (555) 345-6789',
        sellerEmail: 'emily.davis@yahoo.com',
        offerAmount: 340000,
        assignmentFee: 20000,
        notes: 'Initial inspection completed. Sent purchase contract.',
        stage: 'OFFER_MADE',
      },
      {
        userId: investor.id,
        propertyAddress: '312 Maple Ave, Atlanta GA',
        sellerName: 'Marcus Johnson',
        sellerPhone: '+1 (555) 456-7890',
        notes: 'Cold call lead. Owner open to cash offer.',
        stage: 'LEAD',
      },
    ],
  });

  // 7. Seed Coaching Bookings
  await prisma.coaching.create({
    data: {
      userId: investor.id,
      bookingDate: new Date(Date.now() + 86400000 * 3), // 3 days in future
      status: 'CONFIRMED',
      meetingLink: 'https://meet.google.com/propintel-coaching-demo',
      paymentStatus: 'PAID',
    },
  });

  // 8. Seed Activity Logs
  await prisma.activityLog.createMany({
    data: [
      {
        userId: investor.id,
        action: 'LOGIN',
        details: 'User logged in successfully',
      },
      {
        userId: investor.id,
        action: 'CREATE_ANALYSIS',
        details: 'Created property analysis for 742 Evergreen Terrace',
      },
      {
        userId: investor.id,
        action: 'ADD_LEAD',
        details: 'Added CRM deal lead for 124 Conch Street',
      },
      {
        userId: admin.id,
        action: 'LOGIN',
        details: 'Admin session started',
      },
    ],
  });

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
