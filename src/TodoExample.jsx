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

  const { data: todos = [], isLoading, isError, error } = useLiveQuery((q) =>
    q.from({ todos: todoCollection })
  );

  const handleAddTodo = () => {
    if (!newTodoTitle.trim()) return;

    todoActions.addOne({
        title: newTodoTitle,
        completed: false
    });

    setNewTodoTitle('');
  };

  const handleToggleTodo = (id, completed) => {
    todoActions.updateOne({
      id,
      changes: { completed: !completed }
    });
  };

  const handleDeleteTodo = (id) => {
    todoActions.deleteOne({ id });
  };


  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Todo List</h1>

      <div style={{ marginBottom: '20px' }}>
          <button onClick={todoCollection.utils.refetch} style={{ padding: '8px 16px' }}>
          refetch
        </button>
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
