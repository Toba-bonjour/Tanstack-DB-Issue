export function createApplyWrite(getKey) {

    return ({ mutationType, response, collection }) => {

        console.log('Applying direct write ', { mutationType, response })

        if (mutationType === 'delete') {
            collection.utils.writeBatch(() => {
                response.data.forEach((serverItem) => {
                    const key = getKey(serverItem);
                    collection.utils.writeDelete(key);
                })
            });
            
        } else {

            collection.utils.writeBatch(() => {
                response.data.forEach((serverItem) => {
                    collection.utils.writeUpsert(serverItem)
                })
            });
        }

    }
}

