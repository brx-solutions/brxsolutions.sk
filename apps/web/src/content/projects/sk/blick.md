---
title: 'AI vyhľadávanie pre spravodajský portál – záchrana a modernizácia RAG chatbota'
context: 'Mediálna skupina · spravodajský portál'
year: '2025'
metric: '3,5 min → 20 s'
metricLabel: 'odozva najpomalšieho RAG dotazu'
problem: '2,5-ročný Python RAG systém na GCP: najpomalší dotaz trval minúty, kód závisel od SDK pred ukončením podpory.'
solution: 'Výkonové ladenie po krokoch (paralelné relevancy checky, circuit breaker, timeouty a retry, štruktúrované logovanie), migrácia na Google Gen AI SDK pred deadline, plán migrácie ingestion na nový CMS event systém. Potom prepis všetkých 5 služieb do Node.js/TypeScript monorepa (Fastify, Zod, Vitest, OpenTelemetry) s 1:1 paritou a ledgerom odstráneného kódu; nasadenie na GCP cez GitHub Actions + Workload Identity Federation.'
result: 'Migrácia dokončená pred odstavením SDK, moderný stack s observability v produkcii.'
lesson: 'Výkon sa ladí po jednom kroku s číslom za každým, nie veľkým prepisom. Prepis prišiel až po stabilizácii, s ledgerom odstráneného kódu, aby sa nestratilo správanie, na ktoré sa redakcia spoliehala. Migrácia SDK s pevným dátumom ma naučila plánovať podľa termínu odstavenia, nie podľa roadmapy.'
tags: ['Python → TypeScript', 'AlloyDB · pgvector', 'Gemini', 'Cloud Run']
order: 1
---
