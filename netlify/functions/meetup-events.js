const GROUP_URL_NAME = "Hoboken-Cove-Community-Boathouse";
const MEETUP_API = `https://api.meetup.com/${GROUP_URL_NAME}/events`;

function stripHtml(html) {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 220);
}

exports.handler = async function () {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  try {
    const reqHeaders = { Accept: "application/json" };
    if (process.env.MEETUP_API_KEY) {
      reqHeaders["Authorization"] = `Bearer ${process.env.MEETUP_API_KEY}`;
    }

    const res = await fetch(
      `${MEETUP_API}?status=upcoming&page=12&only=id,name,local_date,local_time,description,link,rsvp_limit,yes_rsvp_count`,
      { headers: reqHeaders }
    );

    if (!res.ok) {
      throw new Error(`Meetup returned ${res.status}`);
    }

    const raw = await res.json();

    const events = raw.map((e) => ({
      id: e.id,
      name: e.name,
      date: e.local_date,
      time: e.local_time || null,
      description: e.description ? stripHtml(e.description) : "",
      url: e.link,
      spots: e.rsvp_limit != null ? e.rsvp_limit - (e.yes_rsvp_count || 0) : null,
      totalSpots: e.rsvp_limit || null,
      rsvpCount: e.yes_rsvp_count || 0,
    }));

    return { statusCode: 200, headers, body: JSON.stringify(events) };
  } catch (err) {
    console.error("meetup-events:", err.message);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
