# BnB Bot — Product Requirements Document

**Product:** BnB Bot (Discord Bot for Bits&Bytes)
**Version:** 1.0
**Status:** Pre-development
**Stack:** Node.js + discord.js v14
**Target Server:** Bits&Bytes Discord (`discord.gg/bitsnbytes`)

---

## Overview

BnB Bot is the internal operations layer for the Bits&Bytes Discord server and its city-fork network. It replaces manual workflows (Carl-bot for reaction roles, manual fork onboarding, ad-hoc pulse tracking) with a unified, branded bot that understands the fork model natively.

The bot is **not a general-purpose bot**. Every feature exists to serve one of two things: the member experience on the main server, or the fork lifecycle.

---

## Goals

- Automate the fork lifecycle: request → review → merge → pulse → archive
- Replace Carl-bot dependency for reaction roles and welcome messages
- Keep the Notion Fork Registry in sync with Discord state
- Give the Bits&Bytes team a clean internal ops layer without leaving Discord

---

## Out of Scope (v1)

- Public-facing website integration
- Payment or event ticketing
- AI/LLM features
- Cross-server federation

---

## User Roles

| Role | Who | Bot access level |
|------|-----|-----------------|
| `@team` | Akshat, Aadrika, Yash | All commands |
| `@fork-lead` | Active fork leads (e.g. Shashwat) | Fork commands only |
| `@member` | Everyone else | Public commands only |

---

## Feature Spec

### F1 — Reaction Roles (replaces Carl-bot)

**Who:** All members
**Where:** `#roles` channel

On bot startup, the bot posts (or reposts if missing) the roles picker message in `#roles`. Members react with an emoji to self-assign city and interest roles.

**City roles:**
| Emoji | Role |
|-------|------|
| 🏙️ | @lucknow |
| 🕌 | @prayagraj |
| 🏛️ | @delhi |
| 🌇 | @bangalore |
| 🌊 | @mumbai |
| 📚 | @kolkata |
| 🌴 | @chennai |
| 🌶️ | @hyderabad |
| 🏭 | @kanpur |
| 🗺️ | @other-city |

**Interest roles:**
| Emoji | Role |
|-------|------|
| 💻 | @dev |
| 🎨 | @design |
| 🔬 | @research |
| ⚙️ | @ops |

Mode: multi-select (members can pick multiple roles).
If a member removes a reaction, the role is removed.

---

### F2 — Welcome DM

**Who:** All new members (triggered on `guildMemberAdd`)
**Where:** Sent as a DM to the new member

When a member joins the server, the bot sends them a DM:

```
hey, welcome to bits&bytes 👋

we're india's teen-led builder community.
we run hackathons, design/dev squads, and real products — fully student led.

→ head to #roles and pick your city + interests
→ drop a note in #introductions
→ if you want to start a bits&bytes fork in your city, check #forks-info

we ship things here. glad you're in.
— the b&b team
```

If the user has DMs disabled, the bot silently skips (no error noise).

---

### F3 — `/fork-request` (public slash command)

**Who:** Any member
**Where:** Any channel

Allows anyone to submit a fork request directly from Discord without going to a web form.

**Modal fields:**
- Name (text, required)
- City (text, required)
- Brief intro — who you are, what you want to build (paragraph, required)
- Are you a student? (yes/no, required)

On submit:
- Bot posts a formatted summary to `#team-forks` (private, `@team` only)
- Bot replies to the user: `"your fork request for [city] has been submitted. the b&b team will review it and reach out shortly."`
- Bot pings `@team` in `#team-forks`

**Sample `#team-forks` post:**
```
🍴 new fork request

city: Varanasi
name: Rohan Sharma
student: yes
about: "I'm a class 12 student, I want to bring hackathons to BHU campus..."

→ /merge @Rohan city:varanasi   to approve
→ /reject @Rohan reason:"..."  to decline
```

---

### F4 — `/merge` (team only)

**Who:** `@team` only
**Where:** Any channel

Officially onboards a fork lead.

**Usage:** `/merge @user city:prayagraj`

