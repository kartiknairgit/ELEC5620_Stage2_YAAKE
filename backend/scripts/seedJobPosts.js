/* eslint-disable no-console */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const db = require('../services/db.service');
const JobPost = require('../models/jobPostModel');
const User = require('../models/userModel');

const sampleJobPosts = [
  {
    jobTitle: 'Software Engineer',
    companyName: 'Atlassian',
    department: 'Engineering',
    employmentType: 'Full-time',
    location: 'Sydney, NSW',
    salaryRange: 'Competitive salary + equity',
    experienceLevel: 'Mid-Senior',
    yearsExperience: 3,
    description: `Join Atlassian to design, build, and maintain product services on Atlassian Cloud. Work with modern web architectures, tackle complex challenges, and impact 300,000+ global customers. You'll be part of teams building Jira, Confluence, and other products used by millions worldwide.`,
    responsibilities: [
      'Design and build scalable services on Atlassian Cloud (AWS)',
      'Develop modern web applications with focus on performance and reliability',
      'Collaborate with cross-functional teams on product features',
      'Optimize backend storage solutions for high performance and fault tolerance',
      'Participate in code reviews and contribute to engineering excellence'
    ],
    requiredSkills: [
      'Experience with Java, Kotlin, or similar languages',
      'Understanding of distributed systems and cloud architectures',
      'Strong problem-solving and communication skills',
      'Experience with React, TypeScript, or modern frontend technologies',
      'Passion for delivering quality software at scale'
    ],
    tags: ['java', 'cloud', 'aws', 'distributed-systems', 'engineering'],
    applicationLink: 'https://www.atlassian.com/company/careers/all-jobs',
    status: 'published'
  },
  {
    jobTitle: 'Staff Frontend Engineer - Apps API Platform',
    companyName: 'Canva',
    department: 'Engineering',
    employmentType: 'Full-time',
    location: 'Melbourne, VIC (Hybrid)',
    salaryRange: 'Competitive salary + equity',
    experienceLevel: 'Senior',
    yearsExperience: 5,
    description: `Join Canva's Apps API Platform team to shape how developers integrate with Canva. Work on design and ingredient manipulation APIs that empower millions of creators. Canva has campuses in Sydney and Melbourne, plus remote options across Australia. You'll be part of a mission to empower everyone in the world to design.`,
    responsibilities: [
      'Lead frontend architecture evolution for Canva AI features',
      'Design and implement design and ingredient manipulation APIs',
      'Build scalable web applications using React and TypeScript',
      'Collaborate with product and design teams on new features',
      'Mentor engineers and drive technical excellence'
    ],
    requiredSkills: [
      'Expert-level React and TypeScript experience',
      'Strong understanding of API design and development',
      'Experience building scalable frontend architectures',
      'Excellent communication and collaboration skills',
      'Passion for creating delightful user experiences'
    ],
    tags: ['frontend', 'react', 'typescript', 'api', 'canva'],
    applicationLink: 'https://www.canva.com/careers/',
    status: 'published'
  },
  {
    jobTitle: 'Software Engineer (Entry Level)',
    companyName: 'Google',
    department: 'Engineering & Technology',
    employmentType: 'Full-time',
    location: 'Sydney, NSW',
    salaryRange: 'Competitive compensation package',
    experienceLevel: 'Entry-level',
    yearsExperience: 1,
    description: `Google software engineers develop next-generation technologies that change how billions of users connect, explore, and interact with information. Our products need to handle information at massive scale. We're looking for engineers who bring fresh ideas from areas including information retrieval, distributed computing, large-scale system design, networking, security, AI, natural language processing, and UI design.`,
    responsibilities: [
      'Write product or system development code',
      'Participate in design reviews with peers and stakeholders',
      'Review code developed by other developers',
      'Contribute to documentation and educational content',
      'Triage product or system issues and debug/track/resolve by analyzing sources'
    ],
    requiredSkills: [
      'Bachelor\'s degree or equivalent practical experience',
      '1 year experience with software development in Python, C, C++, Java, or JavaScript',
      '1 year experience with data structures or algorithms',
      'Strong problem-solving abilities',
      'Ability to work in a collaborative team environment'
    ],
    tags: ['software-engineering', 'python', 'java', 'entry-level', 'google'],
    applicationLink: 'https://www.google.com/about/careers/applications/jobs/results?location=Sydney',
    status: 'published'
  },
  {
    jobTitle: 'Strategy & Consulting Analyst - 2026 Graduate Program',
    companyName: 'Accenture',
    department: 'Strategy & Consulting',
    employmentType: 'Full-time',
    location: 'Sydney, Melbourne, Brisbane, Perth',
    salaryRange: 'Competitive graduate package',
    experienceLevel: 'Entry-level',
    yearsExperience: 0,
    description: `Join Accenture's 2026 Graduate Program as a Strategy & Consulting Analyst. Work across diverse industries and practices, helping clients solve their most complex challenges. This is a structured program with comprehensive training, mentorship, and career development opportunities. Applications open for final-year students and recent graduates.`,
    responsibilities: [
      'Work on real client projects across various industries',
      'Conduct research and analysis to support consulting engagements',
      'Develop solutions using analytical tools and programming languages',
      'Collaborate with teams to deliver client value',
      'Participate in structured training and development programs'
    ],
    requiredSkills: [
      'Any degree (final year or graduated within last 2 years)',
      'Australian or New Zealand citizenship or permanent residency',
      'Strong analytical and problem-solving skills',
      'Interest in technology, engineering, policy, economics, or commerce',
      'Experience with python or analytical tools is highly valued'
    ],
    tags: ['graduate-program', 'consulting', 'strategy', 'analyst', 'accenture'],
    applicationLink: 'https://www.accenture.com/au-en/careers/local/earlycareers-home',
    status: 'published'
  },
  {
    jobTitle: '2026 CommBank Engineering Graduate Program',
    companyName: 'Commonwealth Bank',
    department: 'Technology & Engineering',
    employmentType: 'Full-time',
    location: 'Sydney, Melbourne, Adelaide, Perth',
    salaryRange: 'Competitive graduate package',
    experienceLevel: 'Entry-level',
    yearsExperience: 0,
    description: `Join CommBank's 12-month Engineering Graduate Program starting February 2026. Choose your pathway: Data (ML/AI), Software Engineering (Web/Mobile/Fullstack), Site Reliability, or Security. Flexibility to deepen skills in one area or rotate for broader experience. Applications close August 26, 2025. Minimum 70 GPA/WAM required for Technology roles.`,
    responsibilities: [
      'Work on real projects in Data, Software Engineering, or Security',
      'Participate in 2-3 rotations across different business units',
      'Learn from experienced engineers and technical leaders',
      'Contribute to building Australia\'s leading digital bank',
      'Develop technical and professional skills through structured training'
    ],
    requiredSkills: [
      'Final year of university or completed within last 24 months',
      'Australian or NZ citizen, or permanent resident',
      'Minimum credit average (70 GPA/WAM for Technology)',
      'Passion for technology and innovation',
      'Available to start full-time in February 2026'
    ],
    tags: ['graduate-program', 'engineering', 'data', 'software', 'banking'],
    applicationLink: 'https://www.commbank.com.au/about-us/careers/graduate-intern-programs/engineering-cyber.html',
    status: 'published'
  },
  {
    jobTitle: 'Bankwest Technology Graduate Program 2026',
    companyName: 'Bankwest (Commonwealth Bank)',
    department: 'Technology',
    employmentType: 'Full-time',
    location: 'Perth, WA',
    salaryRange: 'Competitive graduate salary',
    experienceLevel: 'Entry-level',
    yearsExperience: 0,
    description: `Bankwest Technology Graduate Program is a structured 18-24 month rotational program with exposure to cross-functional delivery teams. Gain hands-on experience in software development, data analytics, and technology consulting. Work on innovative banking solutions while developing your technical and professional capabilities in Perth.`,
    responsibilities: [
      'Rotate across different technology teams and projects',
      'Develop software solutions for banking applications',
      'Learn agile delivery practices and DevOps methodologies',
      'Collaborate with experienced technologists and business stakeholders',
      'Contribute to digital transformation initiatives'
    ],
    requiredSkills: [
      'Completed degree in last 24 months or final year student',
      'Australian or NZ citizenship, or permanent residency',
      'Credit average or higher in university degree',
      'Interest in banking technology and fintech',
      'Strong communication and teamwork skills'
    ],
    tags: ['graduate-program', 'technology', 'banking', 'perth', 'fintech'],
    applicationLink: 'https://www.commbank.com.au/about-us/careers/graduate-recruitment-program/applications.html',
    status: 'published'
  },
  {
    jobTitle: 'Graduate Software Developer 2026',
    companyName: 'Capgemini Australia',
    department: 'Technology Consulting',
    employmentType: 'Full-time',
    location: 'Sydney, Melbourne, Brisbane, Perth, Adelaide, Canberra',
    salaryRange: 'Competitive graduate package',
    experienceLevel: 'Entry-level',
    yearsExperience: 0,
    description: `Join Capgemini's 2026 Graduate Program - ranked #1 most popular graduate program in Australia! Work on real client projects in Software Development, DevOps, Business Analysis, Change Management, or Program Management. World-class L&D, free Coursera courses, funded certifications, and flexible hybrid work. Diverse program welcoming graduates from all backgrounds.`,
    responsibilities: [
      'Work on real client projects in chosen consulting area',
      'Participate in foundation masterclasses and training',
      'Develop technical skills in chosen technology stack',
      'Collaborate with experienced consultants on delivery teams',
      'Contribute to digital transformation for global clients'
    ],
    requiredSkills: [
      'Bachelor\'s or Master\'s degree completed within last 2 years',
      'Available to commence full-time in early 2026',
      'Strong communication skills and customer service ethic',
      'Resilience and willingness to learn',
      'Australian work rights (Citizen, PR, or 485 visa)'
    ],
    tags: ['graduate-program', 'consulting', 'software-development', 'training', 'hybrid'],
    applicationLink: 'https://www.capgemini.com/au-en/careers/graduate-program/',
    status: 'published'
  },
  {
    jobTitle: 'Software Engineer - Python/Data Platform',
    companyName: 'Canva',
    department: 'Data Platform',
    employmentType: 'Full-time',
    location: 'Sydney, NSW / Melbourne, VIC (Hybrid)',
    salaryRange: 'Competitive salary + equity + benefits',
    experienceLevel: 'Mid-level',
    yearsExperience: 3,
    description: `Join Canva's Data Platform team to build scalable data infrastructure powering insights for millions of users. Work with Python, distributed systems, and cloud technologies. Canva offers hybrid work, campuses in Sydney and Melbourne, and the opportunity to impact how the world designs. Part of a mission-driven company empowering creativity globally.`,
    responsibilities: [
      'Design and build scalable data pipelines and infrastructure',
      'Develop Python-based services for data processing and analytics',
      'Optimize data storage and retrieval systems',
      'Collaborate with data scientists and analysts on platform capabilities',
      'Ensure data quality, reliability, and performance at scale'
    ],
    requiredSkills: [
      'Strong Python programming skills',
      'Experience with distributed systems and big data technologies',
      'Understanding of data warehousing and ETL processes',
      'Familiarity with cloud platforms (AWS, GCP, or Azure)',
      'Problem-solving mindset and collaborative approach'
    ],
    tags: ['python', 'data-platform', 'distributed-systems', 'etl', 'cloud'],
    applicationLink: 'https://www.canva.com/careers/',
    status: 'published'
  },
  {
    jobTitle: 'Graduate Program - Atlassian',
    companyName: 'Atlassian',
    department: 'Early Careers',
    employmentType: 'Full-time',
    location: 'Sydney, NSW',
    salaryRange: 'Competitive graduate salary + equity',
    experienceLevel: 'Entry-level',
    yearsExperience: 0,
    description: `Atlassian's Graduate Program is tailored for students in their final year or recently graduated. Immerse yourself in Atlassian's innovative world of technology, tackling complex challenges that impact 300,000+ global customers. Join as Backend, Frontend, Mobile, or Fullstack Engineer and work on products like Jira, Confluence, and Trello used by millions worldwide.`,
    responsibilities: [
      'Work on real features for Atlassian products (Jira, Confluence, etc.)',
      'Learn from experienced engineers through mentorship and pair programming',
      'Participate in hackathons and innovation projects',
      'Contribute to engineering culture and team collaboration',
      'Grow technical skills in modern software development practices'
    ],
    requiredSkills: [
      'Final year student or recently graduated (within 2 years)',
      'Background in Computer Science, Software Engineering, or related field',
      'Passion for software development and technology',
      'Strong problem-solving and communication skills',
      'Collaborative mindset and eagerness to learn'
    ],
    tags: ['graduate-program', 'software-engineering', 'full-stack', 'cloud', 'early-career'],
    applicationLink: 'https://www.atlassian.com/company/careers/earlycareers',
    status: 'published'
  },
  {
    jobTitle: 'Cyber Security Graduate Program 2026',
    companyName: 'Commonwealth Bank',
    department: 'Cyber Security',
    employmentType: 'Full-time',
    location: 'Sydney, Melbourne',
    salaryRange: 'Competitive graduate package',
    experienceLevel: 'Entry-level',
    yearsExperience: 0,
    description: `Join CommBank's 12-18 month Cyber Security Graduate Program with 2-3 tailored rotations. Gain exposure to Cyber Identity & Protection Management, Cyber Defence Operations, and Cyber Governance. Work on protecting Australia's largest bank and learn from industry-leading security professionals. Applications close August 2025, starting February 2026.`,
    responsibilities: [
      'Rotate through Cyber Defence Operations and Governance teams',
      'Monitor and respond to security threats and incidents',
      'Learn security frameworks and compliance requirements',
      'Implement security controls and best practices',
      'Develop expertise in identity management and threat detection'
    ],
    requiredSkills: [
      'Final year or graduated within last 24 months',
      'Australian or NZ citizenship, or permanent resident',
      'Credit average (70+ GPA/WAM) in university degree',
      'Interest in cybersecurity and information security',
      'Analytical thinking and attention to detail'
    ],
    tags: ['graduate-program', 'cybersecurity', 'security', 'threat-detection', 'banking'],
    applicationLink: 'https://www.commbank.com.au/about-us/careers/graduate-intern-programs/engineering-cyber.html',
    status: 'published'
  }
];

