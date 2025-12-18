import { createCollection } from '@tanstack/react-db';
import { queryCollectionOptions } from '@tanstack/query-db-collection';
import { createApplyWrite } from "./createApplyWrite";
import { createCollectionMutationPersiter } from "./createMutationPerister";
import { createMutationsMap } from "./createMutationsMap";


export function createCollectionWrapper(config) {
    const {
        name,
        queryClient,
        schema,
        getKey = (item) => item.id,
        onInsert, // 'online' | 'optimistic' | 'offline'
        onUpdate, // 'online' | 'optimistic' | 'offline'
        onDelete, // 'online' | 'optimistic' | 'offline'
        queryKey,
        retry = 2,
        retryDelay = (attemptIndex) => Math.min(1000 * 4 ** attemptIndex, 30000),
        gcTime = 5 * 60 * 1000,
        staleTime = 5 * 60 * 1000,
        syncMode = 'eager',
        queries,
        mutations
    } = config;

    if (!queryClient) {
        throw new Error(`CollectionOffline (${name}): no queryClient found.`);
    }
    if (!schema) {
        console.warn(`CollectionOffline (${name}): no schema found.`);
    }

    if (!queries.findMany || typeof queries.findMany !== 'function') {
        throw new Error('findMany endpoint is missing');
    }

    const applyWrite = createApplyWrite(getKey);
    const mutationsMap = createMutationsMap(mutations);
    const mutationPersister = createCollectionMutationPersiter(mutationsMap, applyWrite);


    if (onInsert && (!mutations.addOne || typeof mutations.addOne !== 'function')) {
        throw new Error('addOne endpoint is missing');
    }
    if (onUpdate && (!mutations.updateOne || typeof mutations.updateOne !== 'function')) {
        throw new Error('updateOne endpoint is missing');
    }
    if (onDelete && (!mutations.deleteOne || typeof mutations.deleteOne !== 'function')) {
        throw new Error('deleteOne endpoint is missing');
    }

    const collection = createCollection(
        queryCollectionOptions({
            id: name,
            queryFn: queries.findMany,
            syncMode,
            queryClient,
            queryKey,
            getKey,
            schema,
            retry,
            retryDelay,
            staleTime,
            gcTime,
            startSync: true,
            enable: true,
            select: (response) => response?.data,
            onInsert: mutationPersister,
            onUpdate: mutationPersister,
            //onDelete: mutationPersister
        })
    );

    return {
        collection,
        mutations,
        queries,
        mutationsMap,
        applyWrite,
    };
}
