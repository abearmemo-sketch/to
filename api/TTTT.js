export default async function handler(req, res) {
  try {
    const token = process.env.TTTT_TOKEN;
    if (!token) {
      return res.status(500).json({ error: "環境變數 TTTT_TOKEN 沒有設定" });
    }

    // 先抓使用者資訊
    const userRes = await fetch("https://api.track.toggl.com/api/v9/me", {
      headers: {
        "Authorization": "Basic " + Buffer.from(`${token}:api_token`).toString("base64"),
        "Content-Type": "application/json",
      },
    });
    const userData = await userRes.json();

    // 再抓當前計時
    const timerRes = await fetch("https://api.track.toggl.com/api/v9/me/time_entries/current", {
      headers: {
        "Authorization": "Basic " + Buffer.from(`${token}:api_token`).toString("base64"),
        "Content-Type": "application/json",
      },
    });
    const timerData = await timerRes.json();

    return res.status(200).json({
      user: userData,
      current_timer: timerData,
    });

  } catch (err) {
    return res.status(500).json({ error: "伺服器錯誤", details: err.message });
  }
}
