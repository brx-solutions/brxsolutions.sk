---
title: 'Osobní AI agenti (Telegram + web)'
status: '222 testov · v produkcii'
icon: bot
tech: 'Zdieľaný agentkit (LLM klient nad Claude Agent SDK s MCP nástrojmi, Home Assistant klient, web shell s auth), agenti ako samostatné balíky; APScheduler pre check-iny a týždenné štatistiky; FastAPI + HTMX UI za Cloudflare Zero Trust; jeden proces v Dockeri na domácom Proxmoxe.'
tags: ['Claude Agent SDK', 'FastAPI · HTMX', 'Telegram', 'Docker']
order: 1
---

Platforma pre malých agentov na jednom serveri. Prvý je tréner: jedlá, špajza, check-iny a pripomienky cez Telegram. Kalórie počíta kód, model dodáva len suroviny – čísla sú deterministické.
