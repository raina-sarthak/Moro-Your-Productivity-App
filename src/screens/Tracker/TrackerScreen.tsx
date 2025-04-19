import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';

type TimePeriod = 'day' | 'week' | 'month';

// Sample data for demonstration
const sampleData = {
  day: {
    labels: ['6AM', '9AM', '12PM', '3PM', '6PM', '9PM'],
    datasets: [{
      data: [30, 45, 28, 80, 99, 43],
    }],
  },
  week: {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      data: [120, 90, 150, 180, 200, 60, 30],
    }],
  },
  month: {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [{
      data: [600, 750, 800, 900],
    }],
  },
};

export default function TrackerScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('week');
  const screenWidth = Dimensions.get('window').width - 70;

  const chartConfig = {
    backgroundColor: '#222',
    backgroundGradientFrom: '#222',
    backgroundGradientTo: '#222',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: {
      borderRadius: 12,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#007AFF',
    },
    propsForBackgroundLines: {
      stroke: '#444',
      strokeWidth: 1,
    },
    propsForLabels: {
      fontSize: 11,
    },
    formatYLabel: (yLabel: string) => `${yLabel}m`,
    paddingRight: 0,
    paddingTop: 0,
  };

  return (
    <ScrollView 
      style={styles.scrollContainer}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Productivity Tracker</Text>

        <View style={styles.periodSelector}>
          <TouchableOpacity 
            style={[styles.periodButton, selectedPeriod === 'day' && styles.activePeriodButton]}
            onPress={() => setSelectedPeriod('day')}
          >
            <Text style={[styles.periodText, selectedPeriod === 'day' && styles.activePeriodText]}>
              Day
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.periodButton, selectedPeriod === 'week' && styles.activePeriodButton]}
            onPress={() => setSelectedPeriod('week')}
          >
            <Text style={[styles.periodText, selectedPeriod === 'week' && styles.activePeriodText]}>
              Week
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.periodButton, selectedPeriod === 'month' && styles.activePeriodButton]}
            onPress={() => setSelectedPeriod('month')}
          >
            <Text style={[styles.periodText, selectedPeriod === 'month' && styles.activePeriodText]}>
              Month
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.metricsContainer}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Focus Time</Text>
            <Text style={styles.metricValue}>2h 30m</Text>
            <Text style={styles.metricChange}>+15% from last {selectedPeriod}</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Tasks Completed</Text>
            <Text style={styles.metricValue}>12</Text>
            <Text style={styles.metricChange}>+3 from last {selectedPeriod}</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Productivity Score</Text>
            <Text style={styles.metricValue}>85%</Text>
            <Text style={styles.metricChange}>+5% from last {selectedPeriod}</Text>
          </View>
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Focus Time Trend</Text>
          <View style={styles.chartWrapper}>
            <LineChart
              data={sampleData[selectedPeriod]}
              width={screenWidth}
              height={180}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
              withDots={true}
              withInnerLines={true}
              withOuterLines={false}
              withVerticalLines={false}
              withHorizontalLines={true}
              withVerticalLabels={true}
              withHorizontalLabels={true}
              segments={4}
              fromZero={true}
              getDotColor={() => '#007AFF'}
            />
          </View>
        </View>

        <View style={styles.insightsContainer}>
          <Text style={styles.insightsTitle}>Insights</Text>
          <View style={styles.insightCard}>
            <Ionicons name="bulb-outline" size={24} color="#007AFF" />
            <Text style={styles.insightText}>
              You're most productive between 10 AM and 12 PM
            </Text>
          </View>
          <View style={styles.insightCard}>
            <Ionicons name="trending-up-outline" size={24} color="#4CAF50" />
            <Text style={styles.insightText}>
              Your focus time has increased by 15% this week
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 50,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    backgroundColor: '#333',
    marginHorizontal: 5,
    alignItems: 'center',
  },
  activePeriodButton: {
    backgroundColor: '#007AFF',
  },
  periodText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  activePeriodText: {
    color: '#fff',
  },
  metricsContainer: {
    marginBottom: 20,
  },
  metricCard: {
    backgroundColor: '#333',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
  },
  metricLabel: {
    color: '#666',
    fontSize: 16,
    marginBottom: 5,
  },
  metricValue: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  metricChange: {
    color: '#4CAF50',
    fontSize: 14,
  },
  chartContainer: {
    marginBottom: 20,
    backgroundColor: '#333',
    borderRadius: 15,
    padding: 15,
  },
  chartTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  chartWrapper: {
    backgroundColor: '#222',
    borderRadius: 12,
    overflow: 'hidden',
  },
  chart: {
    borderRadius: 12,
  },
  insightsContainer: {
    marginBottom: 20,
  },
  insightsTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
  },
  insightText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 10,
    flex: 1,
  },
}); 