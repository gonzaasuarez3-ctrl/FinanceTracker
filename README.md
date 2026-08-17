# Claridad — Consultor Financiero Personal

App de finanzas personales centrada en una sola pregunta: **¿cuánto puedo gastar hoy sin comprometer mis obligaciones ni mis metas?**

Este repositorio es el **MVP (Fase 1)** de la arquitectura completa (ver `docs/architecture.md`): perfil, ingresos y ciclo de pago, gastos fijos, cálculo de "safe-to-spend", panel principal, e historial de gastos — más metas y suscripciones básicas de la Fase 2.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Vitest para el motor de cálculo
- Persistencia MVP: `localStorage` (ver nota abajo)

## Cómo correrlo localmente

```bash
npm install
npm run dev
```

Abre http://localhost:3000

## Tests del motor de cálculo

El motor de cálculo (`src/lib/calc-engine.ts`) es la pieza más importante del proyecto: es **puro y determinista** — sin acceso a base de datos, sin IA, solo matemática financiera testeable.

```bash
npm test
```

## Estructura

```
src/
  lib/
    calc-engine.ts    — motor de cálculo puro (safe-to-spend, health score)
    pay-cycle.ts       — resolución de fechas recurrentes (salario, gastos fijos)
    types.ts           — tipos compartidos
    storage.ts          — persistencia (localStorage en el MVP)
    use-finance.ts     — hook de React que conecta estado + motor de cálculo
  app/
    page.tsx            — Dashboard
    onboarding/          — flujo de configuración inicial
    expenses/            — alta rápida + historial de gastos
    goals/               — metas de ahorro
    subscriptions/       — gestor de suscripciones
  components/
    NavBar.tsx
    DashboardCards.tsx
```

## Nota importante sobre la persistencia (MVP)

Esta primera versión guarda los datos en el `localStorage` del navegador para poder tener
una app **funcional de inmediato, sin backend**. Esto significa:

- Los datos viven solo en tu navegador — no hay cuentas ni sincronización entre dispositivos todavía.
- `src/lib/storage.ts` es la única pieza que sabe "dónde viven los datos". Migrar a un backend real
  (PostgreSQL + API, autenticación, multi-dispositivo) implica reemplazar ese archivo — el resto
  de la app (UI y motor de cálculo) no necesita cambiar.

La arquitectura completa para la versión con backend, base de datos, IA y multi-moneda está
documentada en `docs/architecture.md`.

## Próximos pasos (ver `docs/architecture.md` para el roadmap completo)

- Fase 2: gráficos, cash-flow timeline, notificaciones, insights automáticos
- Fase 3: Consultor IA, "¿Puedo pagarlo?", simulador de cuotas
- Fase 4: backend real, autenticación, tasas de cambio en vivo, precios de suscripciones verificados

## Licencia

Privado / uso personal — ajusta según lo que necesites para tu repositorio.
