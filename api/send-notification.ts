export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { tokens, stockName, type } = req.body;
  const messages = tokens.map((token: string) => ({
    to: token,
    sound: 'default',
    title: '📈 New Trade Alert — DhanMatrix',
    body: `New trade posted — ${stockName} ${type}`,
    data: { screen: 'active-trades' },
  }));

  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(messages),
  });

  const result = await response.json();
  res.status(200).json(result);
}
```

5. Click **"Commit changes"**

---

**Step 2 — Update ActiveTrades.tsx**

Go to `admin/src/pages/ActiveTrades.tsx`, find this line:
```
body: JSON.stringify({ tokens, stockName, type }),
```

Just above it, find the fetch URL and change it to:
```
const response = await fetch('https://d-mat-gamma.vercel.app/api/send-notification', {