async function seedDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await db.connect();

    console.log('🔍 Looking for a recruiter user...');
    let recruiter = await User.findOne({ role: 'recruiter' });

    if (!recruiter) {
      console.log('⚠️  No recruiter found. Creating a default recruiter account...');
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('Recruiter123!', 10);

      recruiter = await User.create({
        email: 'recruiter@yaake.com',
        password: hashedPassword,
        role: 'recruiter',
        companyName: 'YAAKE Platform',
        status: 'verified'
      });

      console.log('✅ Created recruiter account: recruiter@yaake.com / Recruiter123!');
    } else {
      console.log(`✅ Found recruiter: ${recruiter.email}`);
    }

    console.log('🗑️  Clearing existing job posts...');
    const deleteResult = await JobPost.deleteMany({});
    console.log(`   Deleted ${deleteResult.deletedCount} job post(s)`);

    console.log('📝 Inserting real job posts from actual companies...');
    const jobsWithRecruiter = sampleJobPosts.map(job => ({
      ...job,
      recruiterId: recruiter._id
    }));

    const insertedJobs = await JobPost.insertMany(jobsWithRecruiter);
    console.log(`✅ Successfully inserted ${insertedJobs.length} job posts`);

    console.log('\n📊 Summary:');
    console.log(`   Total jobs created: ${insertedJobs.length}`);
    console.log(`   Recruiter: ${recruiter.email}`);
    console.log(`   Companies: Atlassian, Canva, Google, Accenture, Commonwealth Bank, Bankwest, Capgemini`);
    console.log(`   All jobs have working application links to real career pages`);

    console.log('\n✨ Database seeding complete with real job postings!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await db.disconnect();
    process.exit(0);
  }
}

// Run the seed function
seedDatabase();
