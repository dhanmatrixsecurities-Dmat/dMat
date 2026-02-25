const sendTradeNotification = async (stockName: string, type: 'BUY' | 'SELL') => {
  try {
    console.log('🔔 Starting notification send...');
    
    const usersQuery = query(
      collection(db, 'users'),
      where('status', '==', 'ACTIVE')
    );
    const snapshot = await getDocs(usersQuery);
    console.log(`👥 Found ${snapshot.docs.length} active users`);
    
    const tokens: string[] = [];
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`User ${doc.id}: fcmToken = ${data.fcmToken}`);
      if (data.fcmToken && data.fcmToken.length > 0) {
        tokens.push(data.fcmToken);
      }
    });

    console.log(`📱 Sending to ${tokens.length} tokens:`, tokens);

    if (tokens.length === 0) {
      console.warn('⚠️ No tokens found — no notifications sent');
      return;
    }

    const messages = tokens.map(token => ({
      to: token,
      sound: 'default',
      title: '📈 New Trade Alert — DhanMatrix',
      body: `New trade posted — ${stockName} ${type}`,
      data: { screen: 'active-trades' },
    }));

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    const result = await response.json();
    console.log('✅ Expo push response:', JSON.stringify(result));

  } catch (error) {
    console.error('❌ Notification error:', error);
  }
};
