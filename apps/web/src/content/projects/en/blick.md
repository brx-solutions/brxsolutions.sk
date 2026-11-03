---
title: 'AI search for a news outlet – rescuing and modernising a RAG chatbot'
context: 'Media group · online news outlet'
year: '2025'
metric: '3.5 min → 20 s'
metricLabel: 'response time of the slowest RAG query'
problem: 'A 2.5-year-old Python RAG system on GCP: the slowest query took minutes and the code depended on an SDK facing removal.'
solution: 'Step-by-step performance tuning (parallel relevancy checks, circuit breaker, timeout and retry tuning, structured logging), migration to the Google Gen AI SDK before the deadline, ingestion migration plan for the new CMS event system. Then a rewrite of all 5 services into a Node.js/TypeScript monorepo (Fastify, Zod, Vitest, OpenTelemetry) with 1:1 parity and a ledger of removed code; deployed to GCP via GitHub Actions + Workload Identity Federation.'
result: 'Migration done before the SDK shutdown; a modern stack with observability in production.'
tags: ['Python → TypeScript', 'AlloyDB · pgvector', 'Gemini', 'Cloud Run']
order: 1
---
