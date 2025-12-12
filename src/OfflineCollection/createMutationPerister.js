// Factory function to create a persister ONLY for the collection
export function createCollectionMutationPersiter(mutationsMap, applyWrite) {
    return async ({ transaction, collection }) => {
        await transactionCore({ transaction, collection, mutationsMap, applyWrite });
        return { refetch: false };
    }
}

// Factory function to create a persister for the offline executor 
// (consumed through mutationFns)
export function createOfflineMutationPersiter(mutationsMap, collection, applyWrite) {
    return async ({ transaction }) => {
        await transactionCore({ transaction, collection, mutationsMap, applyWrite });
    }
}


async function transactionCore({ transaction, collection, mutationsMap, applyWrite }){
    for (const mutation of transaction.mutations) {
        const { mutationType, response } = await executeMutation({mutation, mutationsMap});
        applyWrite({ mutationType, response, collection });
    }
}

async function executeMutation({ mutation, mutationsMap}) {
    const mutationType = mutation.type;
    const context = mutation.metadata?.context;
    console.log('executeMutation', { mutationType, context })

    const mutationFn = mutationsMap[mutationType];
    const response = await mutationFn(mutation);
    return { mutationType, response };
}



