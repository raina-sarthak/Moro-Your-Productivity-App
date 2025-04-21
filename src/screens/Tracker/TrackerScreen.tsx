import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Animated, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { storage, Priority } from '../../utils/storage';

type Period = 'day' | 'week' | 'month';
type MetricType = 'focus' | 'tasks' | 'priority';

export default function TrackerScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('week');
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('focus');
  const [productivityData, setProductivityData] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [todos, setTodos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentChartIndex, setCurrentChartIndex] = useState(0);
  const scrollViewRef = React.useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const chartWidth = Dimensions.get('window').width - 32;

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const days = selectedPeriod === 'day' ? 1 : selectedPeriod === 'week' ? 7 : 30;
      
      const [newProductivityData, newSessions, newTodos] = await Promise.all([
        storage.loadProductivityData(days),
        storage.loadSessions(),
        storage.loadTodos()
      ]);

      setProductivityData(newProductivityData);
      setSessions(newSessions);
      setTodos(newTodos);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const stats = useMemo(() => {
    const days = selectedPeriod === 'day' ? 1 : selectedPeriod === 'week' ? 7 : 30;

    // Calculate focus time stats
    const totalFocusTime = sessions.reduce((total, session) => {
      if (session.mode === 'work') {
        return total + (session.endTime - session.startTime) / 1000 / 60;
      }
      return total;
    }, 0);

    // Calculate task completion stats
    const completedTasks = todos.filter(todo => todo.completed);
    const totalTasks = todos.length;

    // Calculate priority-based stats
    const priorityStats = {
      high: completedTasks.filter(task => task.priority === 'high').length,
      medium: completedTasks.filter(task => task.priority === 'medium').length,
      low: completedTasks.filter(task => task.priority === 'low').length,
    };

    const averageDailyFocus = Math.round(totalFocusTime / days);
    const completionRate = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0;
    const productivityScore = Math.min(100, Math.round((totalFocusTime / (25 * days) + completedTasks.length / days) * 50));

    return {
      focusTime: Math.round(totalFocusTime),
      averageDailyFocus,
      tasksCompleted: completedTasks.length,
      totalTasks,
      completionRate,
      productivityScore,
      priorityStats
    };
  }, [sessions, todos, selectedPeriod]);

  const chartData = useMemo(() => {
    const days = selectedPeriod === 'day' ? 1 : selectedPeriod === 'week' ? 7 : 30;
    const labels: string[] = [];
    const data: number[] = [];
    
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      let dateStr;
      if (selectedPeriod === 'month') {
        // For monthly view, show only every 5th day
        if (i % 5 === 0 || i === days - 1 || i === 0) {
          dateStr = date.toLocaleDateString('en-US', { 
            month: 'short',
            day: 'numeric'
          });
        } else {
          dateStr = '';
        }
      } else {
        // For day and week views, show month and day
        dateStr = date.toLocaleDateString('en-US', { 
          month: 'short',
          day: 'numeric'
        });
      }
      
      labels.push(dateStr);
      
      const dayData = productivityData.find(d => {
        const dataDate = new Date(d.date);
        return dataDate.toDateString() === date.toDateString();
      });
      
      if (selectedMetric === 'focus') {
        const focusMinutes = dayData?.focusTime || 0;
        data.push(Math.max(0, focusMinutes));
      } else if (selectedMetric === 'tasks') {
        const tasksCompleted = dayData?.tasksCompleted || 0;
        data.push(tasksCompleted);
      }
    }

    return { labels, data };
  }, [productivityData, selectedPeriod, selectedMetric]);

  const priorityChartData = useMemo(() => {
    const colors = {
      high: '#FF453A',
      medium: '#FFD60A',
      low: '#32D74B'
    };

    return [
      {
        name: 'High',
        count: stats.priorityStats.high,
        color: colors.high,
        legendFontColor: '#fff',
      },
      {
        name: 'Medium',
        count: stats.priorityStats.medium,
        color: colors.medium,
        legendFontColor: '#fff',
      },
      {
        name: 'Low',
        count: stats.priorityStats.low,
        color: colors.low,
        legendFontColor: '#fff',
      }
    ];
  }, [stats.priorityStats]);

  const renderMetricButton = (metric: MetricType, label: string) => (
    <TouchableOpacity 
      style={[styles.metricButton, selectedMetric === metric && styles.activeMetricButton]}
      onPress={() => setSelectedMetric(metric)}
    >
      <Text style={[styles.metricButtonText, selectedMetric === metric && styles.activeMetricButtonText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: true }
  );

  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const position = event.nativeEvent.contentOffset.x;
    const index = Math.round(position / chartWidth);
    setCurrentChartIndex(index);
  };

  const renderFocusTimeChart = () => (
    /*
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={true}
      contentContainerStyle={styles.chartScrollContent}
    >
      <LineChart
        data={{
          labels: chartData.labels,
          datasets: [{
            data: chartData.data.length > 0 ? chartData.data : [0],
            color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
            strokeWidth: 2
          }],
        }}
        width={chartWidth}
        height={220}
        chartConfig={{
          backgroundColor: '#1e1e1e',
          backgroundGradientFrom: '#1e1e1e',
          backgroundGradientTo: '#1e1e1e',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          style: { borderRadius: 16 },
          propsForDots: {
            r: 6,
            strokeWidth: 2,
            stroke: '#007AFF'
          },
          propsForLabels: {
            fontSize: selectedPeriod === 'month' ? 12 : 10,
            rotation: selectedPeriod === 'month' ? 0 : 45
          },
          formatYLabel: (yLabel: string) => {
            const minutes = Math.round(Number(yLabel));
            return `${minutes}m`;
          },
        }}
        bezier
        style={styles.chart}
        withDots={true}
        withInnerLines={true}
        withOuterLines={true}
        withVerticalLines={selectedPeriod !== 'month'}
        withHorizontalLines={true}
        withVerticalLabels={true}
        withHorizontalLabels={true}
        yAxisInterval={1}
        segments={5}
        fromZero={true}
        xLabelsOffset={selectedPeriod === 'month' ? 10 : 0}
      />
    </ScrollView>
    */
    null
  );

  const renderTasksPieChart = () => {
    const taskData = [
      {
        name: 'Completed',
        count: stats.tasksCompleted,
        color: '#007AFF',
        legendFontColor: '#fff',
      },
      {
        name: 'Pending',
        count: stats.totalTasks - stats.tasksCompleted,
        color: '#666666',
        legendFontColor: '#fff',
      }
    ];

    return (
      <View style={styles.pieChartContainer}>
        <PieChart
          data={taskData}
          width={chartWidth}
          height={220}
          chartConfig={{
            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          }}
          accessor="count"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
        />
      </View>
    );
  };

  const renderPriorityPieChart = () => (
    <View style={styles.pieChartContainer}>
      <PieChart
        data={priorityChartData}
        width={chartWidth}
        height={220}
        chartConfig={{
          color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
        }}
        accessor="count"
        backgroundColor="transparent"
        paddingLeft="15"
        absolute
      />
    </View>
  );

  const charts = [renderTasksPieChart, renderPriorityPieChart];
  const chartLabels = ['Task Completion', 'Priority Distribution'];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Productivity Tracker</Text>

      <View style={styles.periodSelector}>
        {(['day', 'week', 'month'] as Period[]).map((period) => (
          <TouchableOpacity
            key={period}
            style={[
              styles.periodButton,
              selectedPeriod === period && styles.selectedPeriod,
            ]}
            onPress={() => setSelectedPeriod(period)}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === period && styles.selectedPeriodText,
              ]}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.metricsContainer}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{stats.focusTime}</Text>
          <Text style={styles.metricLabel}>Focus Minutes</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{stats.tasksCompleted}</Text>
          <Text style={styles.metricLabel}>Tasks Done</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{Math.round(stats.completionRate)}%</Text>
          <Text style={styles.metricLabel}>Completion</Text>
        </View>
      </View>

      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Productivity Analytics</Text>
        <Animated.ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          snapToInterval={chartWidth}
          snapToAlignment="center"
          decelerationRate="fast"
          onScroll={handleScroll}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          scrollEventThrottle={16}
          contentContainerStyle={styles.chartScrollContainer}
        >
          {charts.map((chart, index) => (
            <View key={index} style={styles.chartPage}>
              {chart()}
              <Text style={styles.chartLabel}>{chartLabels[index]}</Text>
            </View>
          ))}
        </Animated.ScrollView>
        <View style={styles.paginationContainer}>
          {charts.map((_, index) => {
            const inputRange = [
              (index - 1) * chartWidth,
              index * chartWidth,
              (index + 1) * chartWidth,
            ];
            
            const scale = scrollX.interpolate({
              inputRange,
              outputRange: [1, 1.5, 1],
              extrapolate: 'clamp',
            });
            
            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.5, 1, 0.5],
              extrapolate: 'clamp',
            });
            
            return (
              <Animated.View
                key={index}
                style={[
                  styles.paginationDot,
                  {
                    transform: [{ scale }],
                    opacity,
                  },
                ]}
              />
            );
          })}
        </View>
      </View>

      <View style={styles.insightsContainer}>
        <Text style={styles.insightsTitle}>Insights</Text>
        <Text style={styles.insightText}>
          {stats.productivityScore >= 80
            ? "You're crushing it! Keep up the great work! 🚀"
            : stats.productivityScore >= 60
            ? "Good progress! Try to maintain consistency. 💪"
            : "Focus on small wins to build momentum. 🌱"}
        </Text>
        <Text style={styles.insightText}>
          {`Average daily focus: ${stats.averageDailyFocus} minutes`}
        </Text>
        <Text style={styles.insightText}>
          {`Task completion rate: ${Math.round(stats.completionRate)}%`}
        </Text>
        <Text style={styles.insightText}>
          Priority breakdown:
        </Text>
        <Text style={[styles.insightText, styles.priorityText, { color: '#FF453A' }]}>
          {`High: ${stats.priorityStats.high} tasks`}
        </Text>
        <Text style={[styles.insightText, styles.priorityText, { color: '#FFD60A' }]}>
          {`Medium: ${stats.priorityStats.medium} tasks`}
        </Text>
        <Text style={[styles.insightText, styles.priorityText, { color: '#32D74B' }]}>
          {`Low: ${stats.priorityStats.low} tasks`}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 16,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 4,
  },
  periodButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  selectedPeriod: {
    backgroundColor: '#2e2e2e',
  },
  periodButtonText: {
    color: '#888',
    fontSize: 16,
  },
  selectedPeriodText: {
    color: '#fff',
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 14,
    color: '#888',
  },
  chartContainer: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    overflow: 'hidden',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  metricSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 16,
  },
  metricButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#333',
  },
  activeMetricButton: {
    backgroundColor: '#007AFF',
  },
  metricButtonText: {
    color: '#888',
    fontSize: 14,
  },
  activeMetricButtonText: {
    color: '#fff',
  },
  chartScrollContent: {
    paddingRight: 16,
  },
  chart: {
    borderRadius: 12,
  },
  pieChartContainer: {
    alignItems: 'center',
  },
  insightsContainer: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  insightsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  insightText: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 8,
    lineHeight: 24,
  },
  priorityText: {
    marginLeft: 16,
    fontSize: 14,
  },
  chartScrollContainer: {
    alignItems: 'center',
  },
  chartPage: {
    width: Dimensions.get('window').width - 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#333',
    marginHorizontal: 4,
  },
}); 