import { Text, View, StyleSheet, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { useState, useMemo } from 'react';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

type Todo = {
  id: string;
  text: string;
  completed: boolean;
};

type TabType = 'active' | 'completed';

export default function TasksScreen() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('active');

  const { activeTodos, completedTodos } = useMemo(() => {
    return {
      activeTodos: todos.filter(todo => !todo.completed),
      completedTodos: todos.filter(todo => todo.completed)
    };
  }, [todos]);

  const completedTasks = todos.filter(todo => todo.completed).length;
  const totalTasks = todos.length;
  const progress = totalTasks > 0 ? completedTasks / totalTasks : 0;

  const addTodo = () => {
    if (newTodo.trim()) {
      setTodos([...todos, { id: Date.now().toString(), text: newTodo, completed: false }]);
      setNewTodo('');
    }
  };

  const toggleTodo = (id: string) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const clearCompletedTasks = () => {
    setTodos(todos.filter(todo => !todo.completed));
  };

  const progressBarStyle = useAnimatedStyle(() => ({
    width: withTiming(`${progress * 100}%`, { duration: 500 }),
  }), [progress]);

  const renderTodoItem = ({ item }: { item: Todo }) => (
    <View style={styles.todoItem}>
      <TouchableOpacity 
        style={[styles.checkbox, item.completed && styles.checkboxCompleted]}
        onPress={() => toggleTodo(item.id)}
      />
      <Text style={[styles.todoText, item.completed && styles.todoTextCompleted]}>
        {item.text}
      </Text>
      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={() => deleteTodo(item.id)}
      >
        <Text style={styles.deleteButtonText}>×</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Tasks</Text>

        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'active' && styles.activeTab]}
            onPress={() => setActiveTab('active')}
          >
            <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>
              Active ({activeTodos.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
            onPress={() => setActiveTab('completed')}
          >
            <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
              Completed ({completedTodos.length})
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.mainContent}>
          <View style={styles.listWrapper}>
            {activeTab === 'completed' && completedTodos.length > 0 && (
              <TouchableOpacity 
                style={styles.clearButton}
                onPress={clearCompletedTasks}
              >
                <Text style={styles.clearButtonText}>Clear All Completed</Text>
              </TouchableOpacity>
            )}

            <FlatList
              data={activeTab === 'active' ? activeTodos : completedTodos}
              keyExtractor={(item) => item.id}
              contentContainerStyle={[
                styles.listContainer,
                activeTab === 'completed' && completedTodos.length > 0 && styles.listWithClearButton
              ]}
              renderItem={renderTodoItem}
              ListEmptyComponent={() => (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    {activeTab === 'active' 
                      ? "No active tasks. Add one below!" 
                      : "No completed tasks yet."}
                  </Text>
                </View>
              )}
            />
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBarBackground}>
            <Animated.View style={[styles.progressBarFill, progressBarStyle]} />
          </View>
          <Text style={styles.progressText}>
            {completedTasks} of {totalTasks} tasks completed
          </Text>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Add a new task..."
            placeholderTextColor="#666"
            value={newTodo}
            onChangeText={setNewTodo}
          />
          <TouchableOpacity style={styles.addButton} onPress={addTodo}>
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 50,
  },
  mainContent: {
    flex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  progressContainer: {
    backgroundColor: '#333',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#222',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 3,
  },
  progressText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'right',
  },
  inputContainer: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 15,
  },
  input: {
    flex: 1,
    backgroundColor: '#222',
    color: '#fff',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listWrapper: {
    flex: 1,
    marginBottom: 80, // Space for the progress bar
  },
  listContainer: {
    paddingBottom: 80, // Add padding to account for the progress bar
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#333',
    borderRadius: 10,
    marginBottom: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    marginRight: 15,
  },
  checkboxCompleted: {
    backgroundColor: '#007AFF',
  },
  todoText: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  todoTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#666',
  },
  deleteButton: {
    padding: 5,
  },
  deleteButtonText: {
    color: '#ff3b30',
    fontSize: 24,
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    backgroundColor: '#333',
    borderRadius: 10,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#fff',
  },
  clearButton: {
    backgroundColor: '#ff3b30',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 15,
    alignSelf: 'flex-end',
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  listWithClearButton: {
    paddingTop: 0,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
}); 