---
title: 'Integrácia pre Home Assistant'
status: '224 testov · v0.8.0'
icon: home
tech: 'Backend ako Python moduly integrácie (vlastný store, senzory, ZHA udalosti), frontend ako Lit web components v TypeScripte v jednom bundli; 105 pytest + 119 vitest, Playwright vizuálne overenie; verzované nasadenie (HAOS na Proxmoxe). Experiment s lokálnym LLM: Ollama (Llama 3.1) na domácom serveri, vlastný Python bridge prekladá slovenské povely na volania HA REST API, bez cloudu.'
tags: ['Python', 'Lit · TypeScript', 'Playwright', 'ZHA / Zigbee']
order: 3
---

Vlastná HA integrácia s Lit kartami pre domácnosť: správa receptov s tagmi, denník dieťaťa s časovými radmi a grafmi, rodinný kalendár s pripomienkami a automatizácie spúšťané fyzickými Zigbee zariadeniami cez ZHA udalosti. Experiment navyše: lokálne bežiaci LLM model prepojený na HA, ktorý rozumie povelom v slovenčine a ovláda zariadenia bez cloudu.
