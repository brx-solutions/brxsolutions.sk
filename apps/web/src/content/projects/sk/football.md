---
title: 'Automatizované futbalové preview na Palantir Foundry'
context: 'Mediálna skupina · šport'
year: '2026'
metric: '4 ligy'
metricLabel: 'preview zápasov každý týždeň automaticky'
problem: 'Redakcia nestíhala písať preview pre Ligue 1, Bundesligu, Premier League a Serie A – opakujúca sa práca bez pridanej hodnoty.'
solution: 'Dátové pipeline nad športovým API (PySpark/pandas, 13 inkrementálnych datasetov, multi-league registry), verzovaný systém promptov pre články vo švajčiarskej nemčine v house style redakcie, 90+ testov kvality textu, generovanie grafiky (header, gólový graf, tabuľka, radar) v Pillow/matplotlib, publikovanie draftov do interného CMS cez Foundry ontológiu a týždenný Automate.'
result: 'Preview s grafikou vznikajú automaticky ako drafty v CMS. Pipeline odprezentovaná stakeholderom a nasadená.'
tags: ['Palantir Foundry', 'PySpark', 'LLM prompty', 'Pillow']
order: 3
---
