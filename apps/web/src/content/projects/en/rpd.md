---
title: 'Automating Remote PHY device roll-out in a national network'
context: 'FRINX / Elisa Polystar · national cable operator (NL)'
year: '2022 – 2025'
metric: 'minutes'
metricLabel: 'instead of hours per device'
problem: 'Thousands of devices in a cable network – each to be provisioned, configured and verified. By hand: hours, errors, no audit trail.'
solution: 'Python workflows and workers on FRINX Machine (Workflow Manager on Netflix Conductor, UniConfig, PostgreSQL-backed state): data load, payload, device API calls via UniConfig and REST, verification, rollback on failure. Thousand-line response processing, container images and test environments (Docker, Kubernetes), CI/CD ownership (GitHub Actions, GitLab CI).'
result: 'A repeatable, auditable process with rollback – the "minutes instead of hours" effect is stated publicly by FRINX.'
lesson: 'A production network taught me rollback as the first feature, not the last. With thousands of devices every edge case shows up. The workflow engine (Conductor) and owning CI/CD are the foundation I build LLM pipelines on today.'
tags: ['Python', 'Netflix Conductor', 'UniConfig', 'Kubernetes']
order: 4
---
