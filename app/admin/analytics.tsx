import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import {
  fetchPostsPerDay,
  fetchUserGrowth,
  fetchEngagementTrends,
  DailyPostCount,
  DailyUserCount,
  DailyEngagement,
} from '../../services/adminService';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_PADDING = 16;
const CHART_WIDTH = SCREEN_WIDTH - CHART_PADDING * 2 - 32;
const BAR_CHART_HEIGHT = 160;
const LINE_CHART_HEIGHT = 140;

function formatDay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'short' }).slice(0, 3);
}

function formatDayShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

// ─── Bar Chart ───
function BarChart({
  data,
  color,
  label,
}: {
  data: { label: string; value: number }[];
  color: string;
  label: string;
}) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const barWidth = Math.max(1, (CHART_WIDTH - (data.length - 1) * 6) / data.length);

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>{label}</Text>
      <View style={styles.barChartWrap}>
        {/* Y-axis labels */}
        <View style={styles.yAxisLabels}>
          <Text style={styles.yLabel}>{maxVal}</Text>
          <Text style={styles.yLabel}>{Math.round(maxVal / 2)}</Text>
          <Text style={styles.yLabel}>0</Text>
        </View>
        <View style={styles.barChartInner}>
          {/* Grid lines */}
          <View style={[styles.gridLine, { top: 0 }]} />
          <View style={[styles.gridLine, { top: BAR_CHART_HEIGHT / 2 }]} />
          <View style={[styles.gridLine, { top: BAR_CHART_HEIGHT }]} />
          {/* Bars */}
          <View style={styles.barsRow}>
            {data.map((item, i) => {
              const barH = Math.max(2, (item.value / maxVal) * BAR_CHART_HEIGHT);
              return (
                <View key={i} style={[styles.barCol, { width: barWidth }]}>  
                  <View style={styles.barValueWrap}>
                    {item.value > 0 ? (
                      <Text style={[styles.barValue, { color }]}>{item.value}</Text>
                    ) : null}
                  </View>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: barH,
                        backgroundColor: color,
                        borderRadius: barWidth > 16 ? 6 : 3,
                        width: Math.min(barWidth - 4, 32),
                        opacity: item.value === 0 ? 0.2 : 1,
                      },
                    ]}
                  />
                  <Text style={styles.barLabel}>{item.label}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>
      <View style={styles.chartSummaryRow}>
        <MaterialIcons name="info-outline" size={13} color="#6B6B6B" />
        <Text style={styles.chartSummaryText}>
          Total: {data.reduce((s, d) => s + d.value, 0)} | Avg: {(data.reduce((s, d) => s + d.value, 0) / data.length).toFixed(1)}/day
        </Text>
      </View>
    </View>
  );
}

