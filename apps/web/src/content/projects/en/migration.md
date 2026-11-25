---
title: 'Migrating a Palantir Foundry-based tool into an internal CMS'
context: 'Media group · AI team'
year: '2026'
metric: '1 : 1'
metricLabel: 'feature parity after migration, Foundry stays system of record'
problem: 'Editors exchanged articles through a Workshop app in Foundry – outside the editorial system, with a separate login and a UI that could not be customised.'
solution: 'Design first: analysis of the original app and ontology, MVP scope with a sign-off table, ADR on BFF vs. direct calls, CMS-to-Foundry identity mapping (service account per content space), versioned OpenAPI contract. Then Next.js 16 server actions over the Palantir OSDK, middleware with typed results, migration to stable brand IDs, article potential score, saved filters (144 tests), Wikidata-entity filters, article translation, an image-recommendation plugin.'
result: "Editors no longer log into Foundry; the UI is under the editorial team's control. Test-first with live verification before every commit."
lesson: 'The biggest value was not the code but the design before it: an MVP sign-off table and an ADR (BFF vs. direct calls) saved weeks of discussion. I learned to map identity between two systems (a service account per content space) and to hold 1:1 parity with tests, not promises.'
tags: ['Next.js 16', 'Palantir OSDK', 'OAuth per brand', 'Zod · Vitest']
order: 2
---
