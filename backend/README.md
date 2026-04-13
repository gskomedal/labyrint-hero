# Labyrint Hero – Global Leaderboard Backend

Cloudflare Worker + KV store for the global leaderboard.

## Setup

1. Install Wrangler CLI: `npm install -g wrangler`
2. Login: `wrangler login`
3. Create a KV namespace:
   ```
   wrangler kv namespace create LEADERBOARD
   ```
4. Copy the returned namespace ID into `wrangler.toml`
5. Deploy:
   ```
   wrangler deploy
   ```
6. Update `GlobalLeaderboard.API_URL` in `src/utils/GlobalLeaderboard.js` with your worker URL.

## Endpoints

| Method | Path            | Description                                      |
|--------|-----------------|--------------------------------------------------|
| POST   | /scores         | Submit a score (JSON body)                       |
| GET    | /scores         | Fetch top 100 (?race=&difficulty= optional)      |
| GET    | /scores/count   | Total number of stored scores                    |

## Anti-cheat

The worker rejects obviously impossible scores:
- World 3+ at level 1
- World completion in under 10 seconds
- Out-of-range numeric values
- Invalid race/difficulty values

## Cost

Cloudflare Workers free tier includes 100k requests/day and 1 GB KV storage – more than enough for a casual game leaderboard.
