import { QueryClient } from '@tanstack/react-query';
import { startOfflineExecutor } from '@tanstack/offline-transactions';
import { createCollectionWrapper } from './OfflineCollection/createCollectionWrapper';
import { createActions } from './OfflineCollection/createActions';
import { createOfflineMutationPersiter } from './OfflineCollection/createMutationPerister';
import { addOneTodo, findManyTodos, updateOneTodo, deleteOneTodo } from './OfflineCollection/api';
import { z } from 'zod';

const queryClient = new QueryClient();

const todoSchema = z.object({
  id: z.number().optional(),
  userId: z.number().default(1),
  title: z.string().default(''),
  completed: z.boolean().default(false),
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

} = createCollectionWrapper({
  name: 'todos',
  queryClient,
  schema: todoSchema,
  ...persiterConfig,
  queryKey: ['todos'],
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


