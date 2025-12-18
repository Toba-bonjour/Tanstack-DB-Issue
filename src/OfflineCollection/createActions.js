import { capitaliseString } from "./utils";


// Convenient factory function that create a set of actions based on the persisters definition.
// onInsert, onUpdate and onDelete can have the values: 'online' | 'optimistic' | 'offline'.
export function createActions({
    name,
    onInsert,
    onUpdate,
    onDelete,
    collection,
    offlineExecutor
}) {

    const mutationFnName = `sync${capitaliseString(name)}`;
    const actions = {};

    if (onInsert === 'online') {
        actions.addOne = ({ data, metadata = {} }) => {
            console.log('Using onInsert online action');
            const tx = collection.insert(
                data,
                {
                    optimistic: false,
                    metadata: { metadata }
                }
            );
            return tx.isPersisted.promise;
        };


    } else if (onInsert === 'optimistic') {
        actions.addOne = ({ data, metadata = {} }) => {
            console.log('Using onInsert optimistic action');
            const tx = collection.insert(
                data,
                {
                    optimistic: true,
                    metadata: { metadata }
                }
            );
            return tx;
        };

    } else if (onInsert === 'offline') {
        actions.addOne = ({ data, metadata = {} }) => {
            console.log('Using onInsert offline action');
            const tx = offlineExecutor.createOfflineTransaction({
                mutationFnName,
                autoCommit: true
            });

            tx.mutate(() => collection.insert(
                data,
                { metadata }
            ));

            return tx;
        };
    }

    // Update actions
    if (onUpdate === 'online') {
        actions.updateOne = ({ key, changes, metadata = {} }) => {
            console.log('Using onUpdate online action');
            const tx = collection.update(
                key,
                { optimistic: false, metadata: { metadata } },
                (draft) => Object.assign(draft, changes)
            );
            return tx.isPersisted.promise;
        };

    } else if (onUpdate === 'optimistic') {
        actions.updateOne = ({ key, changes, metadata = {} }) => {
            console.log('Using onUpdate optimistic action');
            const tx = collection.update(
                key,
                { optimistic: true, metadata: { metadata } },
                (draft) => Object.assign(draft, changes)

            );
            return tx;
        };

    } else if (onUpdate === 'offline') {
        actions.updateOne = ({ key, changes, metadata = {} }) => {
            console.log('Using onUpdate offline action');
            const tx = offlineExecutor.createOfflineTransaction({
                mutationFnName,
                autoCommit: true
            });

            tx.mutate(() => collection.update(
                key,
                { metadata },
                (draft) => Object.assign(draft, changes)
            ));
            return tx;
        };
    }

    // Delete actions
    if (onDelete === 'online') {
        console.log('Using onDelete online action');
        actions.deleteOne = ({ key, metadata = {} }) => {

            const tx = collection.delete(
                key,
                {
                    optimistic: false,
                    metadata: { metadata }
                }
            );
            return tx.isPersisted.promise;
        };

    } else if (onDelete === 'optimistic') {
        console.log('Using onDelete optimistic action');
        actions.deleteOne = ({ key, metadata = {} }) => {

            const tx = collection.delete(
                key,
                {
                    optimistic: true,
                    metadata: { metadata }
                }
            );
            return tx;
        };

    } else if (onDelete === 'offline') {
        
        actions.deleteOne = ({ key, metadata = {} }) => { 
            console.log('Using onDelete offline action');
            const tx = offlineExecutor.createOfflineTransaction({
                mutationFnName,
                autoCommit: true
            });
            tx.mutate(() => {
                collection.delete( key, { metadata } )
            });
            return tx;
        };
    }

    return actions;
}