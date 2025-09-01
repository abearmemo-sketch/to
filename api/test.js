import { Buffer } from 'buffer';

export default async function handler(req, res) {
  try {
    // 1. 檢查環境變數
    const token = process.env.TTTT_TOKEN;
    const workspaceId = process.env.TTTT_WORKSPACE_ID;

    if (!token) {
      return res.status(500).json({ error: "Missing TTTT_TOKEN", message: "請檢查 Vercel 環境變數設定" });
    }

    if (!workspaceId) {
      return res.status(500).json({ error: "Missing TTTT_WORKSPACE_ID", message: "請檢查 Vercel 環境變數設定" });
    }

    const headers = {
      "Authorization": "Basic " + Buffer.from(`${token}:api_token`).toString("base64"),
      "Content-Type": "application/json",
    };

    // 2. 透過 Toggl 官方 API 獲取使用者資訊
    const userRes = await fetch("https://api.track.toggl.com/api/v9/me", { headers });
    const userData = await userRes.json();
    
    // 3. 檢查 Toggl 官方 API 是否回傳錯誤
    if (!userRes.ok) {
        return res.status(userRes.status).json({
            error: "Toggl API Authentication Failed",
            message: "請檢查 TTTT_TOKEN 是否正確或已過期",
            details: userData
        });
    }

    const defaultWorkspaceId = userData.default_workspace_id;
    const isWorkspaceIdMatching = (defaultWorkspaceId.toString() === workspaceId.toString());

    // 4. 嘗試啟動一個任務
    const testDescription = `測試任務 - ${new Date().toISOString()}`;
    const startRes = await fetch(`https://api.track.toggl.com/api/v9/workspaces/${workspaceId}/time_entries`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        description: testDescription,
        created_with: "Toggl Test API",
        start: new Date().toISOString(),
        billable: false,
      }),
    });
    
    let startStatus = startRes.status;
    let startData = await startRes.json();

    // 5. 停止測試任務（如果成功啟動）
    if (startRes.ok && startData.id) {
        await fetch(`https://api.track.toggl.com/api/v9/workspaces/${workspaceId}/time_entries/${startData.id}/stop`, {
            method: 'PATCH',
            headers,
        });
    }

    // 6. 總結所有資訊並回傳
    res.status(200).json({
      summary: "Toggl API 診斷報告",
      environment_variables: {
        token_found: !!token,
        workspace_id_found: !!workspaceId,
        api_read_workspace_id: workspaceId
      },
      toggl_account: {
        user_id: userData.id,
        user_default_workspace_id: defaultWorkspaceId,
        is_workspace_id_matching: isWorkspaceIdMatching
      },
      task_start_test: {
        status_code: startStatus,
        success: startRes.ok,
        description: testDescription,
        response: startData
      }
    });

  } catch (err) {
    console.error("Test API error:", err);
    res.status(500).json({ 
        error: "伺服器端錯誤", 
        message: "執行診斷時發生問題，可能是網路或程式碼錯誤", 
        details: err.message 
    });
  }
}
