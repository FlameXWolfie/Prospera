// Overleaf-style example content. Picking a template in the gallery loads this
// into the draft so the user starts from a polished, realistic resume they edit
// (rather than a blank page). Draft-shaped.
export const SAMPLE_RESUME = {
  name: 'Jordan Avery',
  role: 'Senior Software Engineer',
  target: 'Staff Engineer',
  email: 'jordan.avery@email.com',
  phone: '(415) 555-0142',
  location: 'San Francisco, CA',
  link: 'linkedin.com/in/jordanavery',
  summary:
    'Senior software engineer with 7+ years building reliable, high-scale web platforms. Specializes in distributed systems, developer experience, and shipping product fast without breaking trust.',
  experience: [
    {
      company: 'Stripe',
      role: 'Senior Software Engineer',
      period: '2021 — Present',
      location: 'San Francisco, CA',
      bullets: [
        'Led the redesign of the payments ledger service, cutting reconciliation latency 38% while supporting 12M+ daily transactions.',
        'Mentored 5 engineers and introduced a review rubric that reduced production incidents 27%.',
        'Drove migration to an event-driven architecture across 9 services with zero customer downtime.',
      ],
    },
    {
      company: 'Airbnb',
      role: 'Software Engineer',
      period: '2018 — 2021',
      location: 'Remote',
      bullets: [
        'Built the host onboarding API powering 2M+ new listings annually.',
        'Cut p95 search latency from 480ms to 210ms via caching and query optimization.',
        'Shipped an experimentation framework adopted by 15 product teams.',
      ],
    },
  ],
  education: [
    { school: 'University of California, Berkeley', degree: 'B.S. Computer Science', period: '2014 — 2018' },
  ],
  projects: [
    {
      name: 'OpenLedger',
      link: 'github.com/javery/openledger',
      bullets: ['Open-source double-entry ledger written in Rust — 3.2k GitHub stars.'],
    },
  ],
  skills: [
    'TypeScript', 'React', 'Node.js', 'Go', 'PostgreSQL', 'Kafka',
    'AWS', 'Docker', 'Kubernetes', 'System Design', 'GraphQL', 'Redis',
  ],
  roleId: 'swe',
};
