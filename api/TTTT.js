export default async function handler(req, res) {
  try {
    const token = process.env.TTTT_TOKEN;
    if (!token) {
      return res.status(500).json({ error: "環境變數 TTTT_TOKEN 沒有設定" });
    }

    const headers = {
      "Authorization": "Basic " + Buffer.from(`${token}:api_token`).toString("base64"),
      "Content-Type": "application/json",
    };

    switch (req.method) {
      case 'GET':
        // 只呼叫當前計時器 API，降低請求次數
        const timerRes = await fetch("https://api.track.toggl.com/api/v9/me/time_entries/current", { headers });
        const timerData = await timerRes.json();
        return res.status(200).json({ current_timer: timerData });

      case 'POST':
      case 'PUT':
        const { endpoint, body } = req.body;
        if (!endpoint) {
          return res.status(400).json({ error: "需要指定 endpoint" });
        }

        const togglRes = await fetch(`https://api.track.toggl.com/api/v9${endpoint}`, {
          method: req.method,
          headers,
          body: JSON.stringify(body),
        });

        const togglData = await togglRes.json();
        return res.status(togglRes.status).json(togglData);

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

  } catch (err) {
    return res.status(500).json({ error: "伺服器錯誤", details: err.message });
  }
}
