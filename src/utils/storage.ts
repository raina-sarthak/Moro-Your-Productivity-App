import AsyncStorage from '@react-native-async-storage/async-storage';

export type Priority = 'high' | 'medium' | 'low';

export type Todo = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  completedAt?: number;
  priority: Priority;
};

export type PomodoroSession = {
  id: string;
  mode: 'work' | 'break';
  duration: number;
  startTime: number;
  endTime: number;
};

export type ProductivityData = {
  date: string;
  focusTime: number;
  tasksCompleted: number;
  sessionsCompleted: number;
};

const STORAGE_KEYS = {
  TODOS: '@moro/todos',
  POMODORO_SESSIONS: '@moro/pomodoro_sessions',
  PRODUCTIVITY_DATA: '@moro/productivity_data',
  TIMER_SETTINGS: '@moro/timer_settings',
};

export const storage = {
  // Todo operations
  async saveTodos(todos: Todo[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TODOS, JSON.stringify(todos));
    } catch (error) {
      console.error('Error saving todos:', error);
    }
  },

  async loadTodos(): Promise<Todo[]> {
    try {
      const todosString = await AsyncStorage.getItem(STORAGE_KEYS.TODOS);
      return todosString ? JSON.parse(todosString) : [];
    } catch (error) {
      console.error('Error loading todos:', error);
      return [];
    }
  },

  // Pomodoro session operations
  async saveSession(session: PomodoroSession): Promise<void> {
    try {
      const sessions = await this.loadSessions();
      sessions.push(session);
      await AsyncStorage.setItem(STORAGE_KEYS.POMODORO_SESSIONS, JSON.stringify(sessions));
      
      // Update productivity data
      await this.updateProductivityData({
        focusTime: session.mode === 'work' ? session.duration : 0,
        tasksCompleted: 0,
        sessionsCompleted: session.mode === 'work' ? 1 : 0,
      });
    } catch (error) {
      console.error('Error saving session:', error);
    }
  },

  async loadSessions(): Promise<PomodoroSession[]> {
    try {
      const sessionsString = await AsyncStorage.getItem(STORAGE_KEYS.POMODORO_SESSIONS);
      return sessionsString ? JSON.parse(sessionsString) : [];
    } catch (error) {
      console.error('Error loading sessions:', error);
      return [];
    }
  },

  // Productivity data operations
  async updateProductivityData(data: Partial<Omit<ProductivityData, 'date'>>): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const productivityString = await AsyncStorage.getItem(STORAGE_KEYS.PRODUCTIVITY_DATA);
      const productivityData: Record<string, ProductivityData> = productivityString 
        ? JSON.parse(productivityString) 
        : {};

      const currentData = productivityData[today] || {
        date: today,
        focusTime: 0,
        tasksCompleted: 0,
        sessionsCompleted: 0,
      };

      productivityData[today] = {
        ...currentData,
        focusTime: currentData.focusTime + (data.focusTime || 0),
        tasksCompleted: currentData.tasksCompleted + (data.tasksCompleted || 0),
        sessionsCompleted: currentData.sessionsCompleted + (data.sessionsCompleted || 0),
      };

      await AsyncStorage.setItem(STORAGE_KEYS.PRODUCTIVITY_DATA, JSON.stringify(productivityData));
    } catch (error) {
      console.error('Error updating productivity data:', error);
    }
  },

  async loadProductivityData(days: number = 30): Promise<ProductivityData[]> {
    try {
      const productivityString = await AsyncStorage.getItem(STORAGE_KEYS.PRODUCTIVITY_DATA);
      if (!productivityString) return [];

      const productivityData: Record<string, ProductivityData> = JSON.parse(productivityString);
      const today = new Date();
      const result: ProductivityData[] = [];

      for (let i = 0; i < days; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        
        if (productivityData[dateString]) {
          result.push(productivityData[dateString]);
        } else {
          result.push({
            date: dateString,
            focusTime: 0,
            tasksCompleted: 0,
            sessionsCompleted: 0,
          });
        }
      }

      return result.reverse();
    } catch (error) {
      console.error('Error loading productivity data:', error);
      return [];
    }
  },

  // Timer settings operations
  async saveTimerSettings(settings: { workDuration: number; breakDuration: number }): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TIMER_SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving timer settings:', error);
    }
  },

  async loadTimerSettings(): Promise<{ workDuration: number; breakDuration: number }> {
    try {
      const settingsString = await AsyncStorage.getItem(STORAGE_KEYS.TIMER_SETTINGS);
      return settingsString 
        ? JSON.parse(settingsString)
        : { workDuration: 25, breakDuration: 5 };
    } catch (error) {
      console.error('Error loading timer settings:', error);
      return { workDuration: 25, breakDuration: 5 };
    }
  },
}; 