export default async function handler(req, res) {
  try {
    // 從環境變數中讀取 Token 和 Workspace ID
    const token = process.env.TTTT_TOKEN;
    const workspaceId = process.env.TTTT_WORKSPACE_ID;

    if (!token) {
      return res.status(500).json({ error: "環境變數 TTTT_TOKEN 沒有設定" });
    }
    if (!workspaceId) {
      return res.status(500).json({ error: "環境變數 TTTT_WORKSPACE_ID 沒有設定" });
    }

    const headers = {
      "Authorization": "Basic " + Buffer.from(`${token}:api_token`).toString("base64"),
      "Content-Type": "application/json",
    };

    // GET 請求：查詢當前計時器
    if (req.method === 'GET') {
      const userRes = await fetch("https://api.track.toggl.com/api/v9/me", { headers });
      const userData = await userRes.json();

      const timerRes = await fetch("https://api.track.toggl.com/api/v9/me/time_entries/current", { headers });
      const timerData = await timerRes.json();

      return res.status(200).json({
        user: userData,
        current_timer: timerData,
      });
    }

    // POST 請求：啟動、停止或更新計時器
    if (req.method === 'POST') {
      const { action, description, id } = req.body;
      console.log(`接收到 POST 請求: action=${action}`);

      if (action === 'start') {
        if (!description) {
          return res.status(400).json({ error: "啟動任務必須提供描述" });
        }
        const startRes = await fetch(`https://api.track.toggl.com/api/v9/workspaces/${workspaceId}/time_entries`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            description: description,
            created_with: "My Custom Toggl Timer",
            start: new Date().toISOString(),
            billable: false,
          }),
        });

        const startData = await startRes.json();
        if (startRes.ok) {
          return res.status(200).json({ message: "任務已啟動", time_entry: startData });
        } else {
          return res.status(startRes.status).json({ error: "Toggl API 啟動失敗", details: startData });
        }
      } else if (action === 'stop') {
        const timerRes = await fetch("https://api.track.toggl.com/api/v9/me/time_entries/current", { headers });
        const currentTimer = await timerRes.json();

        if (!currentTimer || !currentTimer.id) {
          return res.status(404).json({ error: "目前沒有正在進行的計時器" });
        }
        const stopRes = await fetch(`https://api.track.toggl.com/api/v9/workspaces/${workspaceId}/time_entries/${currentTimer.id}/stop`, {
          method: 'PATCH',
          headers,
        });

        const stopData = await stopRes.json();
        if (stopRes.ok) {
          return res.status(200).json({ message: "任務已停止", time_entry: stopData });
        } else {
          return res.status(stopRes.status).json({ error: "Toggl API 停止失敗", details: stopData });
        }
      } else if (action === 'update') {
        if (!id || !description) {
          return res.status(400).json({ error: "更新任務必須提供 ID 和描述" });
        }
        const updateRes = await fetch(`https://api.track.toggl.com/api/v9/workspaces/${workspaceId}/time_entries/${id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            description: description,
          }),
        });

        const updateData = await updateRes.json();
        if (updateRes.ok) {
          return res.status(200).json({ message: "任務已更新", time_entry: updateData });
        } else {
          return res.status(updateRes.status).json({ error: "Toggl API 更新失敗", details: updateData });
        }
      } else {
        return res.status(400).json({ error: "無效的操作" });
      }
    }

    return res.status(405).json({ error: "不允許的請求方法" });

  } catch (err) {
    console.error("API 錯誤:", err);
    return res.status(500).json({ error: "伺服器錯誤", details: err.message });
  }
}
