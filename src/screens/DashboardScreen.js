import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

const DashboardScreen = () => {
  const topAssets = [
    { name: 'Latest Batch', value: '$593,513.7', change: '+7%' },
    { name: 'Average Block Time', value: '$324,212.7', change: '-5%' },
    { name: 'Total Trxns', value: '$2134,121.7', change: '+7%' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>⟨X CoinLytix</Text>
        <TouchableOpacity style={styles.walletButton}>
          <Text style={styles.walletText}>Connect Wallet</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.highlightCard}>
        <Text style={styles.highlightTitle}>Professional Highlights</Text>
        <Text style={styles.highlightLabel}>Daily Transactions</Text>
        <Text style={styles.highlightValue}>9323.745k</Text>
        <View style={styles.statsRow}>
          <View style={styles.statBadge}>
            <Text style={styles.statBadgeText}>↘ 3.27%</Text>
          </View>
          <Text style={styles.statGreen}>+$782.40</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Top Assets</Text>
      <Text style={styles.sectionSubtitle}>Your highest-value crypto</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.assetsScroll}>
        {topAssets.map((asset, index) => (
          <View key={index} style={styles.assetCard}>
            <Text style={styles.assetName}>{asset.name}</Text>
            <Text style={styles.assetValue}>{asset.value}</Text>
            <Text style={[styles.assetChange, asset.change.startsWith('+') ? styles.green : styles.red]}>
              {asset.change}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.transactionsCard}>
        <Text style={styles.transactionsTitle}>Latest Transactions</Text>
        <Text style={styles.transactionsSubtitle}>Real-time blockchain activity</Text>
        
        {[1, 2, 3].map((_, index) => (
          <View key={index} style={styles.transactionItem}>
            <View style={styles.transactionLeft}>
              <View style={styles.successBadge}>
                <Text style={styles.successText}>Success</Text>
              </View>
              <Text style={styles.transactionType}>Contract Call</Text>
            </View>
            <Text style={styles.transactionValue}>131.35 EDU</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
  },
  logo: {
    color: '#00d4aa',
    fontSize: 18,
    fontWeight: '600',
  },
  walletButton: {
    backgroundColor: '#ff6b35',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  walletText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  highlightCard: {
    backgroundColor: '#111',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  highlightTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  highlightLabel: {
    color: '#666',
    fontSize: 14,
  },
  highlightValue: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '700',
    marginVertical: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statBadge: {
    backgroundColor: 'rgba(0, 212, 170, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statBadgeText: {
    color: '#00d4aa',
    fontSize: 14,
  },
  statGreen: {
    color: '#00d4aa',
    fontSize: 14,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 16,
    marginTop: 8,
  },
  sectionSubtitle: {
    color: '#666',
    fontSize: 14,
    marginLeft: 16,
    marginBottom: 16,
  },
  assetsScroll: {
    paddingLeft: 16,
  },
  assetCard: {
    backgroundColor: '#111',
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    width: 160,
    borderWidth: 1,
    borderColor: '#222',
  },
  assetName: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 8,
  },
  assetValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  assetChange: {
    fontSize: 12,
    marginTop: 4,
  },
  green: {
    color: '#00d4aa',
  },
  red: {
    color: '#ff6b6b',
  },
  transactionsCard: {
    backgroundColor: '#111',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  transactionsTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  transactionsSubtitle: {
    color: '#666',
    fontSize: 12,
    marginBottom: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  successBadge: {
    backgroundColor: 'rgba(0, 212, 170, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  successText: {
    color: '#00d4aa',
    fontSize: 12,
  },
  transactionType: {
    color: '#fff',
    fontSize: 14,
  },
  transactionValue: {
    color: '#fff',
    fontSize: 14,
  },
});

export default DashboardScreen;
