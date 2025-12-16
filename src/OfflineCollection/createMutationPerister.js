// Factory function to create a persister for the collection
export function createCollectionMutationPersiter(mutationsMap, applyWrite) {
    return async ({ transaction, collection }) => {
        await transactionCore({ transaction, collection, mutationsMap, applyWrite });
        return { refetch: false };
    }
}

// Factory function to create a persister for the offline executor 
// (consumed through mutationFns)
export function createOfflineMutationPersiter(mutationsMap, collection, applyWrite) {
    return async ({ transaction, idempotencyKey }) => {
        await transactionCore({ transaction, collection, mutationsMap, applyWrite, idempotencyKey });
    }
}

async function transactionCore({ transaction, collection, mutationsMap, applyWrite, idempotencyKey }){
    const responses = [];
    for (const mutation of transaction.mutations){
        const response = await executeMutation({mutation, mutationsMap, idempotencyKey});
        // pushes { mutationType, response }
        responses.push(response);
    };
    applyWrite({ responses, collection });   
}

async function executeMutation({ mutation, mutationsMap, idempotencyKey}) {
    const mutationType = mutation.type;
    const mutationFn = mutationsMap[mutationType];
    const response = await mutationFn(mutation, idempotencyKey);
    return { mutationType, response };
}



