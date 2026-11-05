---
title: 'Automated football previews on Palantir Foundry'
context: 'Media group · sports'
year: '2026'
metric: '4 leagues'
metricLabel: 'match previews generated automatically every week'
problem: 'The newsroom could not keep up with previews for Ligue 1, Bundesliga, Premier League and Serie A – repetitive work with little added value.'
solution: "Data pipelines over a sports API (PySpark/pandas, 13 incremental datasets, multi-league registry), a versioned prompt system for Swiss-German articles in the newsroom's house style, 90+ text-quality tests, generated graphics (header, goal chart, table, radar) in Pillow/matplotlib, draft publishing into the internal CMS via the Foundry ontology and a weekly Automate schedule."
result: 'Previews with graphics appear automatically as CMS drafts. Pipeline presented to stakeholders and shipped.'
lesson: 'LLM output can be tested like code: 90+ quality tests (length, numbers, house style) caught prompt regressions before the newsroom did. Versioned prompts and incremental datasets turned the pipeline into something another person can take over.'
tags: ['Palantir Foundry', 'PySpark', 'LLM prompts', 'Pillow']
order: 3
---
