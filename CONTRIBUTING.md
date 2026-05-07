# Contributing

Thanks for your interest in this project. This repository is a public demo and portfolio case; collaboration and feedback are welcome.

## Local setup

1. **Clone** the repository.

2. **Install dependencies** (pnpm and lockfile are the source of truth):

   ```bash
   pnpm install --frozen-lockfile
   ```

3. **Environment:** copy `.env.example` to `.env.local` and fill in values for the integrations you want to exercise. Do **not** commit `.env.local` or real secrets. See also the **Public repo hygiene** section in [README.md](README.md).

4. **Run the app** (default port `3001`):

   ```bash
   pnpm dev
   ```

## Checks before opening a PR

Run the same commands as CI:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Pull requests

- Prefer small, focused changes with a clear description.
- Ensure the diff contains **no API keys, tokens, private URLs, or internal IPs** (see [SECURITY.md](SECURITY.md)).
- Link related issues when applicable.

## Questions and collaboration

For hiring or partnership inquiries, use the contacts in [README.md](README.md) or open an issue with the **Collaboration** template.

Публичный URL репозитория и заметки по деплою — раздел **«Vercel, remote и данные»** в [README.md](README.md).
