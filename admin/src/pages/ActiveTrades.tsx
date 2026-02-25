const sendTradeNotification = async (stockName: string, type: 'BUY' | 'SELL') => {
  try {
    const usersQuery = query(
      collection(db, 'users'),
      where('status', '==', 'ACTIVE')
    );
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
    const response = await fetch('/api/send-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokens, stockName, type }),
    });
    const result = await response.json();
    console.log('✅ Notification result:', JSON.stringify(result));
  } catch (error) {
    console.error('❌ Notification error:', error);
  }
};
