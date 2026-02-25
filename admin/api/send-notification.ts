export default async function handler(req: any, res: any) {
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
