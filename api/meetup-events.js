const RSS_URL =
  "https://www.meetup.com/Hoboken-Cove-Community-Boathouse/events/rss/";

function categorize(name, description = "") {
  const t = (name + " " + description).toLowerCase();
  if (t.includes("planet patrol"))                                     return "patrol";
  if (t.includes("liberty island") || t.includes("circumnavigation") ||
      t.includes("brooklyn bridge") || t.includes("red hook") ||
      t.includes("day trip") ||
      (t.includes("trip") && t.includes("volunteer")))                 return "trips";
  if (t.includes("help with our public program") ||
      (t.includes("volunteer") && t.includes("free kayaking for everyone")) ||
      t.includes("beach crew") || t.includes("boat crew") ||
      t.includes("volunteer orientation") || t.includes("boat maintenance")) return "volunteer";
  if (t.includes("free kayak") || t.includes("paddle day") ||
      t.includes("free public") || t.includes("free paddl") ||
      (t.includes("maxwell") && !t.includes("volunteer")))             return "paddle";
  return "training";
}

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
    const name = title.trim();
    const description = rawDesc ? stripHtml(rawDesc) : "";
    events.push({
      id: link, name, date, time, description,
      url: link.trim(),
      category: categorize(name, description),
      spots: null, totalSpots: null, rsvpCount: 0,
    });
  }
  return events;
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");
  try {
    const r = await fetch(RSS_URL, { headers: { "User-Agent": "HCCB-Site/1.0" } });
    if (!r.ok) throw new Error(`RSS ${r.status}`);
    const xml = await r.text();
    res.status(200).json(parseRss(xml));
  } catch (err) {
    res.status(200).json({ error: err.message });
  }
};
