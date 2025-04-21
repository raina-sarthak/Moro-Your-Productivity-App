import { Text, View, StyleSheet, TextInput, TouchableOpacity, FlatList, Modal } from 'react-native';
import { useState, useEffect, useMemo } from 'react';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { storage, Todo, Priority } from '../../utils/storage';
import { Ionicons } from '@expo/vector-icons';

type TabType = 'active' | 'completed';
type SortType = 'date' | 'priority' | 'alphabetical' | 'completion';

export default function TasksScreen() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [selectedPriority, setSelectedPriority] = useState<Priority>('medium');
  const [sortBy, setSortBy] = useState<SortType>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);

  useEffect(() => {
    loadTodos();
  }, []);

  const loadTodos = async () => {
    const loadedTodos = await storage.loadTodos();
    setTodos(loadedTodos);
  };

  const { activeTodos, completedTodos } = useMemo(() => {
    return {
      activeTodos: todos.filter(todo => !todo.completed),
      completedTodos: todos.filter(todo => todo.completed)
    };
  }, [todos]);

  const completedTasks = todos.filter(todo => todo.completed).length;
  const totalTasks = todos.length;
  const progress = totalTasks > 0 ? completedTasks / totalTasks : 0;

  const addTodo = async () => {
    if (newTodo.trim()) {
      const newTodos = [...todos, {
        id: Date.now().toString(),
        text: newTodo,
        completed: false,
        createdAt: Date.now(),
        priority: selectedPriority
      }];
      setTodos(newTodos);
      setNewTodo('');
      await storage.saveTodos(newTodos);
    }
  };

  const toggleTodo = async (id: string) => {
    const newTodos = todos.map(todo => 
      todo.id === id 
        ? { 
            ...todo, 
            completed: !todo.completed,
            completedAt: !todo.completed ? Date.now() : undefined
          } 
        : todo
    );
    setTodos(newTodos);
    await storage.saveTodos(newTodos);

    // Update productivity data if task was completed
    const todo = todos.find(t => t.id === id);
    if (todo && !todo.completed) {
      await storage.updateProductivityData({
        tasksCompleted: 1
      });
    }
  };

  const deleteTodo = async (id: string) => {
    const newTodos = todos.filter(todo => todo.id !== id);
    setTodos(newTodos);
    await storage.saveTodos(newTodos);
  };

  const clearCompletedTasks = async () => {
    const newTodos = todos.filter(todo => !todo.completed);
    setTodos(newTodos);
    await storage.saveTodos(newTodos);
  };

  const progressBarStyle = useAnimatedStyle(() => ({
    width: withTiming(`${progress * 100}%`, { duration: 500 }),
    backgroundColor: withTiming(
      progress >= 0.8 ? '#007AFF' : 
      progress >= 0.5 ? '#4A90E2' : 
      progress >= 0.2 ? '#666' : '#444',
      { duration: 500 }
    ),
  }), [progress]);

  const sortedTodos = useMemo(() => {
    const activeTodos = todos.filter(todo => !todo.completed);
    const completedTodos = todos.filter(todo => todo.completed);

    const sortTodos = (todos: Todo[]) => {
      return [...todos].sort((a, b) => {
        switch (sortBy) {
          case 'priority':
            // Handle unmarked tasks (undefined priority)
            if (!a.priority && !b.priority) return 0;
            if (!a.priority) return 1; // Move unmarked to bottom
            if (!b.priority) return -1; // Move unmarked to bottom
            
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            return sortDirection === 'desc' 
              ? priorityOrder[a.priority] - priorityOrder[b.priority]
              : priorityOrder[b.priority] - priorityOrder[a.priority];
          
          case 'alphabetical':
            return sortDirection === 'desc'
              ? a.text.localeCompare(b.text)
              : b.text.localeCompare(a.text);
          
          case 'completion':
            if (a.completedAt && b.completedAt) {
              return sortDirection === 'desc'
                ? b.completedAt - a.completedAt
                : a.completedAt - b.completedAt;
            }
            return a.completedAt ? 1 : -1;
          
          default: // date
            return sortDirection === 'desc'
              ? b.createdAt - a.createdAt
              : a.createdAt - b.createdAt;
        }
      });
    };

    return {
      activeTodos: sortTodos(activeTodos),
      completedTodos: sortTodos(completedTodos)
    };
  }, [todos, sortBy, sortDirection]);

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'high': return '#FF453A';
      case 'medium': return '#FFD60A';
      case 'low': return '#32D74B';
      default: return '#007AFF';
    }
  };

  const renderTodoItem = ({ item }: { item: Todo }) => (
    <TouchableOpacity 
      style={[styles.todoItem, { borderLeftWidth: 4, borderLeftColor: getPriorityColor(item.priority) }]}
      onPress={() => toggleTodo(item.id)}
      activeOpacity={0.7}
    >
      <View style={[styles.checkbox, item.completed && styles.checkboxCompleted]}>
        {item.completed && (
          <Text style={styles.checkmark}>✓</Text>
        )}
      </View>
      <Text style={[styles.todoText, item.completed && styles.todoTextCompleted]}>
        {item.text}
      </Text>
      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={(e) => {
          e.stopPropagation();
          deleteTodo(item.id);
        }}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={styles.deleteButtonText}>×</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const PriorityDropdown = () => (
    <View style={styles.priorityDropdown}>
      {(['high', 'medium', 'low'] as Priority[]).map((priority) => (
        <TouchableOpacity
          key={priority}
          style={[
            styles.priorityOption,
            { backgroundColor: getPriorityColor(priority) }
          ]}
          onPress={() => {
            setSelectedPriority(priority);
            setShowPriorityDropdown(false);
          }}
        >
          <Text style={styles.priorityText}>
            {priority.charAt(0).toUpperCase() + priority.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  const SortModal = () => (
    <Modal
      visible={showSortModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowSortModal(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1} 
        onPress={() => setShowSortModal(false)}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Sort By</Text>
          {[
            { type: 'date', label: 'Date Added' },
            { type: 'priority', label: 'Priority' },
            { type: 'alphabetical', label: 'Alphabetical' }
          ].map((option) => (
            <TouchableOpacity
              key={option.type}
              style={[
                styles.sortOption,
                sortBy === option.type && styles.activeSortOption
              ]}
              onPress={() => {
                if (sortBy === option.type) {
                  toggleSortDirection();
                } else {
                  setSortBy(option.type as SortType);
                  setSortDirection(option.type === 'alphabetical' ? 'asc' : 'desc');
                }
                setShowSortModal(false);
              }}
            >
              <Text style={[
                styles.sortOptionText,
                sortBy === option.type && styles.activeSortOptionText
              ]}>
                {option.label} {sortBy === option.type && (sortDirection === 'desc' ? '↓' : '↑')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
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
              Active ({sortedTodos.activeTodos.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
            onPress={() => setActiveTab('completed')}
          >
            <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
              Completed ({sortedTodos.completedTodos.length})
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.listWrapper}>
          <View style={styles.actionsContainer}>
            {activeTab === 'completed' && sortedTodos.completedTodos.length > 0 ? (
              <TouchableOpacity 
                style={styles.clearButton}
                onPress={clearCompletedTasks}
              >
                <Text style={styles.clearButtonText}>Clear All Completed</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.spacer} />
            )}
            <TouchableOpacity 
              style={styles.sortButton}
              onPress={() => setShowSortModal(true)}
            >
              <Text style={styles.sortButtonText}>
                Sort: {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)} {sortDirection === 'desc' ? '↓' : '↑'}
              </Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={activeTab === 'active' ? sortedTodos.activeTodos : sortedTodos.completedTodos}
            keyExtractor={(item) => item.id}
            renderItem={renderTodoItem}
            contentContainerStyle={[
              styles.listContainer,
              activeTab === 'completed' && sortedTodos.completedTodos.length > 0 && styles.listWithClearButton
            ]}
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

        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Progress</Text>
            <Text style={styles.progressPercentage}>
              {Math.round(progress * 100)}%
            </Text>
          </View>
          <View style={styles.progressBarBackground}>
            <Animated.View style={[styles.progressBarFill, progressBarStyle]} />
          </View>
          <Text style={styles.progressText}>
            {completedTasks} of {totalTasks} tasks completed
          </Text>
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Add a new task..."
              placeholderTextColor="#666"
              value={newTodo}
              onChangeText={setNewTodo}
            />
            <View style={styles.priorityContainer}>
              {showPriorityDropdown && <PriorityDropdown />}
              <TouchableOpacity 
                style={[styles.priorityButton, { backgroundColor: getPriorityColor(selectedPriority) }]}
                onPress={() => setShowPriorityDropdown(!showPriorityDropdown)}
              >
                <View style={styles.priorityButtonContent}>
                  <Ionicons name="flag" size={16} color="#fff" />
                  <Text style={styles.priorityButtonText}>
                    {selectedPriority.charAt(0).toUpperCase() + selectedPriority.slice(1)}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={addTodo}>
            <Ionicons name="add" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <SortModal />
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
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  progressPercentage: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#222',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
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
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
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
    minHeight: 60,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxCompleted: {
    backgroundColor: '#007AFF',
  },
  todoText: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 8,
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
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  clearButton: {
    backgroundColor: '#ff3b30',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  sortButton: {
    backgroundColor: '#333',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 120,
  },
  sortButtonText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
  listWithClearButton: {
    paddingTop: 0,
  },
  emptyContainer: {
    padding: 20,
    paddingTop: 150,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  priorityContainer: {
    position: 'relative',
  },
  priorityDropdown: {
    position: 'absolute',
    bottom: 45,
    right: 0,
    backgroundColor: '#333',
    borderRadius: 10,
    padding: 8,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  priorityOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  priorityText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  priorityButton: {
    minWidth: 100,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  priorityButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priorityButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#333',
    borderRadius: 15,
    padding: 20,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  sortOption: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  activeSortOption: {
    backgroundColor: '#2e2e2e',
  },
  sortOptionText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
  },
  activeSortOptionText: {
    color: '#fff',
  },
  spacer: {
    width: 1,
  },
}); 