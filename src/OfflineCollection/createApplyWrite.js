export function createApplyWrite(getKey) {

    return ({ responses, collection }) => {

        collection.utils.writeBatch(() => {
            responses.forEach(({ mutationType, response }) => {

                if(!Array.isArray(response.data)){
                    throw new Error ('ApplyWrite should be feed with an array of object.')
                }

                if( response.data.length === 0 ){
                    throw new Error ('ApplyWrite: response.data should not be empty. Insert, update or delete endpoints should always return data to direct write the collection.')
                }

                if (mutationType === 'delete') {

                    response.data.forEach(serverItem => {
                        const key = getKey(serverItem);
                        console.log('Applying direct writes, deleting: ',  serverItem, key )
                        collection.utils.writeDelete(key);
                    });

                } else {
                    
                    response.data.forEach(serverItem => {
                        console.log('Applying direct writes, upserting: ',  serverItem )
                        collection.utils.writeUpsert(serverItem)
                    });
                    
                }
            });
        });

    }
}


