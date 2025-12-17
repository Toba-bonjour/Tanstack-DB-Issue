export function createMutationsMap(mutationsApi){
    return {
        insert: (m, idempotencyKey) => {
            return mutationsApi.addOne({
                data: m.modified,
                metadata: m.metadata,
                idempotencyKey
            })
        },

        update: (m, idempotencyKey) => {
            return mutationsApi.updateOne({
                key: m.key,
                changes: m.changes,
                idempotencyKey,
                metadata: m.metadata,
            })
        },

        delete: (m, idempotencyKey) => {
            return mutationsApi.deleteOne({
                key: m.key,
                metadata: m.metadata,
                idempotencyKey
            })
        }
    };
}