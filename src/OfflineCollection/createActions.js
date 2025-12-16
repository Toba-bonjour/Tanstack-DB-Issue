import { capitaliseString } from "./utils";

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

            const tx = collection.update(
                key,
                { optimistic: false, metadata: { metadata } },
                (draft) => Object.assign(draft, changes)
            );
            return tx.isPersisted.promise;
        };

    } else if (onUpdate === 'optimistic') {
        actions.updateOne = ({ key, changes, metadata = {} }) => {
 
            const tx = collection.update(
                key,
                { optimistic: true, metadata: { metadata } },
                (draft) => Object.assign(draft, changes)

            );
            return tx;
        };

    } else if (onUpdate === 'offline') {
        actions.updateOne = ({ key, changes, metadata = {} }) => {

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

            const tx = offlineExecutor.createOfflineTransaction({
                mutationFnName,
                autoCommit: true
            });
            tx.mutate(() => collection.delete(
                key,
                { metadata }
            ));
            return tx;
        };
    }

    return actions;
}