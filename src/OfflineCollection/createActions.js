import { capitaliseString, checkMetadata } from "./utils";

export function createActions({
    name,
    onInsert,
    onUpdate,
    onDelete,
    collection,
    offlineExecutor
}) {

    console.log('creating actions : ', { onInsert, onUpdate, onDelete })

    const mutationFnName = `sync${capitaliseString(name)}`;
    const actions = {};

    if (onInsert === 'online') {
        actions.addOne = ( data, metadata ) => {

            const tx = collection.insert(
                data,
                {
                    optimistic: false,
                    metadata: { context: 'online', ...metadata }
                }
            );
            return tx.isPersisted.promise;
        };


    } else if (onInsert === 'optimistic') {
        actions.addOne = ( data, metadata ) => {

            const tx = collection.insert(
                data,
                {
                    optimistic: true,
                    metadata: { context: 'optimistic', ...metadata }
                }
            );
            return tx;
        };

    } else if (onInsert === 'offline') {
        actions.addOne = ( data, metadata ) => {

            const tx = offlineExecutor.createOfflineTransaction({
                mutationFnName,
                autoCommit: true
            });

            tx.mutate(() => collection.insert(
                data,
                { metadata: { context: 'offline', ...metadata } }
            ));
            return tx;
        };
    }

    // Update actions
    if (onUpdate === 'online') {
        actions.updateOne = ({ id, changes, metadata } = {}) => {
            checkMetadata(metadata);
            const tx = collection.update(
                id,
                {
                    optimistic: false,
                    metadata: { context: 'online', ...metadata }
                },
                (draft) => Object.assign(draft, changes)
            );
            return tx.isPersisted.promise;
        };

    } else if (onUpdate === 'optimistic') {
        actions.updateOne = ({ id, changes, metadata } = {}) => {
            checkMetadata(metadata);
            const tx = collection.update(
                id,
                {
                    optimistic: true,
                    metadata: { context: 'optimistic', ...metadata }
                },
                (draft) => Object.assign(draft, changes)
                
            );
            return tx;
        };

    } else if (onUpdate === 'offline') {
        actions.updateOne = ({ id, changes, metadata } = {}) => {
            console.log({ id, changes, metadata })

            checkMetadata(metadata);
            const tx = offlineExecutor.createOfflineTransaction({
                mutationFnName,
                autoCommit: true
            });
            tx.mutate(() => collection.update(
                id,
                { metadata: { context: 'offline', ...metadata } },
                (draft) => Object.assign(draft, changes)
                
            ));
            return tx;
        };
    }

    // Delete actions
    if (onDelete === 'online') {
        actions.deleteOne = ({ id, metadata } = {}) => {
            checkMetadata(metadata);
            const tx = collection.delete(
                id,
                {
                    optimistic: false,
                    metadata: { context: 'online', ...metadata }
                }
            );
            return tx.isPersisted.promise;
        };

    } else if (onDelete === 'optimistic') {
        actions.deleteOne = ({ id, metadata } = {}) => {
            checkMetadata(metadata);
            const tx = collection.delete(
                id,
                {
                    optimistic: true,
                    metadata: { context: 'optimistic', ...metadata }
                }
            );
            return tx;
        };

    } else if (onDelete === 'offline') {
        actions.deleteOne = ({ id, metadata } = {}) => {
            checkMetadata(metadata);
            const tx = offlineExecutor.createOfflineTransaction({
                mutationFnName,
                autoCommit: true
            });
            tx.mutate(() => collection.delete(
                id,
                {
                    metadata: { context: 'offline', ...metadata }
                }
            ));
            return tx;
        };
    }

    return actions;
}