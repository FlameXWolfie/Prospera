// Seed resume data for the dashboard + resume library.
// Lives at module scope (computed once on import) so the relative
// `lastAppended` dates aren't recomputed during React render.

const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();

export const initialResumes = [
  {
    id: '1', role: 'Software Engineer', target: 'Senior Software Engineer',
    score: 92, status: 'Verified', lastAppended: daysAgo(2),
    summary: 'Software engineer with 5+ years of experience building scalable web applications and distributed systems. Passionate about clean code, system design, and solving real-world problems.',
    experience: [
      { company: 'Google', role: 'Senior Software Engineer', period: 'May 2021 – Present', bullets: ['Designed and built scalable microservices handling 10M+ requests/day', 'Improved system performance by 40% through caching and query optimization', 'Mentored 4 engineers and led code reviews'] },
      { company: 'Stripe', role: 'Software Engineer', period: 'Jun 2019 – Apr 2021', bullets: ['Built and maintained payment processing services used by millions of users', 'Implemented fraud detection system reducing false positives by 25%', 'Collaborated with cross-functional teams to ship reliable features'] }
    ],
    skills: ['System Design', 'Python', 'AWS', 'Redis', 'Kafka', 'Docker', 'PostgreSQL', 'REST APIs', 'Node.js', 'Kubernetes'],
    isActive: true,
  },
  {
    id: '2', role: 'Full Stack Developer', target: 'Full Stack Engineer',
    score: 87, status: 'Verified', lastAppended: daysAgo(5),
    summary: 'Full-stack developer with deep expertise in React, Node.js, and cloud infrastructure. Passionate about performance, accessibility, and clean architecture.',
    experience: [
      { company: 'Microsoft', role: 'Software Engineer II', period: '2021–Present', bullets: ['Built real-time collaboration features for Teams', 'Reduced API latency by 40% through caching layer'] },
    ],
    skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'AWS', 'Docker', 'GraphQL', 'CI/CD'],
    isActive: false,
  },
  {
    id: '3', role: 'Backend Developer', target: 'Senior Backend Engineer',
    score: 79, status: 'Draft - Pending Review', lastAppended: daysAgo(10),
    summary: 'Backend developer specializing in high-throughput APIs, microservices, and database optimization.',
    experience: [
      { company: 'Amazon', role: 'Backend Engineer', period: '2020–Present', bullets: ['Architected order processing pipeline handling 50K TPS', 'Led migration from monolith to microservices'] },
    ],
    skills: ['Java', 'Spring Boot', 'Kafka', 'MySQL', 'Redis', 'Docker', 'Kubernetes'],
    isActive: false,
  },
  {
    id: '4', role: 'Data Analyst', target: 'Senior Data Analyst',
    score: 76, status: 'Tailored', lastAppended: daysAgo(12),
    summary: 'Data analyst with expertise in SQL, Python, and business intelligence dashboards.',
    experience: [
      { company: 'Airbnb', role: 'Data Analyst', period: '2021–Present', bullets: ['Built dashboards tracking $2B in annual revenue', 'Reduced churn by 12% with predictive models'] },
    ],
    skills: ['SQL', 'Python', 'Tableau', 'Looker', 'BigQuery', 'dbt', 'Excel'],
    isActive: false,
  },
  {
    id: '5', role: 'Product Manager', target: 'Senior Product Manager',
    score: 84, status: 'Verified', lastAppended: daysAgo(3),
    summary: 'Product manager with 6+ years driving growth for B2B SaaS products. Strong background in user research, roadmap strategy, and cross-functional leadership.',
    experience: [
      { company: 'Salesforce', role: 'Senior Product Manager', period: '2022–Present', bullets: ['Launched 3 features used by 100K+ enterprise customers', 'Grew NPS by 18 points in 12 months'] },
      { company: 'HubSpot', role: 'Product Manager', period: '2019–2022', bullets: ['Owned the CRM pipeline feature from 0 to GA', 'Partnered with design and engineering for bi-weekly releases'] },
    ],
    skills: ['Roadmapping', 'User Research', 'Jira', 'A/B Testing', 'SQL', 'Figma', 'OKRs'],
    isActive: false,
  },
  {
    id: '6', role: 'Growth Product Manager', target: 'Growth PM',
    score: 74, status: 'Draft - Pending Review', lastAppended: daysAgo(15),
    summary: 'Growth-focused PM with experience in acquisition, activation, and retention experiments across consumer apps.',
    experience: [
      { company: 'Dropbox', role: 'Growth PM', period: '2021–Present', bullets: ['Ran 40+ growth experiments generating $3M ARR', 'Optimized onboarding flow, increasing activation by 22%'] },
    ],
    skills: ['Growth Hacking', 'Mixpanel', 'SQL', 'User Interviews', 'A/B Testing', 'Python'],
    isActive: false,
  },
  {
    id: '7', role: 'Marketing Manager', target: 'Head of Growth Marketing',
    score: 74, status: 'Draft - Pending Review', lastAppended: daysAgo(14),
    summary: 'Data-driven marketing manager with experience scaling B2B SaaS growth through content, SEO, and paid acquisition.',
    experience: [
      { company: 'HubSpot', role: 'Senior Marketing Manager', period: '2020–Present', bullets: ['Grew organic traffic 3x through SEO content strategy', 'Managed $500K annual paid budget'] },
    ],
    skills: ['SEO', 'Content Strategy', 'Google Ads', 'Analytics', 'HubSpot', 'Email Marketing', 'Copywriting'],
    isActive: false,
  },
  {
    id: '8', role: 'Growth Marketing Manager', target: 'VP Marketing',
    score: 72, status: 'Tailored', lastAppended: daysAgo(20),
    summary: 'Performance marketing specialist focused on paid social, influencer partnerships, and funnel optimization.',
    experience: [
      { company: 'Notion', role: 'Growth Marketing Manager', period: '2021–Present', bullets: ['Scaled paid social to $1M/mo spend with 3.2x ROAS', 'Launched influencer program with 50 creators'] },
    ],
    skills: ['Meta Ads', 'Google Ads', 'TikTok Ads', 'Analytics', 'Copywriting', 'CRO'],
    isActive: false,
  },
  {
    id: '9', role: 'Product Designer', target: 'Senior UX/UI Designer',
    score: 85, status: 'Verified', lastAppended: daysAgo(4),
    summary: 'Creative product designer with 5+ years building user-centred digital products. Skilled in Figma, design systems, and cross-functional collaboration.',
    experience: [
      { company: 'Google', role: 'Product Designer', period: '2022–Present', bullets: ['Led redesign of core search UI, improving engagement by 18%', 'Collaborated with PMs to define product specs'] },
      { company: 'Stripe', role: 'UI Designer', period: '2020–2022', bullets: ['Built component library used by 12 product teams', 'Ran usability testing sessions'] }
    ],
    skills: ['Figma', 'Prototyping', 'User Research', 'Design Systems', 'Sketch', 'Accessibility', 'Wireframing', 'A/B Testing'],
    isActive: false,
  },
  {
    id: '10', role: 'UI/UX Designer', target: 'Lead UX Designer',
    score: 80, status: 'Tailored', lastAppended: daysAgo(8),
    summary: 'UX designer passionate about research-driven design and creating inclusive digital experiences.',
    experience: [
      { company: 'Airbnb', role: 'UX Designer', period: '2021–Present', bullets: ['Redesigned host onboarding, increasing completion by 30%', 'Conducted 40+ user interviews to inform product strategy'] },
    ],
    skills: ['User Research', 'Wireframing', 'Figma', 'Prototyping', 'Usability Testing', 'Information Architecture'],
    isActive: false,
  },
];
