# HCCB Site — Project Reference

**Live URL:** https://hccb-site.vercel.app  
**GitHub:** https://github.com/dcmkhu-star/hccb  
**Local files:** `C:\New project\HCCB\`

---

## File Structure

```
HCCB/
├── index.html                  ← The entire public website (single file)
├── admin/
│   └── index.html              ← CMS admin dashboard (login, announcements, events)
├── api/
│   └── meetup-events.js        ← Vercel serverless function — fetches Meetup RSS
├── netlify/functions/
│   └── meetup-events.js        ← Same function, Netlify format (backup)
├── assets/
│   └── hccb-logo.png           ← HCCB logo (transparent PNG)
├── vercel.json                 ← Vercel deployment config
├── netlify.toml                ← Netlify config (if ever switching)
├── supabase-schema.sql         ← Database setup SQL (run when activating CMS)
├── .env.example                ← Environment variable template
└── .gitignore                  ← Excludes .env, node_modules
```

---

## What's Inside `index.html`

### Sections (top to bottom)
| Section | ID | What it does |
|---|---|---|
| Announcement Banner | — | Teal bar at top — pulls from Supabase CMS when active |
| Ticker bar | — | Live status strip — shows next paddle date |
| Nav | — | Logo + links + Donate + RSVP buttons |
| Hero | — | Big heading, lede, next paddle card |
| Value strip | — | Scrolling marquee |
| Schedule / RSVP | `#rsvp` | 5-tab event listing |
| How it works | `#how` | 4-step explainer |
| Programs | `#programs` | 5 program cards (paddle, outrigger, etc.) |
| Live Events | `#events` | Meetup RSS event cards (separate from tabs above) |
| Volunteer | `#volunteer` | Recruiting section |
| Instagram feed | — | 6-slot photo grid (placeholders) |
| FAQ | `#faq` | Accordion with 7 questions |
| Donate | — | Amount picker + modal with 3 real payment links |
| Map | `#visit` | Ghibli illustrated SVG map (Hoboken + Manhattan) |
| Footer | — | Links, social, address |
| Wave bar | — | Fixed teal wave at bottom of every screen |

### RSVP Tabs (currently prototype/hardcoded data)
| Tab | Content |
|---|---|
| Free Paddle Days | 6 upcoming paddle sessions |
| River Trips | 3 volunteer river trips |
| Volunteer Shifts | 4 volunteer shifts |
| Planet Patrol | 2 litter-pick cleanups |
| Volunteer Trips & Training | 2 training sessions |

> **Note:** When Meetup integration is restored, each tab will pull live from RSS automatically.

### Key React Components
| Component | What it does |
|---|---|
| `AnnouncementBanner` | Fetches published announcement from Supabase, shows teal bar |
| `Session` | Single event card in the RSVP tabs (prototype data) |
| `EventCard` | Event card in the Live Events section (Meetup data + CMS status) |
| `LiveEvents` | Fetches Meetup RSS, groups by category, renders EventCard grid |
| `App` | Root — holds all state, renders everything |

### Meetup Event Fetching (how it works now)
1. Tries `/api/meetup-events` (Vercel serverless function) first
2. If that fails, falls back to fetching Meetup RSS via CORS proxy (`allorigins.win`)
3. Parses RSS, categorises each event by title keywords
4. Displays in the Live Events section

### Event Colour Bars (Supabase-driven, not active yet)
When Supabase is set up, each Meetup event card can show:
- **Green bar** — spots available (shows fill %)
- **Orange bar** — full, join waitlist
- **Red bar** — registration closed

---

## Admin Panel (`admin/index.html`)

### Access
Open `https://hccb-site.vercel.app/admin/` — login with email/password  
*(Not active until Supabase is configured — see below)*

### Panels
| Panel | Who can use | What it does |
|---|---|---|
| Announcements | Admin + Editor | Edit the homepage banner text, publish/unpublish |
| Events Status | Admin + Editor | Set RSVP count and open/waitlist/closed status per event |
| Users & Roles | Admin only | View users, change roles (admin / editor / viewer) |

### Roles
| Role | Can do |
|---|---|
| Admin | Everything — edit content, publish, manage users, see all code |
| Editor | Edit announcements and event status only |
| Viewer | Log in and preview drafts, cannot edit or publish |

---

## Supabase CMS (not active yet)

### To activate
1. Create a free project at **supabase.com**
2. Go to **SQL Editor → New Query**, paste contents of `supabase-schema.sql`, run it
3. Go to **Authentication → Users → Invite user** — invite yourself (`dcmkhu@gmail.com`)
4. Run the last SQL block in `supabase-schema.sql` (with your email) to make yourself admin
5. In **both** `index.html` and `admin/index.html`, replace:
   ```
   YOUR_SUPABASE_URL       → Project Settings → API → Project URL
   YOUR_SUPABASE_ANON_KEY  → Project Settings → API → anon public key
   ```
6. Push to GitHub → Vercel auto-deploys

### Database tables
| Table | Stores |
|---|---|
| `user_roles` | id, role (admin/editor/viewer), email |
| `announcements` | content text, is_published, updated_by |
| `event_meta` | meetup_url, total_spots, rsvp_count, status (open/waitlist/closed) |
| `page_sections` | page (faq/volunteer/about), section_key, rich text content |

---

## Meetup Integration

### Current state
- RSS feed URL: `https://www.meetup.com/Hoboken-Cove-Community-Boathouse/events/rss/`
- No API key required — public RSS, free forever
- Serverless function: `api/meetup-events.js`

### Event categorisation (keyword matching in `api/meetup-events.js`)
| Category | Matched by title/description containing |
|---|---|
| `paddle` | "free kayak", "paddle day", "free public", "maxwell" |
| `volunteer` | "help with our public program", "beach crew", "boat crew", "volunteer orientation" |
| `trips` | "liberty island", "circumnavigation", "brooklyn bridge", "red hook" |
| `patrol` | "planet patrol" |
| `training` | everything else (catch-all) |

> If events aren't showing in the right tab, the event title on Meetup doesn't match these keywords. Add the relevant keyword to the list in `api/meetup-events.js`.

---

## Deployment

### How to redeploy after changes
```powershell
cd "C:\New project\HCCB"
git add -A
git commit -m "your message here"
git push origin master
vercel --prod --yes
```

> Vercel also auto-deploys on every `git push` since the GitHub repo is connected.

### URLs
| Environment | URL |
|---|---|
| Live site | https://hccb-site.vercel.app |
| GitHub repo | https://github.com/dcmkhu-star/hccb |
| Vercel dashboard | https://vercel.com/dcmkhu-stars-projects/hccb-site |

---

## Donate Links (already wired up and live)
| Platform | Link |
|---|---|
| Givebutter | https://givebutter.com/FXNJQR |
| Bidding for Good | https://www.biddingforgood.com/auction/AuctionHome.action?auctionId=370066308 |
| Venmo | https://venmo.com/u/HobokenCoveBoathouse |

---

## Pending / Next Steps
- [ ] Activate Supabase CMS (credentials + schema setup)
- [ ] Upload real HCCB photos to replace placeholder slots
- [ ] Wire live Meetup data into the RSVP tabs (currently prototype/hardcoded)
- [ ] Test Meetup event categorisation against real event titles
- [ ] Custom domain (when ready)
- [ ] Add "About" and full volunteer page content via CMS
