const RSS_URL =
  "https://www.meetup.com/Hoboken-Cove-Community-Boathouse/events/rss/";

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

// ── helpers ───────────────────────────────────────────
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
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 240);
}

// Convert a Date to Eastern Time date + 24h time strings
function toEastern(d) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (t) => parts.find((p) => p.type === t)?.value ?? "00";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${get("hour").padStart(2, "0")}:${get("minute")}`,
  };
}

// ── RSS parser ────────────────────────────────────────
function parseRss(xml) {
  const now = Date.now();
  const events = [];
  let rest = xml;

  while (events.length < 12) {
    const start = rest.indexOf("<item>");
    if (start === -1) break;
    const end = rest.indexOf("</item>", start);
    if (end === -1) break;

    const block = rest.slice(start + 6, end);
    rest = rest.slice(end + 7);

    // title — plain or CDATA
    const title =
      between(block, "<title><![CDATA[", "]]></title>") ??
      between(block, "<title>", "</title>");

    // link — plain or CDATA, fall back to guid
    const link =
      between(block, "<link><![CDATA[", "]]></link>") ??
      between(block, "<link>", "</link>") ??
      between(block, "<guid><![CDATA[", "]]></guid>") ??
      between(block, "<guid>", "</guid>");

    // pubDate = event start time in Meetup RSS
    const pubDate = between(block, "<pubDate>", "</pubDate>");

    // description HTML
    const rawDesc =
      between(block, "<description><![CDATA[", "]]></description>") ??
      between(block, "<description>", "</description>");

    if (!title || !link || !pubDate) continue;

    const eventDate = new Date(pubDate);
    if (isNaN(eventDate) || eventDate.getTime() < now) continue; // skip past/invalid

    const { date, time } = toEastern(eventDate);

    events.push({
      id: link,
      name: title.trim(),
      date,
      time,
      description: rawDesc ? stripHtml(rawDesc) : "",
      url: link.trim(),
      spots: null,
      totalSpots: null,
      rsvpCount: 0,
    });
  }

  return events;
}

// ── handler ───────────────────────────────────────────
exports.handler = async function () {
  try {
    const res = await fetch(RSS_URL, {
      headers: { "User-Agent": "HCCB-Site/1.0" },
    });

    if (!res.ok) throw new Error(`RSS feed returned HTTP ${res.status}`);

    const xml = await res.text();
    const events = parseRss(xml);

    return { statusCode: 200, headers: CORS, body: JSON.stringify(events) };
  } catch (err) {
    console.error("meetup-events:", err.message);
    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
