import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, where, addDoc, Timestamp } from 'firebase/firestore';

interface Trade {
  id: string;
  stockName: string;
  type: 'BUY' | 'SELL';
  price: number;
  createdAt: Timestamp;
}

const sendTradeNotification = async (stockName: string, type: 'BUY' | 'SELL') => {
  try {
    const usersQuery = query(collection(db, 'users'), where('status', '==', 'ACTIVE'));
    const snapshot = await getDocs(usersQuery);
    const tokens: string[] = [];
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.fcmToken && data.fcmToken.length > 0) {
        tokens.push(data.fcmToken);
      }
    });
    if (tokens.length === 0) {
      console.warn('No tokens found');
      return;
    }
    const messages = tokens.map(token => ({
      to: token,
      title: type === 'BUY' ? 'New BUY Trade' : 'New SELL Trade',
      body: `${stockName} - ${type} signal added`,
      sound: 'default',
    }));
    const response = await fetch('https://corsproxy.io/?' + encodeURIComponent('https://exp.host/--/api/v2/push/send'), {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });
    const result = await response.json();
    console.log('Notification result:', JSON.stringify(result));
  } catch (error) {
    console.error('Notification error:', error);
  }
};

const ActiveTrades = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [stockName, setStockName] = useState('');
  const [type, setType] = useState<'BUY' | 'SELL'>('BUY');
  const [price, setPrice] = useState('');

  useEffect(() => {
    const fetchTrades = async () => {
      const snapshot = await getDocs(collection(db, 'activeTrades'));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trade));
      setTrades(data);
    };
    fetchTrades();
  }, []);

  const handleAdd = async () => {
    if (!stockName || !price) return;
    await addDoc(collection(db, 'activeTrades'), {
      stockName,
      type,
      price: parseFloat(price),
      createdAt: Timestamp.now(),
    });
    await sendTradeNotification(stockName, type);
    setStockName('');
    setPrice('');
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Active Trades</h2>
      <div style={{ marginBottom: 16 }}>
        <input placeholder="Stock Name" value={stockName} onChange={e => setStockName(e.target.value)} style={{ marginRight: 8 }} />
        <input placeholder="Price" value={price} onChange={e => setPrice(e.target.value)} style={{ marginRight: 8 }} />
        <select value={type} onChange={e => setType(e.target.value as 'BUY' | 'SELL')} style={{ marginRight: 8 }}>
          <option value="BUY">BUY</option>
          <option value="SELL">SELL</option>
        </select>
        <button onClick={handleAdd}>Add Trade</button>
      </div>
      <ul>
        {trades.map(trade => (
          <li key={trade.id}>{trade.stockName} - {trade.type} @ {trade.price}</li>
        ))}
      </ul>
    </div>
  );
};

export default ActiveTrades; 
