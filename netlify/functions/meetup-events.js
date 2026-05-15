const RSS_URL =
  "https://www.meetup.com/Hoboken-Cove-Community-Boathouse/events/rss/";

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

// ── Categorise by event title / description ───────────────────
// Order matters: most specific patterns first
function categorize(name, description = "") {
  const t = (name + " " + description).toLowerCase();

  if (t.includes("planet patrol"))                                     return "patrol";

  // River trips — named destinations or explicit trip label
  if (
    t.includes("liberty island") || t.includes("circumnavigation") ||
    t.includes("brooklyn bridge") || t.includes("red hook") ||
    t.includes("governor") || t.includes("day trip") ||
    t.includes("overnight") ||
    (t.includes("trip") && t.includes("volunteer"))
  )                                                                     return "trips";

  // Volunteer Shifts — "Help with our public program" wording
  if (
    t.includes("help with our public program") ||
    (t.includes("volunteer") && t.includes("free kayaking for everyone")) ||
    t.includes("beach crew") || t.includes("boat crew") ||
    t.includes("volunteer orientation") || t.includes("boat maintenance")
  )                                                                     return "volunteer";

  // Free Paddle Days — public open-water sessions
  if (
    t.includes("free kayak") || t.includes("paddle day") ||
    t.includes("free public") || t.includes("free paddl") ||
    (t.includes("maxwell") && !t.includes("volunteer"))
  )                                                                     return "paddle";

  // Everything else: training, skills sessions, misc volunteer events
  return "training";
}

// ── Helpers ───────────────────────────────────────────────────
function between(str, open, close) {
  const s = str.indexOf(open);
  if (s === -1) return null;
  const e = str.indexOf(close, s + open.length);
  if (e === -1) return null;
  return str.slice(s + open.length, e).trim();
}

function stripHtml(html) {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">").replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ").trim().slice(0, 240);
}

function toEastern(d) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(d);
  const get = (t) => parts.find((p) => p.type === t)?.value ?? "00";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${get("hour").padStart(2, "0")}:${get("minute")}`,
  };
}

// ── RSS parser ────────────────────────────────────────────────
function parseRss(xml) {
  const now = Date.now();
  const events = [];
  let rest = xml;

  while (events.length < 30) {
    const start = rest.indexOf("<item>");
    if (start === -1) break;
    const end = rest.indexOf("</item>", start);
    if (end === -1) break;

    const block = rest.slice(start + 6, end);
    rest = rest.slice(end + 7);

    const title =
      between(block, "<title><![CDATA[", "]]></title>") ??
      between(block, "<title>", "</title>");
    const link =
      between(block, "<link><![CDATA[", "]]></link>") ??
      between(block, "<link>", "</link>") ??
      between(block, "<guid><![CDATA[", "]]></guid>") ??
      between(block, "<guid>", "</guid>");
    const pubDate = between(block, "<pubDate>", "</pubDate>");
    const rawDesc =
      between(block, "<description><![CDATA[", "]]></description>") ??
      between(block, "<description>", "</description>");

    if (!title || !link || !pubDate) continue;

    const eventDate = new Date(pubDate);
    if (isNaN(eventDate) || eventDate.getTime() < now) continue;

    const { date, time } = toEastern(eventDate);
    const name        = title.trim();
    const description = rawDesc ? stripHtml(rawDesc) : "";

    events.push({
      id:         link,
      name,
      date,
      time,
      description,
      url:        link.trim(),
      category:   categorize(name, description),
      spots:      null,
      totalSpots: null,
      rsvpCount:  0,
    });
  }

  return events;
}

// ── Handler ───────────────────────────────────────────────────
exports.handler = async function () {
  try {
    const res = await fetch(RSS_URL, {
      headers: { "User-Agent": "HCCB-Site/1.0" },
    });
    if (!res.ok) throw new Error(`RSS feed returned HTTP ${res.status}`);

    const xml    = await res.text();
    const events = parseRss(xml);

    return { statusCode: 200, headers: CORS, body: JSON.stringify(events) };
  } catch (err) {
    console.error("meetup-events:", err.message);
    return {
      statusCode: 200,
      headers:    CORS,
      body:       JSON.stringify({ error: err.message }),
    };
  }
};
