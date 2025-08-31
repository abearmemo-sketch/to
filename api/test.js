export default function handler(req, res) {
  const token = process.env.TTTT_TOKEN;
  if (!token) {
    res.status(500).json({ error: "環境變數 TTTT_TOKEN 沒有設定成功" });
  } else {
    res.status(200).json({ message: "成功讀到環境變數", token_sample: token.slice(0, 5) + "..." });
  }
}
