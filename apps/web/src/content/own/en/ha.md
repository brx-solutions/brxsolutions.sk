---
title: 'Home Assistant integration'
status: '224 tests · v0.8.0'
icon: home
tech: 'Backend as Python integration modules (own store, sensors, ZHA events), frontend as Lit web components in TypeScript in one bundle; 105 pytest + 119 vitest, Playwright visual checks; versioned deploys (HAOS on Proxmox). Local LLM experiment: Ollama (Llama 3.1) on the home server, a custom Python bridge translating Slovak commands into HA REST API calls, no cloud.'
tags: ['Python', 'Lit · TypeScript', 'Playwright', 'ZHA / Zigbee', 'Ollama · LLM']
order: 3
---

A custom HA integration with Lit cards for the household: tagged recipe management, a child diary with time series and charts, a family calendar with reminders, and automations triggered by physical Zigbee devices through ZHA events. A side experiment on top: a locally running LLM wired into HA that understands commands in Slovak and controls devices without any cloud.
