


export function createMutationsMap(mutations){
    return {
        insert: (m) => {
            return mutations.addOne(m.modified)
        },
        update: (m) => {
            return mutations.updateOne({
                id: m.key,
                changes: m.changes
            })
        },
        delete: (m) => {

            // clean context property
            if (m.metadata?.context) {
                delete m.metadata.context;
            }

            return mutations.deleteOne({
                id: m.key,
                metadata: m.metadata
            })
        }
    };
}