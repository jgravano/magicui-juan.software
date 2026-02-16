export const MACHINE_CONTENT = {
  hero: {
    name: 'JUAN GRAVANO',
    instruction: 'PULL. OR LEAVE.',
    sticker: "I DON'T DO LINKEDIN CAROUSELS",
  },
  statement: {
    lines: [
      'Designing scalable systems',
      'with a strong focus on quality,',
      'reliability, and long-term value.',
    ],
    sticker: 'STOP TALKING.\nBUILD. BUILD. BUILD.',
  },
  projects: [
    {
      id: 'automation-platform',
      title: 'Automation Platform',
      category: 'FINTECH',
      label: 'PROJ-001',
      tag: 'FRAGILE: REAL MONEY',
      description:
        'An automation and testing platform for fintech systems that move real money. Focused on reliability, edge cases, and catching things before users notice.',
      accent: '#E16A2D',
    },
    {
      id: 'bender',
      title: 'Bender — AI Testing Assistant',
      category: 'AI',
      label: 'PROJ-002',
      tag: 'HANDLE WITH CARE',
      description:
        'An AI assistant focused on making test results understandable for humans. Less logs. Less guessing. More context when something breaks.',
      accent: '#E5D04F',
    },
    {
      id: 'quality-processes',
      title: 'Testing, Reliability & Feedback Loops',
      category: 'QUALITY',
      label: 'PROJ-003',
      tag: 'DO NOT SHIP UNTESTED',
      description:
        'Quality as an ongoing process, not a phase. Clear signals, early failures, and feedback you can actually act on.',
      accent: '#8C2F23',
    },
    {
      id: 'experiments',
      title: 'Experiments & Side Projects',
      category: 'MISC',
      label: 'PROJ-004',
      tag: 'VOLATILE',
      description:
        'Small systems and experiments where I explore ideas around design, tooling, and interaction. Mostly to learn. Sometimes to ship.',
      accent: '#3F5E4E',
    },
  ],
  skills: [
    {
      id: 'frontend',
      title: 'Frontend & Design',
      level: 0.8,
      label: 'DANGEROUS',
      description: 'React, TypeScript, CSS, UI systems, interaction design',
    },
    {
      id: 'quality',
      title: 'Quality Strategy',
      level: 0.95,
      label: 'OBSESSIVE',
      description: 'Test architecture, risk-based quality, coverage strategy',
    },
    {
      id: 'automation',
      title: 'Automation',
      level: 0.9,
      label: 'RELENTLESS',
      description: 'E2E, API, performance, CI/CD pipelines',
    },
    {
      id: 'fintech',
      title: 'Fintech APIs',
      level: 0.85,
      label: 'CAREFUL',
      description: 'Payment systems, ledger testing, compliance',
    },
    {
      id: 'tooling',
      title: 'Tooling & Systems',
      level: 0.88,
      label: 'BORING (GOOD)',
      description: 'Internal platforms, developer experience, CLI tools',
    },
    {
      id: 'leadership',
      title: 'Leadership',
      level: 0.75,
      label: 'RELUCTANT',
      description: 'Team building, process design, mentoring',
    },
    {
      id: 'opensource',
      title: 'Open Source',
      level: 0.7,
      label: 'GROWING',
      description: 'Contributing to and maintaining public projects',
    },
    {
      id: 'aiml',
      title: 'AI / ML',
      level: 0.65,
      label: 'CURIOUS',
      description: 'LLM integration, AI-assisted testing, prompt engineering',
    },
  ],
  contact: {
    message: "I DON'T TAKE EVERY PROJECT.\nI TAKE THE INTERESTING ONES.",
    links: [
      { label: 'LINKEDIN', href: 'https://linkedin.com', freq: '01' },
      { label: 'GITHUB', href: 'https://github.com', freq: '02' },
      { label: 'EMAIL', href: 'mailto:hello@example.com', freq: '03' },
    ],
  },
  footer: {
    copy: 'JUAN GRAVANO',
    year: '2026',
    location: 'BUENOS AIRES, ARGENTINA',
    attitude: 'DEAL WITH IT.',
  },
} as const;
