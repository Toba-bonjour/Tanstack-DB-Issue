export function createMutationsMap(mutationsApi){
    return {
        
        insert: (m, idempotencyKey) => {
            console.log('mutation insert', m);
            return mutationsApi.addOne({
                data: m.modified,
                metadata: m.metadata,
                idempotencyKey
            })
        },

        update: (m, idempotencyKey) => {
            console.log('mutation update', m);
            return mutationsApi.updateOne({
                key: m.key,
                changes: m.changes,
                idempotencyKey,
                metadata: m.metadata,
            })
        },

        delete: (m, idempotencyKey) => {
            console.log('mutation delete', m, idempotencyKey);
            //const mutation = { ...m};
            //console.log('mutation delete', mutation);
            //console.log('mutation delete', JSON.stringify(mutation));
            return mutationsApi.deleteOne({
                key: m.key,
                metadata: m.metadata,
                idempotencyKey
            })
        }
    };
}