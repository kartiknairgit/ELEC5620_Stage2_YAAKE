const JobPost = require('../models/jobPostModel');

class JobPostService {
  static sanitizeList(value) {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter(Boolean);
    }

    if (typeof value === 'string') {
      return value
        .split(/[\n,]/)
        .map((item) => item.trim())
        .filter(Boolean);
    }

    return [];
  }

  static async createJobPost(payload, recruiterId) {
    const jobData = {
      recruiterId,
      jobTitle: payload.jobTitle,
      companyName: payload.companyName,
      department: payload.department,
      employmentType: payload.employmentType || 'Full-time',
      location: payload.location,
      salaryRange: payload.salaryRange,
      experienceLevel: payload.experienceLevel,
      yearsExperience: payload.yearsExperience,
      description: payload.description,
      responsibilities: this.sanitizeList(payload.responsibilities),
      requiredSkills: this.sanitizeList(payload.requiredSkills),
      tags: this.sanitizeList(payload.tags),
      applicationLink: payload.applicationLink,
      status: payload.status || 'published'
    };

    const analyticsSnapshot = this.buildAnalyticsSnapshot(jobData);
    jobData.analyticsSnapshot = analyticsSnapshot;

    const jobPost = await JobPost.create(jobData);
    return jobPost.toObject();
  }

  static buildAnalyticsSnapshot(jobData) {
    const frequency = {};

    JobPostService.sanitizeList(jobData.requiredSkills).forEach((skill) => {
      const key = skill.toLowerCase();
      frequency[key] = (frequency[key] || 0) + 1;
    });

    const topSkills = Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([skill, count]) => ({
        skill,
        count
      }));

    if (!topSkills.length) {
      return {
        topSkills: [],
        summary: 'No specific skills highlighted in this posting.'
      };
    }

    const summary = `Primary focus on ${topSkills
      .map((entry) => entry.skill)
      .join(', ')}. Consider targeting talent development around these capabilities.`;

    return {
      topSkills,
      summary
    };
  }

  static async listPublicPosts({ searchTerm, location, employmentType, page = 1, limit = 10 }) {
    const filter = { status: 'published' };

    if (searchTerm) {
      filter.$text = { $search: searchTerm };
    }

    if (location) {
      filter.location = new RegExp(location, 'i');
    }

    if (employmentType) {
      filter.employmentType = new RegExp(employmentType, 'i');
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [total, posts] = await Promise.all([
      JobPost.countDocuments(filter),
      JobPost.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean()
    ]);

    return {
      posts,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.max(1, Math.ceil(total / Number(limit)))
      }
    };
  }

  static async listRecruiterPosts(recruiterId) {
    const posts = await JobPost.find({ recruiterId })
      .sort({ createdAt: -1 })
      .lean();
    return posts;
  }

  static async getJobPostById(id) {
    return JobPost.findById(id).lean();
  }

  static async getCareerInsights({ lookbackDays = 30 }) {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - Number(lookbackDays));

    const posts = await JobPost.find({
      status: 'published',
      createdAt: { $gte: sinceDate }
    })
      .select('jobTitle requiredSkills tags employmentType location createdAt analyticsSnapshot')
      .lean();

    const skillFrequency = {};
    const roleFrequency = {};
    const locationFrequency = {};

    posts.forEach((post) => {
      JobPostService.sanitizeList(post.requiredSkills).forEach((skill) => {
        const key = skill.toLowerCase();
        skillFrequency[key] = (skillFrequency[key] || 0) + 1;
      });

      if (post.jobTitle) {
        const titleKey = post.jobTitle.toLowerCase();
        roleFrequency[titleKey] = (roleFrequency[titleKey] || 0) + 1;
      }

      if (post.location) {
        const locationKey = post.location.toLowerCase();
        locationFrequency[locationKey] = (locationFrequency[locationKey] || 0) + 1;
      }
    });

    const buildTopList = (map, limit = 5) =>
      Object.entries(map)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([value, count]) => ({ value, count }));

    const topSkills = buildTopList(skillFrequency, 10);
    const topRoles = buildTopList(roleFrequency, 6);
    const hotLocations = buildTopList(locationFrequency, 6);

    const summary = JobPostService.generateInsightSummary({
      totalPosts: posts.length,
      topSkills,
      topRoles,
      hotLocations,
      lookbackDays
    });

    return {
      totalPosts: posts.length,
      timeframeDays: Number(lookbackDays),
      topSkills,
      topRoles,
      hotLocations,
      summary
    };
  }

  static generateInsightSummary({ totalPosts, topSkills, topRoles, hotLocations, lookbackDays }) {
    if (!totalPosts) {
      return `No published postings in the last ${lookbackDays} days. Encourage recruiters to publish new roles to generate insights.`;
    }

    const topSkillNames = topSkills.slice(0, 3).map((item) => JobPostService.capitalize(item.value));
    const topRoleNames = topRoles.slice(0, 2).map((item) => JobPostService.titleCase(item.value));
    const locationNames = hotLocations.slice(0, 2).map((item) => JobPostService.titleCase(item.value));

    const segments = [
      `${totalPosts} published postings analysed from the last ${lookbackDays} days.`,
      topSkillNames.length
        ? `Skills in highest demand: ${topSkillNames.join(', ')}. Consider prioritising advanced content around these topics.`
        : null,
      topRoleNames.length
        ? `Most frequently advertised roles: ${topRoleNames.join(' & ')}.`
        : null,
      locationNames.length
        ? `Hiring hotspots observed in ${locationNames.join(' & ')}.`
        : null
    ].filter(Boolean);

    return segments.join(' ');
  }

  static capitalize(str) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
  }

  static titleCase(str) {
    return str
      ? str
          .split(' ')
          .map((segment) => JobPostService.capitalize(segment))
          .join(' ')
      : '';
  }
}

module.exports = JobPostService;

