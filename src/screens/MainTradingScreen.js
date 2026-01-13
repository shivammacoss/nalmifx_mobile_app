import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Alert,
  FlatList,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../config';

const Tab = createBottomTabNavigator();
const { width, height } = Dimensions.get('window');

// Default instruments
const defaultInstruments = [
  { symbol: 'EURUSD', name: 'EUR/USD', bid: 0, ask: 0, spread: 0, category: 'Forex', starred: true },
  { symbol: 'GBPUSD', name: 'GBP/USD', bid: 0, ask: 0, spread: 0, category: 'Forex', starred: true },
  { symbol: 'USDJPY', name: 'USD/JPY', bid: 0, ask: 0, spread: 0, category: 'Forex', starred: false },
  { symbol: 'XAUUSD', name: 'Gold', bid: 0, ask: 0, spread: 0, category: 'Metals', starred: true },
  { symbol: 'XAGUSD', name: 'Silver', bid: 0, ask: 0, spread: 0, category: 'Metals', starred: false },
  { symbol: 'BTCUSD', name: 'Bitcoin', bid: 0, ask: 0, spread: 0, category: 'Crypto', starred: true },
  { symbol: 'ETHUSD', name: 'Ethereum', bid: 0, ask: 0, spread: 0, category: 'Crypto', starred: false },
];

// Shared context for trading data
const TradingContext = React.createContext();

