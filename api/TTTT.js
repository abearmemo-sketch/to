// /api/TTTT.js
export default async function handler(req, res) {
    try {
        const token = process.env.TTTT_TOKEN;
        if (!token) return res.status(500).json({ error: "環境變數 TTTT_TOKEN 沒有設定" });

        const authHeader = {
            "Authorization": "Basic " + Buffer.from(`${token}:api_token`).toString("base64"),
            "Content-Type": "application/json",
        };

        const userRes = await fetch("https://api.track.toggl.com/api/v9/me", { headers: authHeader });
        const userData = await userRes.json();

        if (req.method === "GET") {
            const timerRes = await fetch("https://api.track.toggl.com/api/v9/me/time_entries/current", { headers: authHeader });
            const timerData = await timerRes.json();
            return res.status(200).json({ user: userData, current_timer: timerData });
        }

        if (req.method === "POST") {
            const { action, description } = req.body;

            // 取得當前計時器
            const currentRes = await fetch("https://api.track.toggl.com/api/v9/me/time_entries/current", { headers: authHeader });
            const currentTimer = await currentRes.json();

            if (action === "start") {
                const startRes = await fetch("https://api.track.toggl.com/api/v9/time_entries/start", {
                    method: "POST",
                    headers: authHeader,
                    body: JSON.stringify({ time_entry: { description, workspace_id: userData.default_workspace_id } })
                });
                const startData = await startRes.json();
                return res.status(200).json(startData);
            }

            if (action === "stop") {
                if (!currentTimer.id) return res.status(400).json({ error: "目前沒有計時器" });
                const stopRes = await fetch(`https://api.track.toggl.com/api/v9/time_entries/${currentTimer.id}/stop`, {
                    method: "PATCH",
                    headers: authHeader
                });
                const stopData = await stopRes.json();
                return res.status(200).json(stopData);
            }

            if (action === "update") {
                if (!currentTimer.id) return res.status(400).json({ error: "目前沒有計時器" });
                const updateRes = await fetch(`https://api.track.toggl.com/api/v9/time_entries/${currentTimer.id}`, {
                    method: "PATCH",
                    headers: authHeader,
                    body: JSON.stringify({ time_entry: { description } })
                });
                const updateData = await updateRes.json();
                return res.status(200).json(updateData);
            }

            return res.status(400).json({ error: "未知操作" });
        }

        return res.status(405).json({ error: "不支援此方法" });
    } catch (err) {
        return res.status(500).json({ error: "伺服器錯誤", details: err.message });
    }
}
