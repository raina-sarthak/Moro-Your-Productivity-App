import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Vibration, ScrollView } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  withTiming,
  useSharedValue,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { storage } from '../../utils/storage';

type TimerMode = 'work' | 'break';

export default function TimerScreen() {
  const [workDuration, setWorkDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<TimerMode>('work');
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  
  const progress = useSharedValue(1);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const settings = await storage.loadTimerSettings();
    setWorkDuration(settings.workDuration);
    setBreakDuration(settings.breakDuration);
    setTimeLeft(settings.workDuration * 60);
  };

  useEffect(() => {
    setTimeLeft(mode === 'work' ? workDuration * 60 : breakDuration * 60);
  }, [workDuration, breakDuration, mode]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && timeLeft > 0) {
      if (!sessionStartTime) {
        setSessionStartTime(Date.now());
      }
      
      interval = setInterval(() => {
        setTimeLeft((timeLeft) => timeLeft - 1);
        progress.value = withTiming(timeLeft / (mode === 'work' ? workDuration * 60 : breakDuration * 60), {
          duration: 1000,
        });
      }, 1000);
    } else if (timeLeft === 0) {
      handleSessionComplete();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft]);

  const handleSessionComplete = async () => {
    if (sessionStartTime) {
      const session = {
        id: Date.now().toString(),
        mode,
        duration: mode === 'work' ? workDuration * 60 : breakDuration * 60,
        startTime: sessionStartTime,
        endTime: Date.now(),
      };
      await storage.saveSession(session);
      
      if (mode === 'work') {
        setCompletedPomodoros(prev => prev + 1);
      }
    }
    
    Vibration.vibrate([500, 500, 500, 500, 500]);
    setIsActive(false);
    setSessionStartTime(null);
  };

  const toggleTimer = () => {
    if (!isActive) {
      setSessionStartTime(Date.now());
    }
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'work' ? workDuration * 60 : breakDuration * 60);
    progress.value = withTiming(1, { duration: 500 });
    setSessionStartTime(null);
  };

  const switchMode = (newMode: TimerMode) => {
    setMode(newMode);
    setTimeLeft(newMode === 'work' ? workDuration * 60 : breakDuration * 60);
    progress.value = withTiming(1, { duration: 500 });
    setSessionStartTime(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const circleStyle = useAnimatedStyle(() => {
    const progressValue = interpolate(
      progress.value,
      [0, 1],
      [0, 360],
      Extrapolate.CLAMP
    );

    return {
      transform: [
        { rotate: `${progressValue}deg` }
      ],
      borderColor: mode === 'work' ? '#007AFF' : '#4CAF50',
    };
  }, [progress, mode]);

  const adjustTime = async (type: 'work' | 'break', amount: number) => {
    if (isActive) return;
    
    if (type === 'work') {
      const newValue = Math.max(5, Math.min(60, workDuration + amount));
      setWorkDuration(newValue);
      if (mode === 'work') {
        setTimeLeft(newValue * 60);
      }
    } else {
      const newValue = Math.max(1, Math.min(15, breakDuration + amount));
      setBreakDuration(newValue);
      if (mode === 'break') {
        setTimeLeft(newValue * 60);
      }
    }

    await storage.saveTimerSettings({
      workDuration: type === 'work' ? Math.max(5, Math.min(60, workDuration + amount)) : workDuration,
      breakDuration: type === 'break' ? Math.max(1, Math.min(15, breakDuration + amount)) : breakDuration,
    });
  };

  return (
    <ScrollView 
      style={styles.scrollContainer}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.container}>
        <View style={styles.modeContainer}>
          <Text style={styles.modeText}>
            {mode === 'work' ? 'Focus Time' : 'Break Time'}
          </Text>
          <Text style={styles.pomodoroCount}>
            Pomodoros: {completedPomodoros}
          </Text>
        </View>

        <View style={styles.timerContainer}>
          <View style={styles.circleContainer}>
            <View style={styles.circleBackground} />
            <View style={styles.circleMask}>
              <Animated.View style={[styles.circle, circleStyle]} />
            </View>
            <View style={styles.timerContent}>
              <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.modeSelector}>
          <TouchableOpacity 
            style={[styles.modeButton, mode === 'work' && styles.activeModeButton]} 
            onPress={() => switchMode('work')}
          >
            <Text style={[styles.modeButtonText, mode === 'work' && styles.activeModeText]}>
              Work
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.modeButton, mode === 'break' && styles.activeModeButton]} 
            onPress={() => switchMode('break')}
          >
            <Text style={[styles.modeButtonText, mode === 'break' && styles.activeModeText]}>
              Break
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.settingsContainer}>
          <View style={styles.timeControls}>
            <View style={styles.timeControlGroup}>
              <Text style={styles.timeLabel}>Work Duration</Text>
              <View style={styles.timeAdjuster}>
                <TouchableOpacity 
                  style={[styles.timeButton, isActive && styles.disabledButton]} 
                  onPress={() => adjustTime('work', -5)}
                  disabled={isActive}
                >
                  <Ionicons name="remove" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.timeValue}>{workDuration} min</Text>
                <TouchableOpacity 
                  style={[styles.timeButton, isActive && styles.disabledButton]} 
                  onPress={() => adjustTime('work', 5)}
                  disabled={isActive}
                >
                  <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.timeControlGroup}>
              <Text style={styles.timeLabel}>Break Duration</Text>
              <View style={styles.timeAdjuster}>
                <TouchableOpacity 
                  style={[styles.timeButton, isActive && styles.disabledButton]} 
                  onPress={() => adjustTime('break', -1)}
                  disabled={isActive}
                >
                  <Ionicons name="remove" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.timeValue}>{breakDuration} min</Text>
                <TouchableOpacity 
                  style={[styles.timeButton, isActive && styles.disabledButton]} 
                  onPress={() => adjustTime('break', 1)}
                  disabled={isActive}
                >
                  <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.controlButton]} 
            onPress={toggleTimer}
          >
            <Text style={styles.buttonText}>
              {isActive ? 'Pause' : 'Start'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.resetButton]} 
            onPress={resetTimer}
          >
            <Text style={styles.buttonText}>Reset</Text>
          </TouchableOpacity>
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
  modeContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  pomodoroCount: {
    fontSize: 16,
    color: '#666',
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  circleContainer: {
    width: 300,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleBackground: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    borderWidth: 20,
    borderColor: '#333',
    borderStyle: 'solid',
  },
  circleMask: {
    position: 'absolute',
    width: 300,
    height: 300,
    overflow: 'hidden',
    borderRadius: 150,
  },
  circle: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    borderWidth: 20,
    borderStyle: 'solid',
    transform: [{ rotate: '-90deg' }],
  },
  timerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#fff',
  },
  modeSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 20,
  },
  modeButton: {
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 25,
    backgroundColor: '#333',
    minWidth: 100,
    alignItems: 'center',
  },
  activeModeButton: {
    backgroundColor: '#007AFF',
  },
  modeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  activeModeText: {
    color: '#fff',
  },
  settingsContainer: {
    marginBottom: 30,
    padding: 20,
    backgroundColor: '#222',
    borderRadius: 15,
  },
  timeControls: {
    gap: 20,
  },
  timeControlGroup: {
    alignItems: 'center',
  },
  timeLabel: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 10,
  },
  timeAdjuster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  timeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  timeValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    minWidth: 60,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    minWidth: 120,
    alignItems: 'center',
  },
  controlButton: {
    backgroundColor: '#007AFF',
  },
  resetButton: {
    backgroundColor: '#333',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 