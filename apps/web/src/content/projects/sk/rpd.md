---
title: 'Automatizácia nasadzovania Remote PHY zariadení v národnej sieti'
context: 'FRINX / Elisa Polystar · národný kábelový operátor (NL)'
year: '2022 – 2025'
metric: 'minúty'
metricLabel: 'namiesto hodín na jedno zariadenie'
problem: 'Tisíce zariadení v kábelovej sieti – každé naprovisionovať, nakonfigurovať a overiť. Ručne hodiny, chyby, bez auditu.'
solution: 'Python workflowy a workery nad FRINX Machine (Workflow Manager na Netflix Conductor, UniConfig, stav v PostgreSQL): načítanie dát, payload, API volania cez UniConfig a REST, overenie, rollback pri chybe. Spracovanie tisícriadkových odpovedí, container image-y a testovacie prostredia (Docker, Kubernetes), vlastníctvo CI/CD (GitHub Actions, GitLab CI).'
result: 'Opakovateľný, auditovateľný proces s rollbackom – efekt „minúty namiesto hodín“ uvádza FRINX verejne.'
tags: ['Python', 'Netflix Conductor', 'UniConfig', 'Kubernetes']
order: 4
---
