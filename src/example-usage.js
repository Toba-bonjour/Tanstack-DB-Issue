import { QueryClient } from '@tanstack/react-query';
import { startOfflineExecutor } from '@tanstack/offline-transactions';
import { createCollection } from './OfflineCollection/createCollection';
import { createActions } from './OfflineCollection/createActions';
import { createOfflineMutationPersiter } from './OfflineCollection/createMutationPerister';
import { z } from 'zod';


let fakeTodos = [
  { id: crypto.randomUUID(), title: 'Learn TanStack', completed: false, createdAt: new Date('2024-01-01') },
  { id: crypto.randomUUID(), title: 'Build an app', completed: false, createdAt: new Date('2024-01-02') },
];

// Endpoint findMany
const findManyTodos = async () => {
  // Simuler un délai réseau
  await new Promise(resolve => setTimeout(resolve, 300));
  console.log('findMany called, returning:', fakeTodos);
  return { data: [...fakeTodos] };
};

// Endpoint addOne
const addOneTodo = async ( data ) => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const newTodo = { ...data };
  fakeTodos.push(newTodo);
  console.log('addOne called, created:', newTodo);
  return { data: [newTodo] };
};

// Endpoint updateOne
const updateOneTodo = async ({ id, changes }) => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const index = fakeTodos.findIndex(todo => todo.id === id);
  if (index === -1) {
    throw new Error(`Todo with id ${id} not found`);
  }
  fakeTodos[index] = { ...fakeTodos[index], ...changes };
  console.log('updateOne called, updated:', fakeTodos[index]);
  return { data: [fakeTodos[index]] };
};

// Endpoint deleteOne
const deleteOneTodo = async ({ id }) => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const index = fakeTodos.findIndex(todo => todo.id === id);
  if (index === -1) {
    throw new Error(`Todo with id ${id} not found`);
  }
  const deleted = fakeTodos.splice(index, 1)[0];
  console.log('🗑️ deleteOne called, deleted:', deleted);
  return { data: [deleted] };
};


const queryClient = new QueryClient();


const todoSchema = z.object({
  id: z.uuid().default(() => crypto.randomUUID()), 
  title: z.string().default(''),
  completed: z.boolean().default(false),
  createdAt: z.date().default(() => new Date()),
});

const persiterConfig = {
  onInsert: 'offline',
  onUpdate: 'offline',
  onDelete: 'offline', 
}

const {
  collection,
  mutationsMap,
  applyWrite,

} = createCollection({
  name: 'todos',
  queryClient,
  schema: todoSchema,
  itemId: ['id'],
  ...persiterConfig,
  queryKey: ['todos'],
  syncMode: 'eager',
  queries: {
    findMany: findManyTodos,
  },
  mutations: {
    addOne: addOneTodo,
    updateOne: updateOneTodo,
    deleteOne: deleteOneTodo,
  },
});


const syncTodos = createOfflineMutationPersiter(
    mutationsMap,
    collection,
    applyWrite,
);

const offlineExecutor = startOfflineExecutor({
  collections: {
    todos: collection
  },
  mutationFns: {
    syncTodos,
  },
  onLeadershipChange: (isLeader) => {
    if (!isLeader) {
      console.info('Running in online-only mode (another tab is the leader)');
    } else {
      console.info('This tab is now the leader');
    }
  }
});


export const todoActions = createActions({
  name: 'todos',
  ...persiterConfig,
  collection,
  offlineExecutor,
});


export { collection as todoCollection, queryClient };


