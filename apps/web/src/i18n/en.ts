import type { Dictionary } from './dictionary';

export const en: Dictionary = {
  meta: {
    title: 'BRX Solutions – back-end & AI engineer, Žilina',
    description:
      'Python and TypeScript engineer with 9 years in IT. Production RAG and LLM systems with evals and observability, back-ends and Palantir Foundry – as a contractor in your team or on a project.',
  },
  nav: {
    services: 'Services',
    stack: 'Stack',
    experience: 'Experience',
    projects: 'Case studies',
    own: 'Own projects',
    contact: 'Contact',
    cta: 'Free consultation',
    langLabel: 'Jazyk / Language',
    menuOpen: 'Menu',
    menuClose: 'Close',
  },
  hero: {
    eyebrow: 'back-end & AI engineer · Žilina · remote',
    title: 'AI & back-end\nin production.\nMeasurably.',
    sub: 'Python and TypeScript engineer with 9 years in IT. I build RAG systems, LLM pipelines and back-ends – with evals, tracing and a number behind every change. Most often as a contractor embedded in your team, long-term and remote. Fixed-scope projects too.',
    cta1: 'Book a call',
    cta2: 'See case studies',
    availability: 'Available from 12/2026',
    code: {
      focus: ['GenAI / RAG', 'evals', 'backend'],
      stack: ['Python', 'TypeScript', 'GCP'],
      remote: true,
    },
  },
  stats: [
    { value: '9+', label: 'years in IT, since 2017' },
    { value: '3', label: 'industries in production: payments, telecom networks, media' },
    { value: 'CH · NL · SK', label: 'clients in three countries, fully remote' },
    { value: '1', label: 'one person from design to operations: back-end, AI, infrastructure' },
  ],
  services: {
    title: 'What I can do for you',
    sub: 'From auditing an existing system to production deployment. No agency overhead.',
    featuredBadge: 'core specialisation',
    featured: {
      title: 'Production LLM systems you can measure',
      desc: 'RAG, agents and LLM pipelines connected to your data (pgvector, hybrid search), with tools (MCP, your APIs) and a channel to people. Every change ships with an eval suite, tracing and a number: latency, cost, output quality.',
      quote:
        'The emphasis is on what the model must not do: calculations and rules live in code, the model only where language is needed.',
      tags: ['RAG · pgvector', 'Evals · tracing', 'Claude Agent SDK · MCP', 'Gemini · Vertex AI'],
    },
    items: [
      {
        icon: 'api',
        title: 'Back-end & APIs',
        desc: 'Python and TypeScript services, REST APIs, PostgreSQL, multi-tenant auth. Observability and tests from day one.',
        tags: ['Fastify · Flask', 'Next.js', 'PostgreSQL'],
      },
      {
        icon: 'data',
        title: 'Data pipelines & automation',
        desc: 'Transforms over external APIs, scheduled builds, workflow orchestration – from network devices to newsrooms.',
        tags: ['Palantir Foundry', 'Netflix Conductor', 'PySpark'],
      },
      {
        icon: 'legacy',
        title: 'Legacy audit & modernisation',
        desc: 'I take over an ageing system: audit, plan, zero-downtime migration, a ledger of changes.',
        tags: ['SDK migrations', 'Rollback', 'Terraform'],
      },
      {
        icon: 'web',
        title: 'Websites & web applications',
        desc: 'From an informational one-page site like this one to a web application with login, database and API. Fast, accessible, with tests and deployment.',
        tags: ['Next.js · React', 'Tailwind', 'Cloudflare · Vercel'],
      },
    ],
  },
  stack: {
    title: 'Tools I work with',
    note: 'A production-proven stack from real projects. Also: Robot Framework, Postman, Firestore, Secret Manager, Cloud DLP, Pants, 1Password CLI.',
    fullstack:
      'I am a back-end engineer, but I do not stop at the API. In every project I also wrote the frontend – React, Lit, HTMX, Next.js server actions.\n\nFor a client this means one person delivers a whole feature from database to screen.',
    countLabel: (n) => `${n} ${n === 1 ? 'tool' : 'tools'}`,
    groups: [
      {
        name: 'Back-end',
        bar: '95%',
        items: [
          'Python',
          'TypeScript',
          'Node.js',
          'Fastify',
          'Flask · FastAPI',
          'Next.js',
          'PostgreSQL · AlloyDB',
          'SQLAlchemy · Zod',
        ],
      },
      {
        name: 'AI & data',
        bar: '88%',
        items: [
          'Gemini / Vertex AI',
          'Claude Agent SDK · MCP',
          'RAG · pgvector',
          'Palantir Foundry',
          'Netflix Conductor',
          'PySpark',
          'pandas',
        ],
      },
      {
        name: 'Frontend & quality',
        bar: '80%',
        items: [
          'React',
          'Lit',
          'HTMX',
          'Tailwind',
          'Vitest',
          'pytest',
          'Playwright',
          'OpenTelemetry',
        ],
      },
      {
        name: 'Cloud & DevOps',
        bar: '85%',
        items: [
          'GCP Cloud Run',
          'AWS',
          'Terraform',
          'Docker',
          'Kubernetes',
          'GitHub Actions',
          'GitLab CI',
          'Cloudflare Zero Trust',
        ],
      },
    ],
  },
  experience: {
    title: 'Experience',
    sub: 'Nine years in international teams – from testing payment terminals to generative AI in a newsroom.',
    cta: 'Request CV',
  },
  projects: {
    title: 'Problems I have solved',
    sub: 'Production systems I worked on. The number tells the outcome; how I solved it and what I took away is one click away.',
    more: 'How I solved it',
    less: 'Hide detail',
    lesson: 'What I took away',
    nda: 'Internal details and code are under NDA – happy to explain context and approach in person.',
  },
  own: {
    eyebrow: 'Own projects',
    title: 'What I build for myself',
    sub: 'Small tools that run in production and that I use every day – end-to-end on my own server.',
    more: 'Technical details',
    less: 'Hide details',
  },
  process: {
    eyebrow: 'How I work',
    title: 'Two ways to work together',
    modes: [
      {
        title: 'Contractor in your team',
        badge: 'preferred',
        desc: 'A member of your team on your backlog, with your processes and tools. Long-term, 3+ months, full-time or part-time, remote. Monthly invoicing through my company. This is how I work today.',
      },
      {
        title: 'Fixed-scope project',
        desc: 'Fixed scope from audit to handover – a new system, a modernisation, a website. Four steps below, no surprises.',
      },
    ],
    stepsTitle: 'A fixed-scope project in four steps',
    steps: [
      { no: '1', title: 'Discovery call', desc: 'A free 30 minutes. Goals, context, constraints.' },
      {
        no: '2',
        title: 'Audit & proposal',
        desc: 'For an existing system, audit first. Scope, architecture and price without surprises.',
      },
      {
        no: '3',
        title: 'Iterative delivery',
        desc: 'Spec before code, TDD, a demo every 1–2 weeks. Benchmark old vs. new.',
      },
      {
        no: '4',
        title: 'Launch & handover',
        desc: 'Infra via Terraform, rollback ready, runbooks. Optional support.',
      },
    ],
  },
  strengths: {
    eyebrow: 'Why me',
    title: 'What you get',
    sub: 'Observed on real projects, not copied from a job ad.',
    items: [
      {
        title: 'I take over legacy systems',
        desc: 'Audit, plan, rewrite – with a ledger of what left and why.',
      },
      {
        title: 'Measurable RAG performance tuning',
        desc: 'Serial LLM calls, candidate explosion, needless RPCs – fixed step by step, with numbers.',
      },
      {
        title: 'Foundry + GCP + LLM under one roof',
        desc: 'From source API to published article, no hand-offs.',
      },
      {
        title: 'Cross-team integrations',
        desc: 'I negotiate the contract, find and document the permission blocker.',
      },
      {
        title: 'Process discipline',
        desc: 'TDD, spec before code, runbooks, infra only via Terraform.',
      },
      {
        title: 'Production caution',
        desc: 'Image swap instead of :latest, rollback digest, migrations on dev first.',
      },
      {
        title: 'I fit into an existing team',
        desc: 'Unfamiliar codebase, code review, stand-ups, Scrum – I contribute from the first week, not just read.',
      },
      {
        title: 'Web from design to deployment',
        desc: 'A marketing site or a web app with sign-in and an API – fast, accessible, with tests, CI and hosting. This site is the sample.',
      },
      {
        title: 'Clear for stakeholders',
        desc: 'I explain a technical pipeline in plain terms – years as a Scrum Master.',
      },
      {
        title: 'AI-assisted development as a service',
        desc: 'Speed without losing quality – and I can set it up for your team too.',
      },
    ],
  },
  contact: {
    title: 'Need an extra engineer\nor someone for a project?',
    sub: 'Send me a few lines about your team or project. I reply within 24 hours with a proposed next step.',
    emailLabel: 'Or email me directly',
    form: {
      name: 'Name',
      email: 'Email',
      type: 'Project type',
      options: {
        team: 'Team augmentation / contractor',
        ai: 'AI agents / RAG / LLM',
        backend: 'Back-end, API or data pipeline',
        web: 'Website or web application',
        audit: 'Audit and modernisation of an existing system',
        cv: 'CV request',
      },
      message: 'Message',
      messagePlaceholder: 'A few lines about the team or project, goals and timeline.',
      cvPlaceholder: 'Please send me your CV. Context: …',
      submit: 'Send message',
      sending: 'Sending…',
      success: 'Thank you, your message is on its way. I reply within 24 hours.',
      error: 'The message could not be sent. Please email me directly.',
      note: 'By submitting you agree to the processing of your data for the purpose of a reply.',
      noteLink: 'Privacy policy',
    },
  },
  legal: { title: 'Privacy policy' },
  sent: {
    title: 'Message sent',
    body: 'Thank you. I reply within 24 hours with a proposed next step.',
    back: 'Back to home',
  },
  failed: {
    title: 'Message not sent',
    body: 'Something went wrong. Please email me directly.',
    back: 'Back to home',
  },
  footer: {
    built:
      'I designed, built and deployed this site myself – DNS, Cloudflare, hosting, with the help of AI agents. I work the same way on client projects.',
    rights: 'All rights reserved.',
  },
};
