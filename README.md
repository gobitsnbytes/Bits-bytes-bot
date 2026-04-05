# BnB Bot

Internal operations bot for the Bits&Bytes Discord server. Manages the fork lifecycle, reaction roles, automod, and Notion sync.

## Setup

```bash
npm install
cp .env.example .env
# Fill in your tokens in .env
node deploy-commands.js   # Register slash commands (run once)
node index.js             # Start the bot
```

## Docker

```bash
docker build -t bnb-bot .
docker run --env-file .env bnb-bot
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DISCORD_TOKEN` | Bot token from Discord Developer Portal |
| `DISCORD_CLIENT_ID` | Application ID |
| `GUILD_ID` | Your server ID |
| `NOTION_TOKEN` | Notion integration token |
| `NOTION_FORK_REGISTRY_DB` | Notion Fork Registry database ID |
| `FORK_HANDBOOK_URL` | Link to the fork handbook |

## Commands

| Command | Role | Description |
|---------|------|-------------|
| `/fork-request` | Everyone | Submit a fork request via modal |
| `/merge @user city:x` | @team | Onboard a new fork lead |
| `/pulse city:x update:"..."` | @fork-lead | Post an activity update |
| `/archive city:x reason:"..."` | @team | Archive a stale fork |
| `/forks` | Everyone | List all active/pending forks |
