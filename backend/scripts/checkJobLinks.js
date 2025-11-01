const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function checkJobLinks() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB\n');

    const JobPost = mongoose.model('JobPost', new mongoose.Schema({}, { strict: false }), 'job_posts');

    const jobs = await JobPost.find({ status: 'published' })
      .select('jobTitle companyName applicationLink')
      .limit(5)
      .lean();

    console.log('Sample job posts with application links:\n');
    jobs.forEach((job, index) => {
      console.log(`${index + 1}. ${job.jobTitle} - ${job.companyName}`);
      console.log(`   Link: ${job.applicationLink || 'NO LINK'}\n`);
    });

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkJobLinks();
