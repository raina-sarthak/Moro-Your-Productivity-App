import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { storage } from '../../utils/storage';

type Period = 'day' | 'week' | 'month';

interface ProductivityData {
  date: string;
  focusTime: number;
  tasksCompleted: number;
  sessionsCompleted: number;
}

export default function TrackerScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('week');
  const [focusTime, setFocusTime] = useState(0);
  const [tasksCompleted, setTasksCompleted] = useState(0);
  const [productivityScore, setProductivityScore] = useState(0);
  const [chartData, setChartData] = useState<{ labels: string[]; data: number[] }>({
    labels: [],
    data: [],
  });

  // Calculate chart dimensions
  const screenWidth = Dimensions.get('window').width;
  const dataPointWidth = 60; // Width allocated for each data point
  const chartWidth = Math.max(screenWidth - 32, dataPointWidth * chartData.labels.length);

  useEffect(() => {
    loadData();
  }, [selectedPeriod]);

  const loadData = async () => {
    const days = selectedPeriod === 'day' ? 1 : selectedPeriod === 'week' ? 7 : 30;
    const productivityData = await storage.loadProductivityData(days);
    const sessions = await storage.loadSessions();
    const todos = await storage.loadTodos();

    // Calculate focus time from sessions
    const totalFocusTime = sessions.reduce((total, session) => {
      if (session.mode === 'work') {
        return total + (session.endTime - session.startTime) / 1000 / 60;
      }
      return total;
    }, 0);
    setFocusTime(Math.round(totalFocusTime));

    // Calculate completed tasks
    const completedTasksCount = todos.filter(todo => todo.completed).length;
    setTasksCompleted(completedTasksCount);

    // Calculate productivity score (0-100)
    const score = Math.min(100, Math.round((totalFocusTime / (25 * days) + completedTasksCount / days) * 50));
    setProductivityScore(score);

    // Prepare chart data
    const labels: string[] = [];
    const data: number[] = [];
    
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { 
        month: 'short',
        day: 'numeric'
      });
      
      labels.push(dateStr);
      
      const dayData = productivityData.find(d => {
        const dataDate = new Date(d.date);
        return dataDate.toDateString() === date.toDateString();
      });
      
      // Ensure we have a valid number for the chart
      const focusMinutes = dayData?.focusTime || 0;
      data.push(Math.max(0, focusMinutes)); // Prevent negative values
    }

    setChartData({ labels, data });
  };

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
          <Text style={styles.metricValue}>{focusTime}</Text>
          <Text style={styles.metricLabel}>Focus Minutes</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{tasksCompleted}</Text>
          <Text style={styles.metricLabel}>Tasks Done</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{productivityScore}</Text>
          <Text style={styles.metricLabel}>Productivity</Text>
        </View>
      </View>

      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Focus Time Trend</Text>
        {chartData.data.length > 0 && (
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
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: 6,
                  strokeWidth: 2,
                  stroke: '#007AFF'
                },
                propsForLabels: {
                  fontSize: 10,
                  rotation: 45
                },
                formatYLabel: (yLabel: string) => Math.round(Number(yLabel)).toString(),
              }}
              bezier
              style={styles.chart}
              withDots={true}
              withInnerLines={true}
              withOuterLines={true}
              withVerticalLines={true}
              withHorizontalLines={true}
              withVerticalLabels={true}
              withHorizontalLabels={true}
              yAxisInterval={1}
              segments={5}
              fromZero={true}
            />
          </ScrollView>
        )}
      </View>

      <View style={styles.insightsContainer}>
        <Text style={styles.insightsTitle}>Insights</Text>
        <Text style={styles.insightText}>
          {productivityScore >= 80
            ? "You're crushing it! Keep up the great work! 🚀"
            : productivityScore >= 60
            ? "Good progress! Try to maintain consistency. 💪"
            : "Focus on small wins to build momentum. 🌱"}
        </Text>
        <Text style={styles.insightText}>
          {`Average daily focus time: ${Math.round(focusTime / (selectedPeriod === 'day' ? 1 : selectedPeriod === 'week' ? 7 : 30))} minutes`}
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
  },
  chartScrollContent: {
    paddingRight: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  chart: {
    borderRadius: 12,
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
}); 