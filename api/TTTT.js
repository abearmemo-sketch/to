export default async function handler(req, res) {
  try {
    const token = process.env.TTTT_TOKEN;
    if (!token) {
      return res.status(500).json({ error: "環境變數 TTTT_TOKEN 沒有設定" });
    }

    // 呼叫 Toggl API
    const response = await fetch("https://api.track.toggl.com/api/v9/me/time_entries/current", {
      headers: {
        "Authorization": "Basic " + Buffer.from(`${token}:api_token`).toString("base64"),
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    // 不管結果如何都顯示出來
    return res.status(response.status).json({
      status: response.status,
      raw: data,
    });

  } catch (err) {
    return res.status(500).json({ error: "伺服器錯誤", details: err.message });
  }
}
