import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

function sidebar(lang: string = 'en') {
  const l = `/${lang}`
  return [
    {
      text: 'Part 1: Enforce Script',
      collapsed: false,
      items: [
        { text: '1.1 Variables & Types', link: `${l}/01-enforce-script/01-variables-types` },
        { text: '1.2 Arrays, Maps & Sets', link: `${l}/01-enforce-script/02-arrays-maps-sets` },
        { text: '1.3 Classes & Inheritance', link: `${l}/01-enforce-script/03-classes-inheritance` },
        { text: '1.4 Modded Classes', link: `${l}/01-enforce-script/04-modded-classes` },
        { text: '1.5 Control Flow', link: `${l}/01-enforce-script/05-control-flow` },
        { text: '1.6 String Operations', link: `${l}/01-enforce-script/06-strings` },
        { text: '1.7 Math & Vectors', link: `${l}/01-enforce-script/07-math-vectors` },
        { text: '1.8 Memory Management', link: `${l}/01-enforce-script/08-memory-management` },
        { text: '1.9 Casting & Reflection', link: `${l}/01-enforce-script/09-casting-reflection` },
        { text: '1.10 Enums & Preprocessor', link: `${l}/01-enforce-script/10-enums-preprocessor` },
        { text: '1.11 Error Handling', link: `${l}/01-enforce-script/11-error-handling` },
        { text: '1.12 What Does NOT Exist', link: `${l}/01-enforce-script/12-gotchas` },
        { text: '1.13 Functions & Methods', link: `${l}/01-enforce-script/13-functions-methods` },
      ]
    },
    {
      text: 'Part 2: Mod Structure',
      collapsed: true,
      items: [
        { text: '2.1 The 5-Layer Hierarchy', link: `${l}/02-mod-structure/01-five-layers` },
        { text: '2.2 config.cpp Deep Dive', link: `${l}/02-mod-structure/02-config-cpp` },
        { text: '2.3 mod.cpp & Workshop', link: `${l}/02-mod-structure/03-mod-cpp` },
        { text: '2.4 Your First Mod', link: `${l}/02-mod-structure/04-minimum-viable-mod` },
        { text: '2.5 File Organization', link: `${l}/02-mod-structure/05-file-organization` },
        { text: '2.6 Server/Client Architecture', link: `${l}/02-mod-structure/06-server-client-split` },
      ]
    },
    {
      text: 'Part 3: GUI & Layout',
      collapsed: true,
      items: [
        { text: '3.1 Widget Types', link: `${l}/03-gui-system/01-widget-types` },
        { text: '3.2 Layout File Format', link: `${l}/03-gui-system/02-layout-files` },
        { text: '3.3 Sizing & Positioning', link: `${l}/03-gui-system/03-sizing-positioning` },
        { text: '3.4 Container Widgets', link: `${l}/03-gui-system/04-containers` },
        { text: '3.5 Programmatic Creation', link: `${l}/03-gui-system/05-programmatic-widgets` },
        { text: '3.6 Event Handling', link: `${l}/03-gui-system/06-event-handling` },
        { text: '3.7 Styles, Fonts & Images', link: `${l}/03-gui-system/07-styles-fonts` },
        { text: '3.8 Dialogs & Modals', link: `${l}/03-gui-system/08-dialogs-modals` },
        { text: '3.9 Real Mod UI Patterns', link: `${l}/03-gui-system/09-real-mod-patterns` },
        { text: '3.10 Advanced Widgets', link: `${l}/03-gui-system/10-advanced-widgets` },
      ]
    },
    {
      text: 'Part 4: File Formats & Tools',
      collapsed: true,
      items: [
        { text: '4.1 Textures', link: `${l}/04-file-formats/01-textures` },
        { text: '4.2 3D Models', link: `${l}/04-file-formats/02-models` },
        { text: '4.3 Materials', link: `${l}/04-file-formats/03-materials` },
        { text: '4.4 Audio', link: `${l}/04-file-formats/04-audio` },
        { text: '4.5 DayZ Tools Workflow', link: `${l}/04-file-formats/05-dayz-tools` },
        { text: '4.6 PBO Packing', link: `${l}/04-file-formats/06-pbo-packing` },
        { text: '4.7 Workbench Guide', link: `${l}/04-file-formats/07-workbench-guide` },
        { text: '4.8 Building Modeling', link: `${l}/04-file-formats/08-building-modeling` },
      ]
    },
    {
      text: 'Part 5: Configuration Files',
      collapsed: true,
      items: [
        { text: '5.1 stringtable.csv', link: `${l}/05-config-files/01-stringtable` },
        { text: '5.2 Inputs.xml', link: `${l}/05-config-files/02-inputs-xml` },
        { text: '5.3 Credits.json', link: `${l}/05-config-files/03-credits-json` },
        { text: '5.4 ImageSet Format', link: `${l}/05-config-files/04-imagesets` },
        { text: '5.5 Server Configuration', link: `${l}/05-config-files/05-server-configs` },
        { text: '5.6 Spawning Gear', link: `${l}/05-config-files/06-spawning-gear` },
      ]
    },
    {
      text: 'Part 6: Engine API',
      collapsed: true,
      items: [
        { text: '6.1 Entity System', link: `${l}/06-engine-api/01-entity-system` },
        { text: '6.2 Vehicle System', link: `${l}/06-engine-api/02-vehicles` },
        { text: '6.3 Weather System', link: `${l}/06-engine-api/03-weather` },
        { text: '6.4 Camera System', link: `${l}/06-engine-api/04-cameras` },
        { text: '6.5 Post-Process Effects', link: `${l}/06-engine-api/05-ppe` },
        { text: '6.6 Notification System', link: `${l}/06-engine-api/06-notifications` },
        { text: '6.7 Timers & CallQueue', link: `${l}/06-engine-api/07-timers` },
        { text: '6.8 File I/O & JSON', link: `${l}/06-engine-api/08-file-io` },
        { text: '6.9 Networking & RPC', link: `${l}/06-engine-api/09-networking` },
        { text: '6.10 Central Economy', link: `${l}/06-engine-api/10-central-economy` },
        { text: '6.11 Mission Hooks', link: `${l}/06-engine-api/11-mission-hooks` },
        { text: '6.12 Action System', link: `${l}/06-engine-api/12-action-system` },
        { text: '6.13 Input System', link: `${l}/06-engine-api/13-input-system` },
        { text: '6.14 Player System', link: `${l}/06-engine-api/14-player-system` },
        { text: '6.15 Sound System', link: `${l}/06-engine-api/15-sound-system` },
        { text: '6.16 Crafting System', link: `${l}/06-engine-api/16-crafting-system` },
        { text: '6.17 Construction System', link: `${l}/06-engine-api/17-construction-system` },
        { text: '6.18 Animation System', link: `${l}/06-engine-api/18-animation-system` },
        { text: '6.19 Terrain & World Queries', link: `${l}/06-engine-api/19-terrain-queries` },
        { text: '6.20 Particle & Effects', link: `${l}/06-engine-api/20-particle-effects` },
        { text: '6.21 Zombie & AI System', link: `${l}/06-engine-api/21-zombie-ai-system` },
        { text: '6.22 Admin & Server', link: `${l}/06-engine-api/22-admin-server` },
        { text: '6.23 World Systems', link: `${l}/06-engine-api/23-world-systems` },
      ]
    },
    {
      text: 'Part 7: Patterns & Practices',
      collapsed: true,
      items: [
        { text: '7.1 Singleton Pattern', link: `${l}/07-patterns/01-singletons` },
        { text: '7.2 Module/Plugin Systems', link: `${l}/07-patterns/02-module-systems` },
        { text: '7.3 RPC Communication', link: `${l}/07-patterns/03-rpc-patterns` },
        { text: '7.4 Config Persistence', link: `${l}/07-patterns/04-config-persistence` },
        { text: '7.5 Permission Systems', link: `${l}/07-patterns/05-permissions` },
        { text: '7.6 Event-Driven Architecture', link: `${l}/07-patterns/06-events` },
        { text: '7.7 Performance Optimization', link: `${l}/07-patterns/07-performance` },
      ]
    },
    {
      text: 'Part 8: Tutorials',
      collapsed: true,
      items: [
        { text: '8.1 Your First Mod', link: `${l}/08-tutorials/01-first-mod` },
        { text: '8.2 Custom Item', link: `${l}/08-tutorials/02-custom-item` },
        { text: '8.3 Admin Panel', link: `${l}/08-tutorials/03-admin-panel` },
        { text: '8.4 Chat Commands', link: `${l}/08-tutorials/04-chat-commands` },
        { text: '8.5 Mod Template', link: `${l}/08-tutorials/05-mod-template` },
        { text: '8.6 Debugging & Testing', link: `${l}/08-tutorials/06-debugging-testing` },
        { text: '8.7 Publishing to Workshop', link: `${l}/08-tutorials/07-publishing-workshop` },
        { text: '8.8 HUD Overlay', link: `${l}/08-tutorials/08-hud-overlay` },
        { text: '8.9 Professional Template', link: `${l}/08-tutorials/09-professional-template` },
        { text: '8.10 Vehicle Mod', link: `${l}/08-tutorials/10-vehicle-mod` },
        { text: '8.11 Clothing Mod', link: `${l}/08-tutorials/11-clothing-mod` },
        { text: '8.12 Trading System', link: `${l}/08-tutorials/12-trading-system` },
        { text: '8.13 Diag Menu', link: `${l}/08-tutorials/13-diag-menu` },
      ]
    },
    {
      text: 'Reference',
      collapsed: true,
      items: [
        { text: 'API Quick Reference', link: `${l}/06-engine-api/quick-reference` },
        { text: 'Cheatsheet', link: `${l}/cheatsheet` },
        { text: 'Glossary', link: `${l}/glossary` },
        { text: 'FAQ', link: `${l}/faq` },
        { text: 'Troubleshooting', link: `${l}/troubleshooting` },
      ]
    },
  ]
}

