import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';
import Job from './models/Job.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/kaamsetu';

/**
 * Seed script: Creates sample workers, companies, and jobs
 * Run: node src/seed.js
 *
 * Updated with:
 * - isInstantAvailable flags (varied)
 * - reliabilityScore, completionRate, cancellationRate, trustScore
 * - More realistic worker/company profiles
 */
const seedData = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Job.deleteMany({});
    console.log('Cleared existing data');

    const hashedPw = await bcrypt.hash('123456', 10);

    // --- Create Workers ---
    const workers = await User.insertMany([
      {
        name: 'Rajesh Kumar',
        phone: '9876543210',
        password: hashedPw,
        role: 'worker',
        rating: 4.5,
        ratingCount: 23,
        isVerified: true,
        location: { type: 'Point', coordinates: [72.8777, 19.0760], address: 'Andheri West', city: 'Mumbai' },
        workerProfile: {
          skills: ['construction', 'painter', 'helper'],
          experience: 8,
          preferredWorkType: 'daily',
          availability: 'today',
          isInstantAvailable: true,
          expectedWage: 700,
          bio: 'Experienced construction worker with 8 years in the industry.',
          completedJobs: 45,
          attendanceRate: 96,
          reliabilityScore: 94,
          completionRate: 97,
          cancellationRate: 3,
        },
      },
      {
        name: 'Suresh Yadav',
        phone: '9876543211',
        password: hashedPw,
        role: 'worker',
        rating: 4.2,
        ratingCount: 15,
        location: { type: 'Point', coordinates: [72.8356, 19.0176], address: 'Worli', city: 'Mumbai' },
        workerProfile: {
          skills: ['electrician', 'plumber'],
          experience: 5,
          preferredWorkType: 'both',
          availability: 'available',
          isInstantAvailable: false,
          expectedWage: 900,
          bio: 'Certified electrician and plumber.',
          completedJobs: 30,
          attendanceRate: 92,
          reliabilityScore: 88,
          completionRate: 90,
          cancellationRate: 8,
        },
      },
      {
        name: 'Amit Sharma',
        phone: '9876543212',
        password: hashedPw,
        role: 'worker',
        rating: 4.8,
        ratingCount: 40,
        isVerified: true,
        location: { type: 'Point', coordinates: [77.2090, 28.6139], address: 'Connaught Place', city: 'Delhi' },
        workerProfile: {
          skills: ['driver', 'helper'],
          experience: 12,
          preferredWorkType: 'daily',
          availability: 'today',
          isInstantAvailable: true,
          expectedWage: 800,
          bio: 'Professional driver with a clean record.',
          completedJobs: 120,
          attendanceRate: 99,
          reliabilityScore: 98,
          completionRate: 99,
          cancellationRate: 1,
        },
      },
      {
        name: 'Priya Devi',
        phone: '9876543213',
        password: hashedPw,
        role: 'worker',
        rating: 4.6,
        ratingCount: 18,
        location: { type: 'Point', coordinates: [77.5946, 12.9716], address: 'Koramangala', city: 'Bangalore' },
        workerProfile: {
          skills: ['cleaner', 'helper', 'cook'],
          experience: 3,
          preferredWorkType: 'both',
          availability: 'this_week',
          isInstantAvailable: false,
          expectedWage: 600,
          bio: 'Hardworking and reliable domestic worker.',
          completedJobs: 22,
          attendanceRate: 95,
          reliabilityScore: 91,
          completionRate: 95,
          cancellationRate: 5,
        },
      },
      {
        name: 'Ravi Patel',
        phone: '9876543214',
        password: hashedPw,
        role: 'worker',
        rating: 3.9,
        ratingCount: 8,
        location: { type: 'Point', coordinates: [72.5714, 23.0225], address: 'Navrangpura', city: 'Ahmedabad' },
        workerProfile: {
          skills: ['carpenter', 'welder', 'construction'],
          experience: 6,
          preferredWorkType: 'contract',
          availability: 'available',
          isInstantAvailable: false,
          expectedWage: 850,
          bio: 'Skilled carpenter and welder.',
          completedJobs: 18,
          attendanceRate: 88,
          reliabilityScore: 75,
          completionRate: 82,
          cancellationRate: 15,
        },
      },
      {
        name: 'Meena Kumari',
        phone: '9876543215',
        password: hashedPw,
        role: 'worker',
        rating: 4.7,
        ratingCount: 30,
        isVerified: true,
        location: { type: 'Point', coordinates: [72.8777, 19.1000], address: 'Goregaon', city: 'Mumbai' },
        workerProfile: {
          skills: ['painter', 'cleaner'],
          experience: 4,
          preferredWorkType: 'daily',
          availability: 'today',
          isInstantAvailable: true,
          expectedWage: 550,
          bio: 'Experienced painter specializing in interior work.',
          completedJobs: 55,
          attendanceRate: 97,
          reliabilityScore: 96,
          completionRate: 98,
          cancellationRate: 2,
        },
      },
      {
        name: 'Vikram Singh',
        phone: '9876543216',
        password: hashedPw,
        role: 'worker',
        rating: 4.1,
        ratingCount: 12,
        location: { type: 'Point', coordinates: [72.8900, 19.0800], address: 'Andheri East', city: 'Mumbai' },
        workerProfile: {
          skills: ['helper', 'driver', 'construction'],
          experience: 2,
          preferredWorkType: 'daily',
          availability: 'today',
          isInstantAvailable: true,
          expectedWage: 500,
          bio: 'Young and energetic. Ready for any daily work.',
          completedJobs: 14,
          attendanceRate: 93,
          reliabilityScore: 85,
          completionRate: 88,
          cancellationRate: 7,
        },
      },
      {
        name: 'Sunita Verma',
        phone: '9876543217',
        password: hashedPw,
        role: 'worker',
        rating: 4.4,
        ratingCount: 20,
        location: { type: 'Point', coordinates: [72.8650, 19.0650], address: 'Bandra', city: 'Mumbai' },
        workerProfile: {
          skills: ['cook', 'cleaner', 'helper'],
          experience: 7,
          preferredWorkType: 'both',
          availability: 'available',
          isInstantAvailable: false,
          expectedWage: 650,
          bio: 'Professional cook with experience in large-scale catering.',
          completedJobs: 38,
          attendanceRate: 94,
          reliabilityScore: 90,
          completionRate: 93,
          cancellationRate: 5,
        },
      },
    ]);

    console.log(`✅ Created ${workers.length} workers`);

    // --- Create Companies ---
    const companies = await User.insertMany([
      {
        name: 'BuildRight Construction',
        phone: '9900000001',
        password: hashedPw,
        role: 'company',
        rating: 4.3,
        ratingCount: 50,
        isVerified: true,
        location: { type: 'Point', coordinates: [72.8777, 19.0760], address: 'BKC', city: 'Mumbai' },
        companyProfile: {
          companyName: 'BuildRight Construction Pvt Ltd',
          businessType: 'Construction',
          description: 'Leading construction company in Mumbai with 15+ years of experience.',
          verified: true,
          totalJobsPosted: 34,
          totalWorkersHired: 128,
          trustScore: 95,
          paymentHistoryRate: 98,
        },
      },
      {
        name: 'CleanHome Services',
        phone: '9900000002',
        password: hashedPw,
        role: 'company',
        rating: 4.1,
        ratingCount: 25,
        location: { type: 'Point', coordinates: [77.2090, 28.6139], address: 'Nehru Place', city: 'Delhi' },
        companyProfile: {
          companyName: 'CleanHome Services',
          businessType: 'Facility Management',
          description: 'Professional cleaning and maintenance services across Delhi NCR.',
          verified: true,
          totalJobsPosted: 22,
          totalWorkersHired: 67,
          trustScore: 88,
          paymentHistoryRate: 92,
        },
      },
      {
        name: 'FastLogistics',
        phone: '9900000003',
        password: hashedPw,
        role: 'company',
        rating: 4.5,
        ratingCount: 35,
        isVerified: true,
        location: { type: 'Point', coordinates: [77.5946, 12.9716], address: 'Electronic City', city: 'Bangalore' },
        companyProfile: {
          companyName: 'FastLogistics India',
          businessType: 'Logistics & Transport',
          description: 'Pan-India logistics and delivery services.',
          verified: true,
          totalJobsPosted: 56,
          totalWorkersHired: 200,
          trustScore: 92,
          paymentHistoryRate: 96,
        },
      },
    ]);

    console.log(`✅ Created ${companies.length} companies`);

    // --- Create Jobs ---
    const jobs = await Job.insertMany([
      {
        title: 'Construction Workers Needed — Site A',
        description: 'Need 5 experienced construction workers for residential building project. Hard hats and safety gear provided.',
        company: companies[0]._id,
        workType: 'daily',
        pay: 700,
        payType: 'per_day',
        workersNeeded: 5,
        workersHired: 2,
        skills: ['construction', 'helper'],
        location: { type: 'Point', coordinates: [72.8777, 19.0760], address: 'BKC Phase 2', city: 'Mumbai' },
        startDate: new Date(),
        startTime: '07:00',
        duration: '10 hours',
        status: 'open',
        urgency: 'urgent',
        applicationsCount: 3,
      },
      {
        title: 'House Painter — Interior Work',
        description: 'Looking for experienced painters for a 3BHK flat interior painting. Must bring own tools.',
        company: companies[0]._id,
        workType: 'contract',
        pay: 15000,
        payType: 'fixed',
        workersNeeded: 2,
        skills: ['painter'],
        location: { type: 'Point', coordinates: [72.8356, 19.0176], address: 'Worli Sea Face', city: 'Mumbai' },
        startDate: new Date(Date.now() + 86400000),
        duration: '5 days',
        status: 'open',
        urgency: 'normal',
      },
      {
        title: 'Office Deep Cleaning',
        description: 'Deep cleaning needed for 5000 sq ft office space. Equipment provided. Lunch included.',
        company: companies[1]._id,
        workType: 'daily',
        pay: 600,
        payType: 'per_day',
        workersNeeded: 4,
        skills: ['cleaner', 'helper'],
        location: { type: 'Point', coordinates: [77.2090, 28.6139], address: 'Nehru Place', city: 'Delhi' },
        startDate: new Date(),
        startTime: '09:00',
        duration: '8 hours',
        status: 'open',
        urgency: 'urgent',
        applicationsCount: 1,
      },
      {
        title: 'Delivery Drivers — Urgent',
        description: 'Need delivery drivers with two-wheelers for same-day package delivery in Bangalore.',
        company: companies[2]._id,
        workType: 'instant',
        pay: 500,
        payType: 'per_day',
        workersNeeded: 10,
        workersHired: 4,
        skills: ['driver'],
        location: { type: 'Point', coordinates: [77.5946, 12.9716], address: 'Electronic City', city: 'Bangalore' },
        startDate: new Date(),
        startTime: '08:00',
        duration: '12 hours',
        status: 'open',
        urgency: 'urgent',
        applicationsCount: 6,
      },
      {
        title: 'Electrician for Office Wiring',
        description: 'Certified electrician needed for new office wiring project. Must have own tools and certification.',
        company: companies[1]._id,
        workType: 'contract',
        pay: 25000,
        payType: 'fixed',
        workersNeeded: 1,
        skills: ['electrician'],
        location: { type: 'Point', coordinates: [77.2310, 28.6280], address: 'Lajpat Nagar', city: 'Delhi' },
        startDate: new Date(Date.now() + 172800000),
        duration: '7 days',
        status: 'open',
        urgency: 'normal',
      },
      {
        title: 'Warehouse Helpers',
        description: 'Loading/unloading helpers needed for warehouse operations. Physical fitness required.',
        company: companies[2]._id,
        workType: 'daily',
        pay: 550,
        payType: 'per_day',
        workersNeeded: 8,
        workersHired: 3,
        skills: ['helper'],
        location: { type: 'Point', coordinates: [77.6100, 12.9550], address: 'Whitefield', city: 'Bangalore' },
        startDate: new Date(),
        startTime: '06:00',
        duration: '10 hours',
        status: 'open',
        urgency: 'normal',
        applicationsCount: 5,
      },
      {
        title: 'Plumber — Emergency Repair',
        description: 'Urgent plumber needed for pipe burst repair at residential complex.',
        company: companies[0]._id,
        workType: 'instant',
        pay: 1200,
        payType: 'per_day',
        workersNeeded: 1,
        skills: ['plumber'],
        location: { type: 'Point', coordinates: [72.8500, 19.0500], address: 'Bandra West', city: 'Mumbai' },
        startDate: new Date(),
        startTime: '10:00',
        duration: '4 hours',
        status: 'open',
        urgency: 'urgent',
      },
      {
        title: 'Welding Work — Factory Gate',
        description: 'Experienced welder needed for factory gate fabrication and installation.',
        company: companies[2]._id,
        workType: 'contract',
        pay: 18000,
        payType: 'fixed',
        workersNeeded: 2,
        skills: ['welder', 'carpenter'],
        location: { type: 'Point', coordinates: [72.5714, 23.0225], address: 'Naroda GIDC', city: 'Ahmedabad' },
        startDate: new Date(Date.now() + 259200000),
        duration: '4 days',
        status: 'open',
        urgency: 'normal',
      },
    ]);

    console.log(`✅ Created ${jobs.length} jobs`);
    console.log('\n📋 Demo Credentials:');
    console.log('   Worker: phone=9876543210, password=123456');
    console.log('   Company: phone=9900000001, password=123456');

    await mongoose.disconnect();
    console.log('\n✅ Seed complete! Disconnected from MongoDB.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedData();
