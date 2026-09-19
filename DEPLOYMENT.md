# Production deployment

## Render backend

Set these environment variables on the backend service:

```env
DATABASE_URL=<Render PostgreSQL connection string>
AUTH_SECRET=<stable random secret>
AUTH_URL=https://stage-link-duo.vercel.app
AUTH_TRUST_HOST=true
ADMIN_EMAIL=admin@stagelink.tg
ADMIN_PASSWORD=<private admin password>
MEDIATOR_EMAIL=mediateur@stagelink.tg
MEDIATOR_PASSWORD=<private mediator password>
DEMO_PASSWORD=<private demo accounts password>
```

Use this Render start command:

```bash
cd backend && npm run start:production
```

The command applies pending migrations, creates or updates the administrator, mediator, student, and company demo accounts, and starts Next.js. It does not run the destructive demo seed.

## Vercel frontend

Set these environment variables for the production deployment and redeploy:

```env
BACKEND_URL=https://stagelink-nyad.onrender.com
NEXT_PUBLIC_APP_URL=https://stage-link-duo.vercel.app
```

The frontend proxies `/api/*` to `BACKEND_URL`, so the browser and NextAuth must use the same public frontend origin.

## Demo seed

`npm run db:seed` is for an empty development database only. It deletes existing application data before inserting demo records and must not be used on production data.

The production bootstrap creates these demo accounts without deleting existing data. They all use `DEMO_PASSWORD`:

- Companies: `contact@kora.tg`, `bonjour@agroplus.tg`, `hello@ateliermono.tg`
- Students: `amina.ayele@etu.tg`, `kodjo.adje@etu.tg`, `mariam.kossi@etu.tg`, `yawo.folly@etu.tg`, `sena.bakali@etu.tg`, `elom.koffi@etu.tg`, `espoir.togbe@etu.tg`, `afia.amouzou@etu.tg`
