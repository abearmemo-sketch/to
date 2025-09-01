import { Buffer } from 'buffer';

export default async function handler(req, res) {
  try {
    const token = process.env.TTTT_TOKEN;
    const workspaceId = process.env.TTTT_WORKSPACE_ID;

    if (!token) {
      return res.status(500).json({ error: "環境變數 TTTT_TOKEN 沒有設定" });
    }
    // 即使沒有設定，也允許繼續，讓測試頁面能顯示 null
    // if (!workspaceId) {
    //   return res.status(500).json({ error: "環境變數 TTTT_WORKSPACE_ID 沒有設定" });
    // }

    const headers = {
      "Authorization": "Basic " + Buffer.from(`${token}:api_token`).toString("base64"),
      "Content-Type": "application/json",
    };

    // GET 請求：查詢當前計時器或執行測試
    if (req.method === 'GET') {
      // 檢查是否有測試 workspaceId 的請求
      if (req.query.action === 'test_wid') {
        const userRes = await fetch("https://api.track.toggl.com/api/v9/me", { headers });
        const userData = await userRes.json();
        
        return res.status(200).json({
          user_id: userData.id,
          user_default_workspace_id: userData.default_workspace_id,
          api_read_workspace_id: workspaceId // 傳回程式讀取到的環境變數值
        });
      }

      // 原始的 GET 請求邏輯
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

      if (!workspaceId) {
        return res.status(500).json({ error: "環境變數 TTTT_WORKSPACE_ID 沒有設定" });
      }

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
        
        if (!startRes.ok) {
          const errorData = await startRes.json();
          console.error("啟動失敗的 API 回應:", errorData);
          return res.status(startRes.status).json({
            error: "Toggl API 啟動失敗",
            details: errorData,
          });
        }
        
        const startData = await startRes.json();
        return res.status(200).json({ message: "任務已啟動", time_entry: startData });

      } else if (action === 'stop') {
        const timerRes = await fetch("https://api.track.toggl.com/api/v9/me/time_entries/current", { headers });
        const currentTimer = await timerRes.json();

        if (!currentTimer || !currentTimer.id) {
