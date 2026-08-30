# CinemaOS Frontend

## Environment Variables

- `.env.local` - local development (localhost:8000)

## Development

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Backend

The frontend requires the CinemaOS FastAPI backend running at:

http://localhost:8000

Start it with:

```bash
uvicorn api.server:app --host 0.0.0.0 --port 8000
```