// ─── Line Chart (SVG-free, using Views) ───
function LineChart({
  datasets,
  labels,
  title,
}: {
  datasets: { data: number[]; color: string; label: string }[];
  labels: string[];
  title: string;
}) {
  const allValues = datasets.flatMap((d) => d.data);
  const maxVal = Math.max(...allValues, 1);
  const pointSpacing = labels.length > 1 ? CHART_WIDTH / (labels.length - 1) : CHART_WIDTH;

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>{title}</Text>
      <View style={styles.lineChartWrap}>
        <View style={styles.yAxisLabels}>
          <Text style={styles.yLabel}>{maxVal}</Text>
          <Text style={styles.yLabel}>{Math.round(maxVal / 2)}</Text>
          <Text style={styles.yLabel}>0</Text>
        </View>
        <View style={styles.lineChartInner}>
          {/* Grid lines */}
          <View style={[styles.gridLine, { top: 0 }]} />
          <View style={[styles.gridLine, { top: LINE_CHART_HEIGHT / 2 }]} />
          <View style={[styles.gridLine, { top: LINE_CHART_HEIGHT }]} />

          {/* Data points and lines */}
          {datasets.map((dataset, di) => (
            <View key={di} style={StyleSheet.absoluteFill}>
              {dataset.data.map((val, i) => {
                const x = i * pointSpacing;
                const y = LINE_CHART_HEIGHT - (val / maxVal) * LINE_CHART_HEIGHT;
                return (
                  <React.Fragment key={i}>
                    {/* Connecting line to next point */}
                    {i < dataset.data.length - 1 ? (() => {
                      const nextY = LINE_CHART_HEIGHT - (dataset.data[i + 1] / maxVal) * LINE_CHART_HEIGHT;
                      const dx = pointSpacing;
                      const dy = nextY - y;
                      const length = Math.sqrt(dx * dx + dy * dy);
                      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
                      return (
                        <View
                          style={{
                            position: 'absolute',
                            left: x,
                            top: y,
                            width: length,
                            height: 2,
                            backgroundColor: dataset.color,
                            opacity: 0.7,
                            transformOrigin: 'left center',
                            transform: [{ rotate: `${angle}deg` }],
                          }}
                        />
                      );
                    })() : null}
                    {/* Data point */}
                    <View
                      style={{
                        position: 'absolute',
                        left: x - 5,
                        top: y - 5,
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: dataset.color,
                        borderWidth: 2,
                        borderColor: '#0A0A0A',
                      }}
                    />
                    {/* Value label */}
                    {val > 0 ? (
                      <Text
                        style={{
                          position: 'absolute',
                          left: x - 12,
                          top: y - 20,
                          fontSize: 10,
                          fontWeight: '700',
                          color: dataset.color,
                          textAlign: 'center',
                          width: 24,
                        }}
                      >
                        {val}
                      </Text>
                    ) : null}
                  </React.Fragment>
                );
              })}
            </View>
          ))}

          {/* X-axis labels */}
          <View style={styles.xAxisRow}>
            {labels.map((l, i) => (
              <Text
                key={i}
                style={[
                  styles.xLabel,
                  { left: i * pointSpacing - 14, width: 28 },
                ]}
              >
                {l}
              </Text>
            ))}
          </View>
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legendRow}>
        {datasets.map((d, i) => (
          <View key={i} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: d.color }]} />
            <Text style={styles.legendText}>{d.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function AnalyticsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [postsData, setPostsData] = useState<DailyPostCount[]>([]);
  const [userData, setUserData] = useState<DailyUserCount[]>([]);
  const [engagementData, setEngagementData] = useState<DailyEngagement[]>([]);

  const loadAll = useCallback(async () => {
    const [posts, users, engagement] = await Promise.all([
      fetchPostsPerDay(7),
      fetchUserGrowth(7),
      fetchEngagementTrends(7),
    ]);
    setPostsData(posts.data);
    setUserData(users.data);
    setEngagementData(engagement.data);
  }, []);

  useEffect(() => {
    loadAll().finally(() => setLoading(false));
  }, [loadAll]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }, [loadAll]);

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* Header */}
      <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={22} color="#FFF" />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Analytics</Text>
          <Text style={styles.headerSub}>Last 7 days overview</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.refreshBtn, pressed && { opacity: 0.7 }]}
          onPress={onRefresh}
        >
          <MaterialIcons name="refresh" size={22} color="#D4AF37" />
        </Pressable>
      </Animated.View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#D4AF37" />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4AF37" />
          }
        >
          {/* Posts per day bar chart */}
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <BarChart
              data={postsData.map((d) => ({ label: formatDay(d.date), value: d.count }))}
              color="#D4AF37"
              label="Posts Per Day"
            />
          </Animated.View>

          {/* User growth line chart */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <LineChart
              title="User Growth"
              labels={userData.map((d) => formatDayShort(d.date))}
              datasets={[
                {
                  data: userData.map((d) => d.cumulative),
                  color: '#60A5FA',
                  label: 'Total Users',
                },
                {
                  data: userData.map((d) => d.count),
                  color: '#4ADE80',
                  label: 'New Users',
                },
              ]}
            />
          </Animated.View>

          {/* Engagement trends */}
          <Animated.View entering={FadeInDown.delay(300).duration(400)}>
            <LineChart
              title="Engagement Trends"
              labels={engagementData.map((d) => formatDay(d.date))}
              datasets={[
                {
                  data: engagementData.map((d) => d.likes),
                  color: '#FB7185',
                  label: 'Likes',
                },
                {
                  data: engagementData.map((d) => d.comments),
                  color: '#38BDF8',
                  label: 'Comments',
                },
              ]}
            />
          </Animated.View>

          {/* Quick Stats Summary */}
          <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.summarySection}>
            <Text style={styles.sectionTitle}>7-Day Summary</Text>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryCard}>
                <MaterialIcons name="dynamic-feed" size={20} color="#D4AF37" />
                <Text style={styles.summaryVal}>{postsData.reduce((s, d) => s + d.count, 0)}</Text>
                <Text style={styles.summaryLabel}>Posts</Text>
              </View>
              <View style={styles.summaryCard}>
                <MaterialIcons name="person-add" size={20} color="#4ADE80" />
                <Text style={styles.summaryVal}>{userData.reduce((s, d) => s + d.count, 0)}</Text>
                <Text style={styles.summaryLabel}>New Users</Text>
              </View>
              <View style={styles.summaryCard}>
                <MaterialIcons name="favorite" size={20} color="#FB7185" />
                <Text style={styles.summaryVal}>{engagementData.reduce((s, d) => s + d.likes, 0)}</Text>
                <Text style={styles.summaryLabel}>Likes</Text>
              </View>
              <View style={styles.summaryCard}>
                <MaterialIcons name="chat-bubble" size={20} color="#38BDF8" />
                <Text style={styles.summaryVal}>{engagementData.reduce((s, d) => s + d.comments, 0)}</Text>
                <Text style={styles.summaryLabel}>Comments</Text>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  scrollContent: { padding: 16, paddingBottom: 40, gap: 20 },
  loadingText: { fontSize: 13, color: '#6B6B6B', fontWeight: '500' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212,175,55,0.08)',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#FFF' },
  headerSub: { fontSize: 12, fontWeight: '500', color: '#6B6B6B', marginTop: 2 },
  refreshBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(212,175,55,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Chart container
  chartContainer: {
    backgroundColor: '#121212',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    gap: 12,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.3,
  },

  // Bar chart
  barChartWrap: {
    flexDirection: 'row',
    gap: 8,
  },
  yAxisLabels: {
    width: 28,
    height: BAR_CHART_HEIGHT,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 4,
  },
  yLabel: { fontSize: 10, fontWeight: '600', color: '#6B6B6B' },
  barChartInner: {
    flex: 1,
    height: BAR_CHART_HEIGHT + 24,
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: BAR_CHART_HEIGHT,
    gap: 6,
  },
  barCol: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barValueWrap: { marginBottom: 4 },
  barValue: { fontSize: 10, fontWeight: '800' },
  bar: {},
  barLabel: { fontSize: 10, fontWeight: '600', color: '#6B6B6B', marginTop: 6 },
  chartSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
  },
  chartSummaryText: { fontSize: 12, fontWeight: '500', color: '#6B6B6B' },

  // Line chart
  lineChartWrap: {
    flexDirection: 'row',
    gap: 8,
  },
  lineChartInner: {
    flex: 1,
    height: LINE_CHART_HEIGHT + 28,
    position: 'relative',
  },
  xAxisRow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 20,
    flexDirection: 'row',
  },
  xLabel: {
    position: 'absolute',
    fontSize: 9,
    fontWeight: '600',
    color: '#6B6B6B',
    textAlign: 'center',
    top: 0,
  },

  // Legend
  legendRow: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, fontWeight: '600', color: '#A0A0A0' },

  // Summary
  summarySection: { gap: 12 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#A0A0A0',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  summaryCard: {
    flexGrow: 1,
    flexBasis: '46%',
    backgroundColor: '#121212',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  summaryVal: { fontSize: 24, fontWeight: '900', color: '#FFF' },
  summaryLabel: { fontSize: 12, fontWeight: '600', color: '#6B6B6B' },
});
