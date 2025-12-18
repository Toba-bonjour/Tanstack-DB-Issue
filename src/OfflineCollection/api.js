const API_URL = 'https://jsonplaceholder.typicode.com';


export const findManyTodos = async () => {
  const response = await fetch(`${API_URL}/todos`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch todos: ${response.statusText}`);
  }
  const data = await response.json();

  const result = {
    success: true,
    prop: 'yo',
    data: data
  };
  console.log('findManyTodos returning:', result);
  return result;
};

// jsonplaceholder.typicode.com always returns the same result with
// the same id, we extract the incoming id and re-append it to the response
// before returning it.
export const addOneTodo = async ({ data, metadata, idempotencyKey }) => {
  const { id } = data;
  const response = await fetch(`${API_URL}/todos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`Failed to create todo: ${response.statusText}`);
  }
  const newTodo = await response.json();
  newTodo.id = id;

  const result = {
    success: true,
    prop: 'yo',
    data: [newTodo]
  };
  console.log('addOneTodo returning:', result);
  return result;
};


export const updateOneTodo = async ({ key, changes, metadata,  idempotencyKey}) => {
  const response = await fetch(`${API_URL}/todos/${key}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(changes),
  });
  if (!response.ok) {
    throw new Error(`Failed to update todo: ${response.statusText}`);
  }
  const updatedTodo = await response.json();

  const result = {
    success: true,
    prop: 'yo',
    data: [updatedTodo]
  };
  console.log('updateOneTodo returning:', result);
  return result;
};


// Keep track of deleted todo keys
const deletedTodoKeys = new Set();

// jsonplaceholder.typicode.com does not return any data for DELETE endpoint.
// The incoming key is manually returned for collection.utils.writeDelete(key).
export const deleteOneTodo = async ({ key, metadata,  idempotencyKey}) => {
  console.log('calling deleteOneTodo', { key, metadata,  idempotencyKey})

  // Check if this key was already deleted
  if (deletedTodoKeys.has(key)) {
    throw new Error(`Failed to delete todo: Not Found (404)`);
  }

  const response = await fetch(`${API_URL}/todos/${key}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error(`Failed to delete todo: ${response.statusText}`);
  }

  // Add the key to the deleted set
  deletedTodoKeys.add(key);

  const result = {
    success: true,
    prop: 'yo',
    data: [{id: key}]
  };
  console.log('deleteOneTodo returning:', result);
  return result;
};