export default withMermaid(
  defineConfig({
    title: 'DayZ Modding Wiki',
    description: 'The most comprehensive DayZ modding documentation — 92 chapters in 12 languages',

    head: [
      ['link', { rel: 'icon', type: 'image/png', href: '/DayZ-Modding-Wiki/favicon.png' }],
      ['meta', { name: 'theme-color', content: '#1a1a2e' }],
      ['meta', { property: 'og:type', content: 'website' }],
      ['meta', { property: 'og:title', content: 'DayZ Modding Wiki' }],
      ['meta', { property: 'og:description', content: 'The most comprehensive DayZ modding documentation ever created' }],
    ],

    base: '/DayZ-Modding-Wiki/',
    srcExclude: ['AGENTS.md', 'CONTRIBUTING.md', 'CLAUDE.md'],
    cleanUrls: true,
    lastUpdated: true,
    ignoreDeadLinks: [
      /LICENCE/,
      /CONTRIBUTING/,
      /04-scripting-guide/,
    ],

    locales: {
      en: { label: 'English', lang: 'en', link: '/en/' },
      pt: { label: 'Português', lang: 'pt-BR', link: '/pt/' },
      de: { label: 'Deutsch', lang: 'de', link: '/de/' },
      ru: { label: 'Русский', lang: 'ru', link: '/ru/' },
      es: { label: 'Español', lang: 'es', link: '/es/' },
      fr: { label: 'Français', lang: 'fr', link: '/fr/' },
      ja: { label: '日本語', lang: 'ja', link: '/ja/' },
      'zh-hans': { label: '简体中文', lang: 'zh-CN', link: '/zh-hans/' },
      cs: { label: 'Čeština', lang: 'cs', link: '/cs/' },
      pl: { label: 'Polski', lang: 'pl', link: '/pl/' },
      hu: { label: 'Magyar', lang: 'hu', link: '/hu/' },
      it: { label: 'Italiano', lang: 'it', link: '/it/' },
    },

    themeConfig: {
      logo: '/images/wiki-logo.png',
      siteTitle: 'DayZ Modding Wiki',

      nav: [
        { text: 'Guide', link: '/en/01-enforce-script/01-variables-types' },
        { text: 'API Reference', link: '/en/06-engine-api/quick-reference' },
        { text: 'Tutorials', link: '/en/08-tutorials/01-first-mod' },
        {
          text: 'Quick Links',
          items: [
            { text: 'Cheatsheet', link: '/en/cheatsheet' },
            { text: 'Glossary', link: '/en/glossary' },
            { text: 'FAQ', link: '/en/faq' },
            { text: 'Troubleshooting', link: '/en/troubleshooting' },
          ]
        }
      ],

      sidebar: {
        '/en/': sidebar('en'),
        '/pt/': sidebar('pt'),
        '/de/': sidebar('de'),
        '/ru/': sidebar('ru'),
        '/es/': sidebar('es'),
        '/fr/': sidebar('fr'),
        '/ja/': sidebar('ja'),
        '/zh-hans/': sidebar('zh-hans'),
        '/cs/': sidebar('cs'),
        '/pl/': sidebar('pl'),
        '/hu/': sidebar('hu'),
        '/it/': sidebar('it'),
      },

      socialLinks: [
        { icon: 'github', link: 'https://github.com/StarDZ-Team/DayZ-Modding-WIKI' },
      ],

      editLink: {
        pattern: 'https://github.com/StarDZ-Team/DayZ-Modding-WIKI/edit/main/:path',
        text: 'Edit this page on GitHub'
      },

      search: {
        provider: 'local',
        options: {
          translations: {
            button: { buttonText: 'Search', buttonAriaLabel: 'Search' },
            modal: { noResultsText: 'No results for', resetButtonTitle: 'Clear' }
          }
        }
      },

      footer: {
        message: 'Released under CC BY-SA 4.0 | Code examples under MIT License',
        copyright: '© 2026 StarDZ Team'
      },

      outline: {
        level: [2, 3],
        label: 'On this page'
      },
    },

    markdown: {
      lineNumbers: true,
    },

    mermaid: {
      theme: 'dark',
    },
  })
)
