let latestEntry = {}; // 暫存資料

export default function handler(req, res) {
    if (req.method === "POST") {
        latestEntry = req.body;
        res.status(200).json({ status: "ok" });
    } else if (req.method === "GET") {
        res.status(200).json(latestEntry);
    } else {
        res.status(405).json({ error: "Method not allowed" });
    }
}