const TradingProvider = ({ children, navigation }) => {
  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [openTrades, setOpenTrades] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [tradeHistory, setTradeHistory] = useState([]);
  const [instruments, setInstruments] = useState(defaultInstruments);
  const [livePrices, setLivePrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [accountSummary, setAccountSummary] = useState({
    balance: 0, equity: 0, credit: 0, freeMargin: 0, usedMargin: 0, floatingPnl: 0
  });

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchAccounts(user._id);
    }
  }, [user]);

  useEffect(() => {
    if (selectedAccount) {
      fetchOpenTrades();
      fetchPendingOrders();
      fetchTradeHistory();
      fetchAccountSummary();
      
      const interval = setInterval(() => {
        fetchOpenTrades();
        fetchAccountSummary();
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [selectedAccount]);

  useEffect(() => {
    fetchLivePrices();
    const priceInterval = setInterval(fetchLivePrices, 2000);
    return () => clearInterval(priceInterval);
  }, []);

  const loadUser = async () => {
    try {
      const userData = await SecureStore.getItemAsync('user');
      if (userData) {
        setUser(JSON.parse(userData));
      } else {
        navigation.replace('Login');
      }
    } catch (e) {
      console.error('Error loading user:', e);
    }
    setLoading(false);
  };

  const fetchAccounts = async (userId) => {
    try {
      const res = await fetch(`${API_URL}/trading-accounts/user/${userId}`);
      const data = await res.json();
      setAccounts(data.accounts || []);
      if (data.accounts?.length > 0) {
        setSelectedAccount(data.accounts[0]);
      }
    } catch (e) {
      console.error('Error fetching accounts:', e);
    }
  };

  const fetchOpenTrades = async () => {
    if (!selectedAccount) return;
    try {
      const res = await fetch(`${API_URL}/trade/open/${selectedAccount._id}`);
      const data = await res.json();
      if (data.success) setOpenTrades(data.trades || []);
    } catch (e) {}
  };

  const fetchPendingOrders = async () => {
    if (!selectedAccount) return;
    try {
      const res = await fetch(`${API_URL}/trade/pending/${selectedAccount._id}`);
      const data = await res.json();
      if (data.success) setPendingOrders(data.orders || []);
    } catch (e) {}
  };

  const fetchTradeHistory = async () => {
    if (!selectedAccount) return;
    try {
      const res = await fetch(`${API_URL}/trade/history/${selectedAccount._id}?limit=50`);
      const data = await res.json();
      if (data.success) setTradeHistory(data.trades || []);
    } catch (e) {}
  };

  const fetchAccountSummary = async () => {
    if (!selectedAccount) return;
    try {
      const res = await fetch(`${API_URL}/trade/summary/${selectedAccount._id}`);
      const data = await res.json();
      if (data.success) setAccountSummary(data.summary);
    } catch (e) {}
  };

  const fetchLivePrices = async () => {
    try {
      const symbols = instruments.map(i => i.symbol);
      const res = await fetch(`${API_URL}/prices/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols })
      });
      const data = await res.json();
      if (data.success && data.prices) {
        setLivePrices(prev => {
          const merged = { ...prev };
          Object.entries(data.prices).forEach(([symbol, price]) => {
            if (price && price.bid) merged[symbol] = price;
          });
          return merged;
        });
        
        setInstruments(prev => prev.map(inst => {
          const price = data.prices[inst.symbol];
          if (price && price.bid) {
            return { ...inst, bid: price.bid, ask: price.ask || price.bid, spread: Math.abs((price.ask || price.bid) - price.bid) };
          }
          return inst;
        }));
      }
    } catch (e) {}
  };

  const calculatePnl = (trade) => {
    const prices = livePrices[trade.symbol];
    if (!prices || !prices.bid) return trade._lastPnl || 0;
    const currentPrice = trade.side === 'BUY' ? prices.bid : prices.ask;
    const contractSize = trade.contractSize || 100000;
    const pnl = trade.side === 'BUY'
      ? (currentPrice - trade.openPrice) * trade.quantity * contractSize
      : (trade.openPrice - currentPrice) * trade.quantity * contractSize;
    trade._lastPnl = pnl;
    return pnl;
  };

  const hasValidPrices = Object.keys(livePrices).length > 0 && openTrades.some(t => livePrices[t.symbol]?.bid > 0);
  const totalFloatingPnl = hasValidPrices 
    ? openTrades.reduce((sum, trade) => sum + calculatePnl(trade), 0)
    : (accountSummary.floatingPnl || 0);
  const totalUsedMargin = openTrades.reduce((sum, trade) => sum + (trade.marginUsed || 0), 0);
  const realTimeEquity = (accountSummary.balance || 0) + (accountSummary.credit || 0) + totalFloatingPnl;
  const realTimeFreeMargin = realTimeEquity - totalUsedMargin;

  const logout = async () => {
    await SecureStore.deleteItemAsync('user');
    await SecureStore.deleteItemAsync('token');
    navigation.replace('Login');
  };

  return (
    <TradingContext.Provider value={{
      user, accounts, selectedAccount, setSelectedAccount,
      openTrades, pendingOrders, tradeHistory, instruments, livePrices,
      loading, accountSummary, totalFloatingPnl, realTimeEquity, realTimeFreeMargin,
      fetchOpenTrades, fetchPendingOrders, fetchTradeHistory, fetchAccountSummary,
      calculatePnl, logout
    }}>
      {children}
    </TradingContext.Provider>
  );
};

// HOME TAB
const HomeTab = () => {
  const ctx = React.useContext(TradingContext);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await ctx.fetchAccountSummary();
    await ctx.fetchOpenTrades();
    setRefreshing(false);
  };

  if (ctx.loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#00d4aa" />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00d4aa" />}
    >
      {/* Header */}
      <View style={styles.homeHeader}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{ctx.user?.firstName || 'Trader'}</Text>
        </View>
        <TouchableOpacity style={styles.notificationBtn}>
          <Ionicons name="notifications-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Account Card */}
      {ctx.selectedAccount && (
        <View style={styles.accountCard}>
          <View style={styles.accountHeader}>
            <Text style={styles.accountId}>{ctx.selectedAccount.accountId}</Text>
            <View style={[styles.statusBadge, { backgroundColor: ctx.selectedAccount.status === 'Active' ? '#00d4aa20' : '#ff444420' }]}>
              <Text style={[styles.statusText, { color: ctx.selectedAccount.status === 'Active' ? '#00d4aa' : '#ff4444' }]}>
                {ctx.selectedAccount.status}
              </Text>
            </View>
          </View>
          
          <View style={styles.balanceRow}>
            <View>
              <Text style={styles.balanceLabel}>Balance</Text>
              <Text style={styles.balanceValue}>${ctx.accountSummary.balance?.toFixed(2)}</Text>
            </View>
            <View>
              <Text style={styles.balanceLabel}>Equity</Text>
              <Text style={[styles.balanceValue, { color: ctx.totalFloatingPnl >= 0 ? '#00d4aa' : '#ff4444' }]}>
                ${ctx.realTimeEquity.toFixed(2)}
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Free Margin</Text>
              <Text style={styles.statValue}>${ctx.realTimeFreeMargin.toFixed(2)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Floating P/L</Text>
              <Text style={[styles.statValue, { color: ctx.totalFloatingPnl >= 0 ? '#00d4aa' : '#ff4444' }]}>
                {ctx.totalFloatingPnl >= 0 ? '+' : ''}${ctx.totalFloatingPnl.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Open Positions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Open Positions ({ctx.openTrades.length})</Text>
        {ctx.openTrades.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="trending-up-outline" size={48} color="#333" />
            <Text style={styles.emptyText}>No open positions</Text>
          </View>
        ) : (
          ctx.openTrades.slice(0, 3).map(trade => {
            const pnl = ctx.calculatePnl(trade);
            return (
              <View key={trade._id} style={styles.tradeItem}>
                <View style={styles.tradeLeft}>
                  <Text style={styles.tradeSymbol}>{trade.symbol}</Text>
                  <Text style={[styles.tradeSide, { color: trade.side === 'BUY' ? '#3b82f6' : '#ff4444' }]}>
                    {trade.side} {trade.quantity} lots
                  </Text>
                </View>
                <Text style={[styles.tradePnl, { color: pnl >= 0 ? '#00d4aa' : '#ff4444' }]}>
                  {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                </Text>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
};

// QUOTES TAB
const QuotesTab = ({ navigation }) => {
  const ctx = React.useContext(TradingContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const categories = ['All', 'Starred', 'Forex', 'Metals', 'Crypto'];

  const filteredInstruments = ctx.instruments.filter(inst => {
    const matchesSearch = inst.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inst.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'All' || 
      (activeCategory === 'Starred' && inst.starred) ||
      inst.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const formatSpread = (inst) => {
    if (inst.spread <= 0) return '-';
    if (inst.symbol.includes('JPY')) return (inst.spread * 100).toFixed(1);
    if (inst.bid > 100) return inst.spread.toFixed(2);
    return (inst.spread * 10000).toFixed(1);
  };

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search instruments..."
          placeholderTextColor="#666"
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>

      {/* Categories */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
        {categories.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.categoryBtn, activeCategory === cat && styles.categoryBtnActive]}
            onPress={() => setActiveCategory(cat)}
          >
            <Text style={[styles.categoryText, activeCategory === cat && styles.categoryTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Instruments List */}
      <FlatList
        data={filteredInstruments}
        keyExtractor={item => item.symbol}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.instrumentItem}
            onPress={() => navigation.navigate('Trade', { symbol: item.symbol })}
          >
            <View style={styles.instrumentLeft}>
              {item.starred && <Ionicons name="star" size={14} color="#fbbf24" style={{ marginRight: 6 }} />}
              <View>
                <Text style={styles.instrumentSymbol}>{item.symbol}</Text>
                <Text style={styles.instrumentName}>{item.name}</Text>
              </View>
            </View>
            <View style={styles.instrumentPrices}>
              <Text style={styles.bidPrice}>{item.bid > 0 ? item.bid.toFixed(item.bid > 100 ? 2 : 5) : '...'}</Text>
              <View style={styles.spreadBadge}>
                <Text style={styles.spreadText}>{formatSpread(item)}</Text>
              </View>
              <Text style={styles.askPrice}>{item.ask > 0 ? item.ask.toFixed(item.ask > 100 ? 2 : 5) : '...'}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

// TRADE TAB
const TradeTab = ({ route }) => {
  const ctx = React.useContext(TradingContext);
  const [activeSymbol, setActiveSymbol] = useState(route?.params?.symbol || 'XAUUSD');
  const [orderSide, setOrderSide] = useState('BUY');
  const [volume, setVolume] = useState('0.01');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [tradeTab, setTradeTab] = useState('positions');
  const [showOrderPanel, setShowOrderPanel] = useState(false);

  const currentInstrument = ctx.instruments.find(i => i.symbol === activeSymbol) || ctx.instruments[0];
  const currentPrice = ctx.livePrices[activeSymbol];

  const getSymbolForTradingView = (symbol) => {
    const symbolMap = {
      'EURUSD': 'OANDA:EURUSD', 'GBPUSD': 'OANDA:GBPUSD', 'USDJPY': 'OANDA:USDJPY',
      'XAUUSD': 'OANDA:XAUUSD', 'XAGUSD': 'OANDA:XAGUSD',
      'BTCUSD': 'COINBASE:BTCUSD', 'ETHUSD': 'COINBASE:ETHUSD',
    };
    return symbolMap[symbol] || `OANDA:${symbol}`;
  };

  const chartHtml = `
    <!DOCTYPE html>
    <html><head><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>body{margin:0;padding:0;background:#0a0a0a;}</style></head>
    <body>
    <div class="tradingview-widget-container" style="height:100%;width:100%">
      <div id="tradingview_chart" style="height:100%;width:100%"></div>
    </div>
    <script type="text/javascript" src="https://s3.tradingview.com/tv.js"></script>
    <script type="text/javascript">
    new TradingView.widget({
      "autosize": true,
      "symbol": "${getSymbolForTradingView(activeSymbol)}",
      "interval": "5",
      "timezone": "Etc/UTC",
      "theme": "dark",
      "style": "1",
      "locale": "en",
      "toolbar_bg": "#0a0a0a",
      "enable_publishing": false,
      "hide_top_toolbar": true,
      "hide_legend": true,
      "save_image": false,
      "container_id": "tradingview_chart",
      "backgroundColor": "#0a0a0a"
    });
    </script></body></html>
  `;

  const executeTrade = async () => {
    if (!ctx.selectedAccount) {
      Alert.alert('Error', 'Please select a trading account');
      return;
    }
    
    setIsExecuting(true);
    try {
      const price = orderSide === 'BUY' ? currentPrice?.ask : currentPrice?.bid;
      const res = await fetch(`${API_URL}/trade/open`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tradingAccountId: ctx.selectedAccount._id,
          symbol: activeSymbol,
          side: orderSide,
          quantity: parseFloat(volume),
          openPrice: price,
          stopLoss: stopLoss ? parseFloat(stopLoss) : null,
          takeProfit: takeProfit ? parseFloat(takeProfit) : null,
        })
      });
      const data = await res.json();
      if (data.success) {
        Alert.alert('Success', `${orderSide} order executed!`);
        setShowOrderPanel(false);
        ctx.fetchOpenTrades();
        ctx.fetchAccountSummary();
      } else {
        Alert.alert('Error', data.message || 'Failed to execute trade');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to execute trade');
    }
    setIsExecuting(false);
  };

  const closeTrade = async (trade) => {
    try {
      const prices = ctx.livePrices[trade.symbol];
      const closePrice = trade.side === 'BUY' ? prices?.bid : prices?.ask;
      const res = await fetch(`${API_URL}/trade/close/${trade._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ closePrice })
      });
      const data = await res.json();
      if (data.success) {
        Alert.alert('Success', `Trade closed! P/L: $${data.realizedPnl?.toFixed(2)}`);
        ctx.fetchOpenTrades();
        ctx.fetchTradeHistory();
        ctx.fetchAccountSummary();
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to close trade');
    }
  };

  return (
    <View style={styles.container}>
      {/* Chart */}
      <View style={{ height: height * 0.4 }}>
        <WebView
          source={{ html: chartHtml }}
          style={{ backgroundColor: '#0a0a0a' }}
          javaScriptEnabled={true}
        />
      </View>

      {/* Symbol & Price Bar */}
      <View style={styles.priceBar}>
        <View>
          <Text style={styles.currentSymbol}>{activeSymbol}</Text>
          <Text style={styles.currentName}>{currentInstrument?.name}</Text>
        </View>
        <View style={styles.priceDisplay}>
          <Text style={styles.bidPriceMain}>{currentPrice?.bid?.toFixed(currentPrice?.bid > 100 ? 2 : 5) || '...'}</Text>
          <Text style={styles.askPriceMain}>{currentPrice?.ask?.toFixed(currentPrice?.ask > 100 ? 2 : 5) || '...'}</Text>
        </View>
      </View>

      {/* Trade Tabs */}
      <View style={styles.tradeTabs}>
        {['positions', 'pending', 'history'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tradeTabBtn, tradeTab === tab && styles.tradeTabBtnActive]}
            onPress={() => setTradeTab(tab)}
          >
            <Text style={[styles.tradeTabText, tradeTab === tab && styles.tradeTabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'positions' && ` (${ctx.openTrades.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Positions/Pending/History List */}
      <ScrollView style={styles.tradesList}>
        {tradeTab === 'positions' && (
          ctx.openTrades.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No open positions</Text>
            </View>
          ) : (
            ctx.openTrades.map(trade => {
              const pnl = ctx.calculatePnl(trade);
              return (
                <View key={trade._id} style={styles.positionItem}>
                  <View style={styles.positionHeader}>
                    <View style={styles.positionLeft}>
                      <Text style={styles.positionSymbol}>{trade.symbol}</Text>
                      <View style={[styles.sideBadge, { backgroundColor: trade.side === 'BUY' ? '#3b82f620' : '#ff444420' }]}>
                        <Text style={[styles.sideText, { color: trade.side === 'BUY' ? '#3b82f6' : '#ff4444' }]}>{trade.side}</Text>
                      </View>
                    </View>
                    <Text style={[styles.positionPnl, { color: pnl >= 0 ? '#00d4aa' : '#ff4444' }]}>
                      {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.positionDetails}>
                    <Text style={styles.positionDetail}>{trade.quantity} lots @ {trade.openPrice?.toFixed(5)}</Text>
                    <TouchableOpacity style={styles.closeBtn} onPress={() => closeTrade(trade)}>
                      <Text style={styles.closeBtnText}>Close</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )
        )}

        {tradeTab === 'history' && (
          ctx.tradeHistory.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No trade history</Text>
            </View>
          ) : (
            ctx.tradeHistory.map(trade => (
              <View key={trade._id} style={styles.historyItem}>
                <View style={styles.historyHeader}>
                  <Text style={styles.historySymbol}>{trade.symbol}</Text>
                  <Text style={[styles.historyPnl, { color: (trade.realizedPnl || 0) >= 0 ? '#00d4aa' : '#ff4444' }]}>
                    {(trade.realizedPnl || 0) >= 0 ? '+' : ''}${(trade.realizedPnl || 0).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.historyDetails}>
                  <Text style={styles.historyDetail}>{trade.side} {trade.quantity} lots</Text>
                  {trade.closedBy === 'ADMIN' && (
                    <View style={styles.adminBadge}>
                      <Text style={styles.adminBadgeText}>Admin Close</Text>
                    </View>
                  )}
                </View>
              </View>
            ))
          )
        )}
      </ScrollView>

      {/* Trade Button */}
      <TouchableOpacity style={styles.tradeButton} onPress={() => setShowOrderPanel(true)}>
        <Text style={styles.tradeButtonText}>New Order</Text>
      </TouchableOpacity>

      {/* Order Panel Modal */}
      <Modal visible={showOrderPanel} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.orderPanel}>
            <View style={styles.orderPanelHeader}>
              <Text style={styles.orderPanelTitle}>New Order - {activeSymbol}</Text>
              <TouchableOpacity onPress={() => setShowOrderPanel(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Buy/Sell Toggle */}
            <View style={styles.sideToggle}>
              <TouchableOpacity
                style={[styles.sideBtn, orderSide === 'SELL' && styles.sideBtnSell]}
                onPress={() => setOrderSide('SELL')}
              >
                <Text style={styles.sideBtnText}>SELL</Text>
                <Text style={styles.sideBtnPrice}>{currentPrice?.bid?.toFixed(currentPrice?.bid > 100 ? 2 : 5)}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sideBtn, orderSide === 'BUY' && styles.sideBtnBuy]}
                onPress={() => setOrderSide('BUY')}
              >
                <Text style={styles.sideBtnText}>BUY</Text>
                <Text style={styles.sideBtnPrice}>{currentPrice?.ask?.toFixed(currentPrice?.ask > 100 ? 2 : 5)}</Text>
              </TouchableOpacity>
            </View>

            {/* Volume */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Volume (lots)</Text>
              <View style={styles.volumeInput}>
                <TouchableOpacity style={styles.volumeBtn} onPress={() => setVolume((parseFloat(volume) - 0.01).toFixed(2))}>
                  <Ionicons name="remove" size={20} color="#fff" />
                </TouchableOpacity>
                <TextInput
                  style={styles.volumeValue}
                  value={volume}
                  onChangeText={setVolume}
                  keyboardType="decimal-pad"
                />
                <TouchableOpacity style={styles.volumeBtn} onPress={() => setVolume((parseFloat(volume) + 0.01).toFixed(2))}>
                  <Ionicons name="add" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            {/* SL/TP */}
            <View style={styles.slTpRow}>
              <View style={styles.slTpInput}>
                <Text style={styles.inputLabel}>Stop Loss</Text>
                <TextInput
                  style={styles.input}
                  value={stopLoss}
                  onChangeText={setStopLoss}
                  placeholder="Optional"
                  placeholderTextColor="#666"
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.slTpInput}>
                <Text style={styles.inputLabel}>Take Profit</Text>
                <TextInput
                  style={styles.input}
                  value={takeProfit}
                  onChangeText={setTakeProfit}
                  placeholder="Optional"
                  placeholderTextColor="#666"
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            {/* Execute Button */}
            <TouchableOpacity
              style={[styles.executeBtn, { backgroundColor: orderSide === 'BUY' ? '#3b82f6' : '#ff4444' }]}
              onPress={executeTrade}
              disabled={isExecuting}
            >
              {isExecuting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.executeBtnText}>{orderSide} {activeSymbol}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// HISTORY TAB
const HistoryTab = () => {
  const ctx = React.useContext(TradingContext);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await ctx.fetchTradeHistory();
    setRefreshing(false);
  };

  return (
    <FlatList
      style={styles.container}
      data={ctx.tradeHistory}
      keyExtractor={item => item._id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00d4aa" />}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={48} color="#333" />
          <Text style={styles.emptyText}>No trade history</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.historyItemFull}>
          <View style={styles.historyHeader}>
            <View style={styles.historyLeft}>
              <Text style={styles.historySymbol}>{item.symbol}</Text>
              <View style={[styles.sideBadge, { backgroundColor: item.side === 'BUY' ? '#3b82f620' : '#ff444420' }]}>
                <Text style={[styles.sideText, { color: item.side === 'BUY' ? '#3b82f6' : '#ff4444' }]}>{item.side}</Text>
              </View>
              {item.closedBy === 'ADMIN' && (
                <View style={styles.adminBadge}>
                  <Text style={styles.adminBadgeText}>Admin Close</Text>
                </View>
              )}
            </View>
            <Text style={[styles.historyPnl, { color: (item.realizedPnl || 0) >= 0 ? '#00d4aa' : '#ff4444' }]}>
              {(item.realizedPnl || 0) >= 0 ? '+' : ''}${(item.realizedPnl || 0).toFixed(2)}
            </Text>
          </View>
          <View style={styles.historyMeta}>
            <Text style={styles.historyMetaText}>{item.quantity} lots</Text>
            <Text style={styles.historyMetaText}>Open: {item.openPrice?.toFixed(5)}</Text>
            <Text style={styles.historyMetaText}>Close: {item.closePrice?.toFixed(5)}</Text>
          </View>
          <Text style={styles.historyDate}>{new Date(item.closedAt).toLocaleDateString()}</Text>
        </View>
      )}
    />
  );
};

// MORE TAB
const MoreTab = ({ navigation }) => {
  const ctx = React.useContext(TradingContext);

  const menuItems = [
    { icon: 'wallet-outline', label: 'Wallet', screen: 'Wallet' },
    { icon: 'person-outline', label: 'Profile', screen: 'Profile' },
    { icon: 'copy-outline', label: 'Copy Trading', screen: 'CopyTrading' },
    { icon: 'people-outline', label: 'IB Program', screen: 'IB' },
    { icon: 'help-circle-outline', label: 'Support', screen: 'Support' },
    { icon: 'document-text-outline', label: 'Instructions', screen: 'Instructions' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.moreHeader}>
        <View style={styles.userAvatar}>
          <Text style={styles.avatarText}>{ctx.user?.firstName?.charAt(0) || 'U'}</Text>
        </View>
        <Text style={styles.moreUserName}>{ctx.user?.firstName || 'User'}</Text>
        <Text style={styles.moreUserEmail}>{ctx.user?.email}</Text>
      </View>

      <View style={styles.menuList}>
        {menuItems.map((item, index) => (
          <TouchableOpacity key={index} style={styles.menuItem}>
            <Ionicons name={item.icon} size={22} color="#00d4aa" />
            <Text style={styles.menuItemText}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={ctx.logout}>
        <Ionicons name="log-out-outline" size={22} color="#ff4444" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// MAIN SCREEN
const MainTradingScreen = ({ navigation }) => {
  return (
    <TradingProvider navigation={navigation}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: '#00d4aa',
          tabBarInactiveTintColor: '#666',
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
            else if (route.name === 'Quotes') iconName = focused ? 'stats-chart' : 'stats-chart-outline';
            else if (route.name === 'Trade') iconName = focused ? 'trending-up' : 'trending-up-outline';
            else if (route.name === 'History') iconName = focused ? 'time' : 'time-outline';
            else if (route.name === 'More') iconName = focused ? 'menu' : 'menu-outline';
            return <Ionicons name={iconName} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeTab} />
        <Tab.Screen name="Quotes" component={QuotesTab} />
        <Tab.Screen name="Trade" component={TradeTab} />
        <Tab.Screen name="History" component={HistoryTab} />
        <Tab.Screen name="More" component={MoreTab} />
      </Tab.Navigator>
    </TradingProvider>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' },
  tabBar: { backgroundColor: '#111', borderTopColor: '#222', height: 60, paddingBottom: 8 },
  
  // Home
  homeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 50 },
  greeting: { color: '#666', fontSize: 14 },
  userName: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  notificationBtn: { padding: 10, backgroundColor: '#1a1a1a', borderRadius: 12 },
  
  accountCard: { margin: 16, padding: 20, backgroundColor: '#1a1a1a', borderRadius: 16 },
  accountHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  accountId: { color: '#fff', fontSize: 16, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '600' },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  balanceLabel: { color: '#666', fontSize: 12, marginBottom: 4 },
  balanceValue: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 16, borderTopWidth: 1, borderTopColor: '#333' },
  statItem: { flex: 1 },
  statLabel: { color: '#666', fontSize: 12, marginBottom: 4 },
  statValue: { color: '#fff', fontSize: 16, fontWeight: '600' },
  
  section: { padding: 16 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 12 },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyText: { color: '#666', marginTop: 12 },
  
  tradeItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#1a1a1a', borderRadius: 12, marginBottom: 8 },
  tradeLeft: {},
  tradeSymbol: { color: '#fff', fontSize: 16, fontWeight: '600' },
  tradeSide: { fontSize: 12, marginTop: 4 },
  tradePnl: { fontSize: 16, fontWeight: '600' },
  
  // Quotes
  searchContainer: { flexDirection: 'row', alignItems: 'center', margin: 16, padding: 12, backgroundColor: '#1a1a1a', borderRadius: 12 },
  searchInput: { flex: 1, marginLeft: 10, color: '#fff', fontSize: 16 },
  categoriesContainer: { paddingHorizontal: 16, marginBottom: 8 },
  categoryBtn: { paddingHorizontal: 16, paddingVertical: 8, marginRight: 8, borderRadius: 20, backgroundColor: '#1a1a1a' },
  categoryBtnActive: { backgroundColor: '#00d4aa' },
  categoryText: { color: '#666', fontSize: 14 },
  categoryTextActive: { color: '#000', fontWeight: '600' },
  
  instrumentItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  instrumentLeft: { flexDirection: 'row', alignItems: 'center' },
  instrumentSymbol: { color: '#fff', fontSize: 16, fontWeight: '600' },
  instrumentName: { color: '#666', fontSize: 12 },
  instrumentPrices: { flexDirection: 'row', alignItems: 'center' },
  bidPrice: { color: '#ff4444', fontSize: 14, width: 70, textAlign: 'right' },
  askPrice: { color: '#00d4aa', fontSize: 14, width: 70, textAlign: 'right' },
  spreadBadge: { backgroundColor: '#2a2a2a', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginHorizontal: 8 },
  spreadText: { color: '#00bcd4', fontSize: 10 },
  
  // Trade
  priceBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#111' },
  currentSymbol: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  currentName: { color: '#666', fontSize: 12 },
  priceDisplay: { flexDirection: 'row', gap: 16 },
  bidPriceMain: { color: '#ff4444', fontSize: 16, fontWeight: '600' },
  askPriceMain: { color: '#00d4aa', fontSize: 16, fontWeight: '600' },
  
  tradeTabs: { flexDirection: 'row', backgroundColor: '#111', borderBottomWidth: 1, borderBottomColor: '#222' },
  tradeTabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tradeTabBtnActive: { borderBottomWidth: 2, borderBottomColor: '#00d4aa' },
  tradeTabText: { color: '#666', fontSize: 14 },
  tradeTabTextActive: { color: '#00d4aa', fontWeight: '600' },
  
  tradesList: { flex: 1 },
  positionItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  positionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  positionLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  positionSymbol: { color: '#fff', fontSize: 16, fontWeight: '600' },
  sideBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  sideText: { fontSize: 10, fontWeight: '600' },
  positionPnl: { fontSize: 16, fontWeight: '600' },
  positionDetails: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  positionDetail: { color: '#666', fontSize: 12 },
  closeBtn: { backgroundColor: '#ff444420', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 6 },
  closeBtnText: { color: '#ff4444', fontSize: 12, fontWeight: '600' },
  
  tradeButton: { margin: 16, padding: 16, backgroundColor: '#00d4aa', borderRadius: 12, alignItems: 'center' },
  tradeButtonText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
  
  // Order Panel
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  orderPanel: { backgroundColor: '#1a1a1a', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  orderPanelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  orderPanelTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  
  sideToggle: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  sideBtn: { flex: 1, padding: 16, borderRadius: 12, backgroundColor: '#2a2a2a', alignItems: 'center' },
  sideBtnSell: { backgroundColor: '#ff4444' },
  sideBtnBuy: { backgroundColor: '#3b82f6' },
  sideBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  sideBtnPrice: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 4 },
  
  inputGroup: { marginBottom: 16 },
  inputLabel: { color: '#666', fontSize: 12, marginBottom: 8 },
  volumeInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2a2a2a', borderRadius: 12 },
  volumeBtn: { padding: 16 },
  volumeValue: { flex: 1, textAlign: 'center', color: '#fff', fontSize: 18, fontWeight: '600' },
  
  slTpRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  slTpInput: { flex: 1 },
  input: { backgroundColor: '#2a2a2a', borderRadius: 12, padding: 14, color: '#fff', fontSize: 16 },
  
  executeBtn: { padding: 16, borderRadius: 12, alignItems: 'center' },
  executeBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  
  // History
  historyItemFull: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historyLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  historySymbol: { color: '#fff', fontSize: 16, fontWeight: '600' },
  historyPnl: { fontSize: 16, fontWeight: '600' },
  historyMeta: { flexDirection: 'row', gap: 16, marginTop: 8 },
  historyMetaText: { color: '#666', fontSize: 12 },
  historyDate: { color: '#444', fontSize: 11, marginTop: 8 },
  historyItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  historyDetails: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  historyDetail: { color: '#666', fontSize: 12 },
  adminBadge: { backgroundColor: '#fbbf2420', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  adminBadgeText: { color: '#fbbf24', fontSize: 10 },
  
  // More
  moreHeader: { alignItems: 'center', padding: 30, paddingTop: 60 },
  userAvatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#00d4aa', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#000', fontSize: 32, fontWeight: 'bold' },
  moreUserName: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginTop: 12 },
  moreUserEmail: { color: '#666', fontSize: 14, marginTop: 4 },
  
  menuList: { margin: 16 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#1a1a1a', borderRadius: 12, marginBottom: 8 },
  menuItemText: { flex: 1, color: '#fff', fontSize: 16, marginLeft: 12 },
  
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', margin: 16, padding: 16, backgroundColor: '#ff444420', borderRadius: 12 },
  logoutText: { color: '#ff4444', fontSize: 16, fontWeight: '600', marginLeft: 8 },
});

export default MainTradingScreen;
