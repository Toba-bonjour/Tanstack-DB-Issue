export function capitaliseString(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export function checkMetadata(metadata){
    if (metadata && 'context' in metadata) {
        throw new Error('"context" property is reserved in metadata object.');
    }
}