**What it does:**
1. Assigns `@fork-lead` role to the user
2. Creates a new `#[city]` channel under the FORKS category (if it doesn't exist)
3. Posts in `#forks-info`: `bitsnbytes-[city] is now live. lead: @user`
4. Sends the fork lead a DM with their onboarding checklist:

```
you've been merged in as the fork lead for bitsnbytes-[city] 🍴

here's what happens next:
→ read the fork handbook: [link]
→ your email [city]@gobitsnbytes.org will be set up by the team
→ your local channel is #[city] on this server
→ you're now in #leads-council — that's where the network coordinates
→ run /pulse to post your first activity update when you're ready

welcome to the network.
— b&b
```

5. Updates the Notion Fork Registry: sets the fork's status from `Pending` → `Active`

---

### F5 — `/pulse` (fork-lead only)

**Who:** `@fork-lead` only
**Where:** Any channel (bot auto-redirects output to `#pulse`)

Allows fork leads to submit a structured activity update.

**Usage:** `/pulse city:prayagraj update:"ran intro workshop at DPS, 30 attendees. next: inter-school hackathon in May."`

**What it does:**
1. Posts a formatted update to `#pulse`:

```
📡 fork pulse — bitsnbytes-prayagraj
lead: @Shashwat
update: ran intro workshop at DPS, 30 attendees. next: inter-school hackathon in May.
date: 06 Apr 2026
```

2. Updates the Notion Fork Registry: sets `Last Pulse` date on the fork's record.

---

### F6 — `/archive` (team only)

**Who:** `@team` only
**Where:** Any channel

Marks a fork as stale and archives it.

**Usage:** `/archive city:prayagraj reason:"no activity in 90 days"`

**What it does:**
1. Removes `@fork-lead` role from the fork's lead
2. Renames `#[city]` channel to `#[city]-archived` and locks it (no new messages)
3. Posts in `#pulse`:

```
🗃️ bitsnbytes-prayagraj has been archived.
reason: no activity in 90 days
the branch can be revived — reach out to hello@gobitsnbytes.org
```

4. Updates Notion Fork Registry: sets status to `Archived`

---

### F7 — `/forks` (public)

**Who:** Any member
**Where:** Any channel

Lists all active forks with their lead and status.

**Bot response (ephemeral — only visible to the user who ran it):**

```
🍴 active bits&bytes forks

bitsnbytes-prayagraj  →  @Shashwat  (active)
bitsnbytes-lucknow    →  pending

total: 1 active  |  1 pending
```

Data pulled from Notion Fork Registry via Notion API.

---

### F8 — Stale Fork Detector (scheduled job)

**Who:** Automated (no user interaction)
**Frequency:** Runs every 7 days

The bot checks the Notion Fork Registry for any fork where `Last Pulse` date is older than 60 days.

For each stale fork found:
- Pings the fork lead in `#leads-council`: `"hey @user — bitsnbytes-[city] hasn't had a pulse in 60 days. drop a /pulse update or the branch may be archived."`
- If no response in 30 more days → pings `@team` in `#team-forks` to review for archival

---

### F9 — Automod

**Who:** Automated
**Scope:** All public channels

Rules:
- Block external Discord invite links → delete message, warn user in channel (1 warning before kick)
- Block mass mentions (5+ @mentions in one message) → delete, warn
- Spam filter: 5+ messages in 5 seconds from same user → 10-minute timeout
- Log all actions to `#team-ops`

---

## Notion Integration

The bot connects to the Notion API using an integration token.

**Database:** Fork Registry (`collection://bf96aa15-d1da-45e1-8488-15d3a71b7a41`)

| Discord Action | Notion Write |
|---------------|-------------|
| `/merge` | Status: Pending → Active, Discord handle set |
| `/pulse` | Last Pulse date updated |
| `/archive` | Status → Archived |
| `/forks` | Read all rows, filter by Status = Active/Pending |

---

## Environment Variables

```env
DISCORD_TOKEN=
DISCORD_CLIENT_ID=1490422414847381584
GUILD_ID=
NOTION_TOKEN=
NOTION_FORK_REGISTRY_DB=bf96aa15-d1da-45e1-8488-15d3a71b7a41
FORK_HANDBOOK_URL=https://www.notion.so/33949ed2fc33814a9573d08bb1685027
```

---

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Runtime | Node.js 20 | Team is JS-native |
| Discord library | discord.js v14 | Industry standard, slash command support |
| Notion sync | `@notionhq/client` | Official SDK |
| Scheduler | `node-cron` | Lightweight, no infra needed |
| Hosting | Fly.io (free tier) | Always-on, no sleep |
| Config | `.env` via `dotenv` | Standard |

---

## File Structure

```
bnb-bot/
├── index.js              # Entry point, client init, event listeners
├── deploy-commands.js    # One-time slash command registration script
├── .env                  # Secrets (gitignored)
├── commands/
│   ├── fork-request.js
│   ├── merge.js
│   ├── pulse.js
│   ├── archive.js
│   └── forks.js
├── events/
│   ├── ready.js          # Reaction roles setup
│   ├── guildMemberAdd.js # Welcome DM
│   ├── messageCreate.js  # Automod
│   └── reactionAdd.js    # Role assignment
├── jobs/
│   └── staleCheck.js     # 7-day cron job
├── lib/
│   ├── notion.js         # Notion API helpers
│   └── roles.js          # Reaction role map
└── package.json
```

---

## V1 Scope Summary

| Feature | V1 | Later |
|---------|----|----|
| Reaction roles | ✅ | — |
| Welcome DM | ✅ | — |
| `/fork-request` | ✅ | — |
| `/merge` | ✅ | — |
| `/pulse` | ✅ | — |
| `/archive` | ✅ | — |
| `/forks` | ✅ | — |
| Stale fork detector | ✅ | — |
| Automod | ✅ | — |
| Notion sync | ✅ | — |
| Web dashboard | — | v2 |
| AI summaries of pulse updates | — | v2 |
| Multi-language support | — | v2 |

---

*Built for Bits&Bytes — gobitsnbytes.org*
