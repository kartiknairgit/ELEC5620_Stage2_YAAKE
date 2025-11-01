/* eslint-disable no-console */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const db = require('../services/db.service');
const Course = require('../models/courseModel');

const sampleCourses = [
  {
    title: 'React Fundamentals',
    provider: 'Coursera',
    signupLink: 'https://www.coursera.org/learn/react',
    description:
      'Learn React, JSX, components, state, hooks, and modern JavaScript. Covers HTML, CSS, and building responsive UIs with Tailwind and Redux basics.'
  },
  {
    title: 'Advanced React with Redux',
    provider: 'Udemy',
    signupLink: 'https://www.udemy.com/course/react-redux/',
    description:
      'Advanced patterns, Redux Toolkit, performance, testing with Jest and React Testing Library, and Next.js fundamentals.'
  },
  {
    title: 'Node.js, Express, and MongoDB',
    provider: 'Udemy',
    signupLink: 'https://www.udemy.com/course/nodejs-express-mongodb/',
    description:
      'Build REST APIs with Node.js, Express, MongoDB, Mongoose, authentication with JWT, and production best practices.'
  },
  {
    title: 'Docker for Developers',
    provider: 'Pluralsight',
    signupLink: 'https://www.pluralsight.com/courses/docker-developers',
    description:
      'Containerize apps, write Dockerfiles, manage images, run containers, networks, and volumes. CI/CD pipelines integration.'
  },
  {
    title: 'Kubernetes Hands-On',
    provider: 'Udemy',
    signupLink: 'https://www.udemy.com/course/kubernetes-hands-on/',
    description:
      'K8s fundamentals: pods, deployments, services, Ingress, config maps, secrets, Helm. Covers cloud deployments on AWS and GCP.'
  },
  {
    title: 'AWS Cloud Practitioner Essentials',
    provider: 'AWS Skill Builder',
    signupLink: 'https://skillbuilder.aws/',
    description:
      'Core AWS services: EC2, S3, RDS, IAM, VPC. Cloud concepts, security, pricing, and best practices for cloud architectures.'
  },
  {
    title: 'SQL Fundamentals',
    provider: 'Khan Academy',
    signupLink: 'https://www.khanacademy.org/computing/computer-programming/sql',
    description:
      'Queries, joins, aggregations, indexes, relational modeling. Work with PostgreSQL and MySQL for real-world data problems.'
  },
  {
    title: 'Python for Data Analysis',
    provider: 'Coursera',
    signupLink: 'https://www.coursera.org/specializations/data-science-python',
    description:
      'Python, pandas, NumPy, data wrangling, visualization, and practical data analysis workflows. Includes Jupyter and testing.'
  },
  {
    title: 'CI/CD with GitHub Actions',
    provider: 'Udemy',
    signupLink: 'https://www.udemy.com/course/github-actions-ci-cd/',
    description:
      'Build and deploy pipelines, workflows, testing with Jest and Cypress, Docker builds, and multi-environment releases.'
  },
  {
    title: 'Linux Command Line Basics',
    provider: 'Coursera',
    signupLink: 'https://www.coursera.org/learn/linux',
    description:
      'Shell navigation, file system, permissions, processes, bash scripting, and tooling for developers on Linux.'
  },
  {
    title: 'TypeScript for JavaScript Developers',
    provider: 'Udemy',
    signupLink: 'https://www.udemy.com/course/typescript-the-complete-developers-guide/',
    description:
      'Types, generics, interfaces, classes, advanced typing patterns. Integrate with React, Node, and build safer applications.'
  },
  {
    title: 'RESTful APIs with Node.js',
    provider: 'Pluralsight',
    signupLink: 'https://www.pluralsight.com/courses/nodejs-restful-services',
    description:
      'Designing and building REST APIs, validation, authentication, testing, and performance considerations with Express.'
  },
  {
    title: 'GraphQL Basics',
    provider: 'Apollo GraphQL',
    signupLink: 'https://www.apollographql.com/tutorials/',
    description:
      'Schemas, resolvers, queries, mutations, and integrating GraphQL with Node and React clients.'
  },
  {
    title: 'Spring Boot Microservices',
    provider: 'Udemy',
    signupLink: 'https://www.udemy.com/course/microservices-with-spring-boot-and-spring-cloud/',
    description:
      'Java, Spring Boot, REST, security, Docker, Kubernetes, and cloud deployments with patterns for resilience.'
  },
  {
    title: 'Data Structures and Algorithms in JavaScript',
    provider: 'Udemy',
    signupLink: 'https://www.udemy.com/course/js-algorithms-and-data-structures-masterclass/',
    description:
      'Arrays, linked lists, trees, graphs, sorting, searching, time complexity, and problem-solving patterns.'
  },
  {
    title: 'Testing Web Apps with Cypress',
    provider: 'Cypress Academy',
    signupLink: 'https://learn.cypress.io/',
    description:
      'E2E testing, component testing, CI integration, flake reduction, and best practices for modern web testing.'
  },
  {
    title: 'Terraform on AWS',
    provider: 'HashiCorp Learn',
    signupLink: 'https://developer.hashicorp.com/terraform/tutorials',
    description:
      'Infrastructure as Code, modules, state, workspaces, and deploying AWS infrastructure with Terraform.'
  },
  {
    title: 'Ansible Automation Basics',
    provider: 'Red Hat',
    signupLink: 'https://www.redhat.com/en/services/training/do007-ansible-automation-technical-overview',
    description:
      'Automate configuration management, provisioning, and deployments with Ansible playbooks and roles.'
  },
  {
    title: 'Agile and Scrum Foundations',
    provider: 'Coursera',
    signupLink: 'https://www.coursera.org/specializations/agile-development',
    description:
      'Agile principles, Scrum ceremonies, backlog management, team collaboration, and delivery patterns.'
  },
  {
    title: 'Communication and Leadership for Engineers',
    provider: 'edX',
    signupLink: 'https://www.edx.org/',
    description:
      'Professional communication, leadership, stakeholder management, conflict resolution, and presentation skills.'
  }
];

async function upsertCourse(sample) {
  const existing = await Course.findOne({ title: sample.title, provider: sample.provider }).lean().exec();
  if (existing) return null;
  const created = new Course({ ...sample, createdBy: null });
  await created.save();
  return created;
}

async function main() {
  try {
    if (!process.env.MONGO_URI || !process.env.MONGO_URI.trim()) {
      console.error('MONGO_URI is not set. Please define it in backend/.env');
      process.exit(1);
    }

    await db.connect();
    console.log('Connected to MongoDB');

    const beforeCount = await Course.countDocuments();
    console.log(`Existing courses: ${beforeCount}`);

    let createdCount = 0;
    for (const sample of sampleCourses) {
      const result = await upsertCourse(sample);
      if (result) createdCount += 1;
    }

    const afterCount = await Course.countDocuments();
    console.log(`Seed complete. Added ${createdCount} new courses. Total now: ${afterCount}`);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  } finally {
    try {
      await db.disconnect();
    } catch {}
  }
}

main();


