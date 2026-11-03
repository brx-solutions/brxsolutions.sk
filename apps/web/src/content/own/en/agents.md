---
title: 'Personal AI agents (Telegram + web)'
status: '222 tests · in production'
icon: bot
tech: 'Shared agentkit (LLM client over the Claude Agent SDK with MCP tools, Home Assistant client, web shell with auth), agents as separate packages; APScheduler for check-ins and weekly stats; FastAPI + HTMX UI behind Cloudflare Zero Trust; one Docker process on a home Proxmox.'
tags: ['Claude Agent SDK', 'FastAPI · HTMX', 'Telegram', 'Docker']
order: 1
---

A platform for small agents on one server. For example a coach: meals, pantry, check-ins and reminders via Telegram. Calories are computed by code, the model only supplies ingredients – numbers stay deterministic.
