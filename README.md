# ZAP Blinds Solutions — Portal de facturación (Demo)

Demo de cotizaciones y facturas para ZAP Blinds Solutions, construido en Next.js 14 + Supabase + Vercel.

## Stack

- **Next.js 16** (App Router)
- **React 19**
- **TypeScript 6**
- **Supabase** (Auth + PostgreSQL)
- **Tailwind CSS 3.4**
- **react-to-print 3** (descarga de PDF)
- **Vercel** (deploy)

## Setup local

```bash
npm install
cp .env.local.example .env.local
# Edita .env.local con las llaves de tu proyecto Supabase
npm run dev
```

## Configuración de Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com)
2. En el SQL Editor, ejecuta el contenido de `supabase/schema.sql`
3. En **Authentication → Users**, crea el usuario de Ruben:
   - Email: `ruben@zapblindsusa.com`
   - Define una contraseña temporal
4. En **Authentication → Providers**, deja activado solo Email
5. Copia `Project URL` y `anon key` a tu `.env.local`

## Estructura

```
app/
├── login/              Login de Ruben
├── dashboard/          Panel con métricas y lista
├── new/                Crear cotización o factura
├── document/[id]/      Preview imprimible
└── layout.tsx
components/
└── ZapLogo.tsx
lib/
├── supabase.ts         Cliente de Supabase (browser + server)
└── types.ts            Tipos y cálculos compartidos
supabase/
└── schema.sql          Schema de la base de datos
```

## Lógica de la demo

- Solo permite **2 cotizaciones + 2 facturas** por usuario
- Las cotizaciones **NO** llevan tax (replicando el formato actual de Ruben)
- Las facturas calculan **6% sales tax de South Carolina** automáticamente
- El descuento se aplica antes de calcular el tax
- Los PDFs se generan vía `window.print()` con estilos optimizados

## Deploy en Vercel

```bash
vercel --prod
```

Configura las variables de entorno en el dashboard de Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Próximos pasos (versión completa)

- Base de datos de clientes recurrentes
- Conversión de cotización → factura con un clic
- Alertas de seguimiento (email/WhatsApp después de N días)
- Analítica avanzada (clientes top, mes más fuerte, etc.)
- Integración de pagos (Stripe)
- Soporte multi-usuario / equipo
