import type { Dictionary } from './dictionary';

export const sk: Dictionary = {
  meta: {
    title: 'BRX Solutions – back-end a AI inžinier, Žilina',
    description:
      'Python a TypeScript inžinier s 9 rokmi v IT. RAG systémy, LLM pipeline a back-end – ako kontraktor vo vašom tíme alebo na projekt od návrhu po prevádzku.',
  },
  nav: {
    services: 'Služby',
    stack: 'Technológie',
    experience: 'Skúsenosti',
    projects: 'Case studies',
    own: 'Vlastné projekty',
    contact: 'Kontakt',
    cta: 'Konzultácia zdarma',
    langLabel: 'Jazyk / Language',
    menuOpen: 'Menu',
    menuClose: 'Zavrieť',
  },
  hero: {
    eyebrow: 'back-end & AI engineer · Žilina · remote',
    title: 'Back-end a AI,\nktoré bežia\nv produkcii.',
    sub: 'Python a TypeScript inžinier s 9 rokmi v IT. Staviam RAG systémy, LLM pipeline a back-end. Najčastejšie ako kontraktor priamo vo vašom tíme, dlhodobo a remote. Projekt na kľúč tiež.',
    cta1: 'Dohodnúť rozhovor',
    cta2: 'Pozrieť case studies',
    availability: 'Voľná kapacita od 12/2026',
    code: {
      focus: ['backend', 'GenAI / RAG', 'data'],
      stack: ['Python', 'TypeScript', 'GCP'],
      remote: true,
    },
  },
  stats: [
    { value: '9+', label: 'rokov v IT, od 2017' },
    { value: '3', label: 'odvetvia v produkcii: platby, telekom siete, médiá' },
    { value: 'CH · NL · SK', label: 'klienti v troch krajinách, plne remote' },
    { value: '1', label: 'človek od návrhu po prevádzku: back-end, AI, infraštruktúra' },
  ],
  services: {
    title: 'Čo pre vás viem spraviť',
    sub: 'Od auditu existujúceho systému po produkčné nasadenie. Bez agentúrnej režie.',
    featuredBadge: 'hlavná špecializácia',
    featured: {
      title: 'AI agenti, RAG a LLM systémy',
      desc: 'Agenti, ktorí robia skutočnú prácu, nie demo: pripojené k vašim dátam (RAG, hybridné vyhľadávanie), s nástrojmi (MCP, vlastné API), plánom a kanálom k ľuďom (Telegram, Slack, web).',
      quote:
        'Dôraz na to, čo model nesmie robiť: výpočty a pravidlá v kóde, model len tam, kde je jazyk.',
      tags: ['RAG · pgvector', 'Claude Agent SDK · MCP', 'Gemini · Vertex AI', 'Prompt testy'],
    },
    items: [
      {
        icon: 'api',
        title: 'Back-end a API',
        desc: 'Python a TypeScript služby, REST API, PostgreSQL, multi-tenant auth. Observability a testy od prvého dňa.',
        tags: ['Fastify · Flask', 'Next.js', 'PostgreSQL'],
      },
      {
        icon: 'data',
        title: 'Dátové pipeline a automatizácia',
        desc: 'Transformácie nad externými API, plánované buildy, workflow orchestrácia – od sieťových zariadení po redakcie.',
        tags: ['Palantir Foundry', 'Netflix Conductor', 'PySpark'],
      },
      {
        icon: 'legacy',
        title: 'Audit a modernizácia legacy',
        desc: 'Prevezmem cudzí zastaraný systém: audit, plán, migrácia bez výpadku, ledger zmien.',
        tags: ['Migrácie SDK', 'Rollback', 'Terraform'],
      },
      {
        icon: 'web',
        title: 'Weby a webové aplikácie',
        desc: 'Od informatívneho one-page webu, ako je tento, po webovú aplikáciu s prihlasovaním, databázou a API. Rýchle, prístupné, s testami a nasadením.',
        tags: ['Next.js · React', 'Tailwind', 'Cloudflare · Vercel'],
      },
    ],
  },
  stack: {
    title: 'S čím pracujem',
    note: 'Produkčne overený stack z reálnych projektov. Ďalšie: Robot Framework, Postman, Firestore, Secret Manager, Cloud DLP, Pants, 1Password CLI.',
    fullstack:
      'Som back-end inžinier, ale nekončím na API. V každom projekte som písal aj frontend – React, Lit, HTMX, Next.js server actions.\n\nPre klienta to znamená: jeden človek dodá celú funkciu od databázy po obrazovku.',
    countLabel: (n) => `${n} nástrojov`,
    groups: [
      {
        name: 'Back-end',
        bar: '95%',
        items: [
          'Python',
          'TypeScript',
          'Node.js',
          'Fastify',
          'Flask · FastAPI',
          'Next.js',
          'PostgreSQL · AlloyDB',
          'SQLAlchemy · Zod',
        ],
      },
      {
        name: 'AI & dáta',
        bar: '88%',
        items: [
          'Gemini / Vertex AI',
          'Claude Agent SDK · MCP',
          'RAG · pgvector',
          'Palantir Foundry',
          'Netflix Conductor',
          'PySpark',
          'pandas',
        ],
      },
      {
        name: 'Frontend & kvalita',
        bar: '80%',
        items: [
          'React',
          'Lit',
          'HTMX',
          'Tailwind',
          'Vitest',
          'pytest',
          'Playwright',
          'OpenTelemetry',
        ],
      },
      {
        name: 'Cloud & DevOps',
        bar: '85%',
        items: [
          'GCP Cloud Run',
          'AWS',
          'Terraform',
          'Docker',
          'Kubernetes',
          'GitHub Actions',
          'GitLab CI',
          'Cloudflare Zero Trust',
        ],
      },
    ],
  },
  experience: {
    title: 'Skúsenosti',
    sub: 'Deväť rokov v medzinárodných tímoch – od testovania platobných terminálov po generatívnu AI v redakcii.',
    cta: 'Vyžiadať si CV',
  },
  projects: {
    title: 'Čo som riešil',
    sub: 'Produkčné systémy, na ktorých som pracoval. Číslo hovorí o výsledku, detail je na kliknutie.',
    more: 'Ako som to riešil',
    less: 'Skryť detail',
    nda: 'Interné detaily a kód podliehajú NDA – kontext a prístup rád vysvetlím osobne.',
  },
  own: {
    eyebrow: 'Vlastné projekty',
    title: 'Čo si staviam sám',
    sub: 'Malé nástroje, ktoré bežia v produkcii a používam ich každý deň – end-to-end na vlastnom serveri.',
    more: 'Technické detaily',
    less: 'Skryť detaily',
  },
  process: {
    eyebrow: 'Ako spolupracujem',
    title: 'Dve formy spolupráce',
    modes: [
      {
        title: 'Kontraktor v tíme',
        badge: 'preferujem',
        desc: 'Člen vášho tímu na vašich úlohách, s vašimi procesmi a nástrojmi. Dlhodobo, 3+ mesiace, full-time alebo part-time, remote. Fakturácia cez s.r.o. mesačne. Takto pracujem dnes.',
      },
      {
        title: 'Projekt na kľúč',
        desc: 'Pevný rozsah od auditu po odovzdanie – nový systém, modernizácia, web. Štyri kroky nižšie, žiadne prekvapenia.',
      },
    ],
    stepsTitle: 'Projekt na kľúč v štyroch krokoch',
    steps: [
      {
        no: '1',
        title: 'Úvodný rozhovor',
        desc: 'Bezplatných 30 minút. Ciele, kontext, obmedzenia.',
      },
      {
        no: '2',
        title: 'Audit a návrh',
        desc: 'Pri existujúcom systéme najprv audit. Rozsah, architektúra a cena bez prekvapení.',
      },
      {
        no: '3',
        title: 'Vývoj v iteráciách',
        desc: 'Spec pred kódom, TDD, ukážka každé 1–2 týždne. Benchmark starý vs. nový.',
      },
      {
        no: '4',
        title: 'Nasadenie a odovzdanie',
        desc: 'Infra cez Terraform, rollback pripravený, runbooky. Voliteľná podpora.',
      },
    ],
  },
  strengths: {
    eyebrow: 'Prečo so mnou',
    title: 'Čo odo mňa dostanete',
    sub: 'Pozorované na reálnych projektoch, nie z náborového inzerátu.',
    items: [
      {
        title: 'Prevezmem cudzí legacy systém',
        desc: 'Audit, plán, prepis – s ledgerom, čo a prečo odišlo.',
      },
      {
        title: 'Ladím výkon RAG pipeline merateľne',
        desc: 'Sériové LLM volania, candidate explosion, zbytočné RPC – opravené po krokoch s číslami.',
      },
      {
        title: 'Foundry + GCP + LLM pod jednou strechou',
        desc: 'Od zdrojového API po publikovaný článok, bez odovzdávania.',
      },
      {
        title: 'Integrácie medzi tímami',
        desc: 'Vyjednám kontrakt, nájdem a zdokumentujem permission blocker.',
      },
      {
        title: 'Disciplína v procese',
        desc: 'TDD, spec pred kódom, runbooky, infra len cez Terraform.',
      },
      {
        title: 'Produkčná opatrnosť',
        desc: 'Image swap namiesto :latest, rollback digest, migrácie najprv na dev.',
      },
      {
        title: 'Zapadnem do existujúceho tímu',
        desc: 'Cudzí codebase, code review, standupy, Scrum – od prvého týždňa prispievam, nie len čítam.',
      },
      {
        title: 'Web od návrhu po nasadenie',
        desc: 'Informatívny web alebo webová aplikácia s prihlásením a API – rýchly, prístupný, s testami, CI a hostingom. Tento web je ukážka.',
      },
      {
        title: 'Zrozumiteľne pre stakeholderov',
        desc: 'Technickú pipeline vysvetlím netechnicky – roky Scrum mastera.',
      },
      {
        title: 'AI-asistovaný vývoj ako služba',
        desc: 'Rýchlosť bez straty kvality – a viem to nastaviť aj vášmu tímu.',
      },
    ],
  },
  contact: {
    title: 'Hľadáte posilu do tímu\nalebo človeka na projekt?',
    sub: 'Napíšte mi pár viet o tíme alebo projekte. Do 24 hodín sa ozvem s návrhom ďalšieho kroku.',
    emailLabel: 'Alebo priamo e-mailom',
    form: {
      name: 'Meno',
      email: 'E-mail',
      type: 'Typ projektu',
      options: {
        team: 'Posilnenie tímu / kontraktor',
        ai: 'AI agenti / RAG / LLM',
        backend: 'Back-end, API alebo dátová pipeline',
        web: 'Web alebo webová aplikácia',
        audit: 'Audit a modernizácia existujúceho systému',
        cv: 'Žiadosť o CV',
      },
      message: 'Správa',
      messagePlaceholder: 'Pár viet o tíme alebo projekte, cieľoch a termíne.',
      cvPlaceholder: 'Prosím o zaslanie CV. Kontext: …',
      submit: 'Odoslať správu',
      sending: 'Odosielam…',
      success: 'Ďakujem, správa odišla. Ozvem sa do 24 hodín.',
      error: 'Správu sa nepodarilo odoslať. Napíšte mi prosím priamo e-mailom.',
      note: 'Odoslaním súhlasíte so spracovaním údajov za účelom odpovede.',
      noteLink: 'Ochrana osobných údajov',
    },
  },
  legal: { title: 'Ochrana osobných údajov' },
  sent: {
    title: 'Správa odoslaná',
    body: 'Ďakujem. Ozvem sa do 24 hodín s návrhom ďalšieho kroku.',
    back: 'Späť na úvod',
  },
  failed: {
    title: 'Správu sa nepodarilo odoslať',
    body: 'Niečo sa pokazilo. Napíšte mi prosím priamo e-mailom.',
    back: 'Späť na úvod',
  },
  footer: {
    built:
      'Tento web som navrhol, postavil a nasadil sám – DNS, Cloudflare, hosting, s pomocou AI agentov. Rovnako pracujem na projektoch pre klientov.',
    rights: 'Všetky práva vyhradené.',
  },
};
