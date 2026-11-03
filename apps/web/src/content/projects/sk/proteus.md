---
title: 'Migrácia nástroja postaveného na Palantir Foundry do interného CMS'
context: 'Mediálna skupina · AI tím'
year: '2026'
metric: '1 : 1'
metricLabel: 'funkčná parita po migrácii, Foundry ostáva system of record'
problem: 'Redaktori si vymieňali články cez Workshop appku vo Foundry – mimo redakčného systému, s vlastným loginom a neprispôsobiteľným UI.'
solution: 'Najprv návrh: analýza pôvodnej appky a ontológie, MVP scope so sign-off tabuľkou, ADR BFF vs. priame volania, mapovanie identity CMS používateľa na Foundry (service account per content space), verzovaný OpenAPI kontrakt. Potom Next.js 16 server actions nad Palantir OSDK, middleware s typovaným výsledkom, migrácia na stabilné brandId, skóre potenciálu článku, uložené filtre (144 testov), filtre cez Wikidata entity, preklad článkov, plugin na odporúčanie obrázkov.'
result: 'Redaktor sa neprihlasuje do Foundry, UI má pod kontrolou redakčný tím. Test-first so živým overením pred každým commitom.'
tags: ['Next.js 16', 'Palantir OSDK', 'OAuth per značka', 'Zod · Vitest']
order: 2
---
