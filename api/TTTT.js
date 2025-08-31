import fetch from "node-fetch";

export default async function handler(req, res) {
  const apiToken = process.env.TTTT_TOKEN;

  if (!apiToken) {
    return res.status(500).json({ error: "沒有設定 TTTT_TOKEN" });
  }

  try {
    const response = await fetch("https://api.track.toggl.com/api/v8/time_entries/current", {
      headers: {
        "Authorization": "Basic " + Buffer.from(apiToken + ":api_token").toString("base64"),
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      return res.status(500).json({ error: "Toggl API 讀取失敗" });
    }

    const data = await response.json();
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).json(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
