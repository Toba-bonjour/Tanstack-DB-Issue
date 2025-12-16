import { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { useLiveQuery } from '@tanstack/react-db';
import {
  queryClient,
  todoCollection,
  todoActions,
} from './example-usage';

function TodoList() {
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [filterUserId, setFilterUserId] = useState(1);

  const { data: allTodos = [], isLoading, isError, error } = useLiveQuery((q) =>
    q.from({ todos: todoCollection })
  );

  // Filter todos by userId (JSONPlaceholder has 200 todos across 10 users)
  const todos = allTodos.filter(todo => todo.userId === filterUserId);

  const handleAddTodo = () => {
    if (!newTodoTitle.trim()) return;

    todoActions.addOne({
      data: {
        id: Date.now(),
        userId: filterUserId,
        title: newTodoTitle,
        completed: false
      },
      metadata: 'hello'
    });

    setNewTodoTitle('');
  };

  const handleToggleTodo = (id, completed) => {
    todoActions.updateOne({
      key: id,
      changes: { completed: !completed }
    });
  };

  const handleDeleteTodo = (key) => {
    const metadata = { hannnn: 'oui'}
    console.log('key', key)
    todoActions.deleteOne({ 
      key, 
      metadata 
    });
  };


  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Todo List</h1>

      <div style={{ marginBottom: '20px' }}>
        <button onClick={todoCollection.utils.refetch} style={{ padding: '8px 16px' }}>
          Refetch
        </button>

        <div style={{ marginTop: '16px' }}>
          <label style={{ marginRight: '8px', fontWeight: 'bold' }}>
            Filter by User ID:
          </label>
          <select
            value={filterUserId}
            onChange={(e) => setFilterUserId(Number(e.target.value))}
            style={{ padding: '4px 8px', fontSize: '14px' }}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(id => (
              <option key={id} value={id}>User {id}</option>
            ))}
          </select>
          <span style={{ marginLeft: '8px', color: '#666' }}>
            ({todos.length} todos)
          </span>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Add todo</h2>
        <input
          type="text"
          value={newTodoTitle}
          onChange={(e) => setNewTodoTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddTodo()}
          placeholder="Title..."
          style={{ padding: '8px', marginRight: '8px', width: '300px' }}
        />
        <button onClick={handleAddTodo} style={{ padding: '8px 16px' }}>
          ➕ add
        </button>
      </div>

      <div>
        <h2>List</h2>
        {isLoading && <p>Chargement...</p>}
        {isError && <p>Erreur: {error?.message || 'Une erreur est survenue'}</p>}
        {!isLoading && !isError && (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {todos.map((todo) => (
              <li
                key={todo.id}
                style={{
                  padding: '12px',
                  margin: '8px 0',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => handleToggleTodo(todo.id, todo.completed)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span
                    style={{
                      textDecoration: todo.completed ? 'line-through' : 'none',
                      color: todo.completed ? '#888' : '#000'
                    }}
                  >
                    {todo.title}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteTodo(todo.id)}
                  style={{
                    padding: '4px 12px',
                    backgroundColor: '#f44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
        {!isLoading && !isError && todos.length === 0 && (
          <p style={{ color: '#888' }}>No todo found</p>
        )}
      </div>
    </div>
  );
}

export default function TodoExample() {
  return (
    <QueryClientProvider client={queryClient}>
      <TodoList />
    </QueryClientProvider>
  );
}
