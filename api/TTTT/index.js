export default async function handler(req, res) {
  const token = process.env.TTTT_TOKEN;
  if (!token) return res.status(500).json({ error: "環境變數 TTTT_TOKEN 沒有設定" });

  const headers = {
    "Authorization": "Basic " + Buffer.from(`${token}:api_token`).toString("base64"),
    "Content-Type": "application/json",
  };

  try {
    // 先取得使用者資訊
    const userRes = await fetch("https://api.track.toggl.com/api/v9/me", { headers });
    const userData = await userRes.json();
    const workspaceId = userData.default_workspace_id;

    if (req.method === "GET") {
      // 取得當前計時器
      const timerRes = await fetch("https://api.track.toggl.com/api/v9/me/time_entries/current", { headers });
      const timerData = await timerRes.json();
      return res.status(200).json({ user: userData, current_timer: timerData, workspace_id: workspaceId });

    } else if (req.method === "POST") {
      const { action, description } = req.body;

      if (action === "start") {
        if (!description) return res.status(400).json({ error: "需要描述" });
        const startRes = await fetch(`https://api.track.toggl.com/api/v9/workspaces/${workspaceId}/time_entries`, {
          method: "POST",
          headers,
          body: JSON.stringify({ description }),
        });
        const startData = await startRes.json();
        return res.status(200).json(startData);

      } else if (action === "stop") {
        // 先拿當前計時器 ID
        const timerRes = await fetch("https://api.track.toggl.com/api/v9/me/time_entries/current", { headers });
        const timerData = await timerRes.json();
        if (!timerData?.id) return res.status(400).json({ error: "沒有正在計時" });

        const stopRes = await fetch(`https://api.track.toggl.com/api/v9/time_entries/${timerData.id}/stop`, {
          method: "PATCH",
          headers,
        });
        const stopData = await stopRes.json();
        return res.status(200).json(stopData);

      } else if (action === "update") {
        // 修改描述
        const { newDescription } = req.body;
        const timerRes = await fetch("https://api.track.toggl.com/api/v9/me/time_entries/current", { headers });
        const timerData = await timerRes.json();
        if (!timerData?.id) return res.status(400).json({ error: "沒有正在計時" });

        const updateRes = await fetch(`https://api.track.toggl.com/api/v9/time_entries/${timerData.id}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({ description: newDescription }),
        });
        const updateData = await updateRes.json();
        return res.status(200).json(updateData);

      } else {
        return res.status(400).json({ error: "未知 action" });
      }
    } else {
      return res.status(405).json({ error: "只支援 GET / POST" });
    }

  } catch (err) {
    return res.status(500).json({ error: "伺服器錯誤", details: err.message });
  }
}
