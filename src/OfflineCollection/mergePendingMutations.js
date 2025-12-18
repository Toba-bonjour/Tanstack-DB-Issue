/**
 * Computes the changes (diff) between original and modified objects
 * @param {object} original - The original object
 * @param {object} modified - The modified object
 * @returns {object} An object containing only the fields that changed
 */
function computeChanges(original, modified) {
  const changes = {}

  // Check all keys in modified
  for (const key in modified) {
    if (modified[key] !== original[key]) {
      changes[key] = modified[key]
    }
  }

  return changes
}

/**
 * Merges two pending mutations for the same item within a transaction
 *
 * Merge behavior truth table:
 * - (insert, update) → insert (merge changes, keep empty original)
 * - (insert, delete) → null (cancel both mutations)
 * - (update, delete) → delete (delete dominates)
 * - (update, update) → update (replace with latest, union changes)
 * - (delete, delete) → delete (replace with latest)
 * - (insert, insert) → insert (replace with latest)
 *
 * Note: (delete, update) and (delete, insert) should never occur as the collection
 * layer prevents operations on deleted items within the same transaction.
 *
 * @param existing - The existing mutation in the transaction
 * @param incoming - The new mutation being applied
 * @returns The merged mutation, or null if both should be removed
 */
export function mergePendingMutations(existing, incoming) {
  // Truth table implementation
  switch (`${existing.type}-${incoming.type}`) {
    case `insert-update`: {
      // Update after insert: keep as insert but merge changes
      // For insert-update, the key should remain the same since collections don't allow key changes
      return {
        ...existing,
        type: `insert`,
        original: {},
        modified: incoming.modified,
        changes: { ...existing.changes, ...incoming.changes },
        // Keep existing keys (key changes not allowed in updates)
        key: existing.key,
        globalKey: existing.globalKey,
        // Merge metadata (last-write-wins)
        metadata: incoming.metadata ?? existing.metadata,
        syncMetadata: { ...existing.syncMetadata, ...incoming.syncMetadata },
        // Update tracking info
        mutationId: incoming.mutationId,
        updatedAt: incoming.updatedAt
      }
    }

    case `insert-delete`:
      // Delete after insert: cancel both mutations
      return null

    case `update-delete`:
      // Delete after update: delete dominates
      return incoming

    case `update-update`: {
      // Update after update: replace with latest, union changes
      return {
        ...incoming,
        // Keep original from first update
        original: existing.original,
        // Union the changes from both updates
        changes: { ...existing.changes, ...incoming.changes },
        // Merge metadata
        metadata: incoming.metadata ?? existing.metadata,
        syncMetadata: { ...existing.syncMetadata, ...incoming.syncMetadata }
      }
    }

    case `delete-delete`:
    case `insert-insert`:
      // Same type: replace with latest
      return incoming

    default: {
      // Exhaustiveness check
      const _exhaustive = `${existing.type}-${incoming.type}`
      throw new Error(`Unhandled mutation combination: ${_exhaustive}`)
    }
  }
}

/**
 * Extracts the key from a globalKey
 * @param {string} globalKey - Format: "KEY::collectionId/key"
 * @returns {string} The extracted key
 * @example extractKeyFromGlobalKey("KEY::todos/1") => "1"
 */
function extractKeyFromGlobalKey(globalKey) {
  const parts = globalKey.split('/')
  return parts[parts.length - 1]
}

// Track last execution time for throttling
let lastConsolidationTime = 0;
const THROTTLE_MS = 250;

/**
 * Consolidates offline transactions by merging mutations that operate on the same items.
 *
 * This function applies the same consolidation logic used within individual transactions
 * (via mergePendingMutations) across multiple transactions in the outbox.
 *
 * Algorithm:
 * 1. Sort transactions by creation time to maintain chronological order
 * 2. Extract all mutations from all transactions with their source transaction info
 * 3. Group mutations by globalKey (items they operate on)
 * 4. For each group, merge mutations sequentially using mergePendingMutations
 * 5. Distribute consolidated mutations back to their original transactions
 * 6. Remove transactions that have no mutations left after consolidation
 *
 * Examples of consolidation:
 * - insert(item1) + delete(item1) → both cancelled (no transaction needed)
 * - insert(item1) + update(item1) → single insert with merged changes
 * - update(item1) + update(item1) → single update with merged changes
 * - update(item1) + delete(item1) → single delete
 *
 * @param transactions - Array of offline transactions to consolidate
 * @returns Array of consolidated transactions (excluding those with no mutations left)
 */
export function createConsolidateTransactions(collection){

  return (transactions) => {
    console.time('⏱️ consolidateTransactions')
    console.log('=== consolidateTransactions START ===')
    console.log('collection data :', collection._state.syncedData);

    //console.log('Call stack:', new Error().stack)
    console.log('Input transactions count:', transactions.length)
    console.log('Input transactions:', transactions)

    // // Throttle check - if called too soon, skip consolidation but still reconstruct keys
    // const now = Date.now();
    // const timeSinceLastCall = now - lastConsolidationTime;
    // if (timeSinceLastCall < THROTTLE_MS) {
    //   console.log(`⏭️ THROTTLED: Called ${timeSinceLastCall}ms after last call (min ${THROTTLE_MS}ms), skipping consolidation but reconstructing keys`)
    //   // Even when throttled, we must reconstruct keys for mutations to work
    //   const transactionsWithKeys = transactions.map(tx => ({
    //     ...tx,
    //     mutations: tx.mutations.map(mut => ({
    //       ...mut,
    //       key: extractKeyFromGlobalKey(mut.globalKey)
    //     }))
    //   }))
    //   console.timeEnd('⏱️ consolidateTransactions')
    //   return transactionsWithKeys
    // }
    // lastConsolidationTime = now;

    if (transactions.length === 0) {
      console.log('No transactions, returning as-is')
      console.timeEnd('⏱️ consolidateTransactions')
      return transactions
    }

    if (transactions.length === 1) {
      console.log('Single transaction, reconstructing keys without consolidation')
      const tx = transactions[0]
      const mutationsWithKeys = tx.mutations.map(mut => ({
        ...mut,
        changes: computeChanges(mut.original || {}, mut.modified || {}),
        key: extractKeyFromGlobalKey(mut.globalKey)
      }))
      console.timeEnd('⏱️ consolidateTransactions')
      return [{
        ...tx,
        mutations: mutationsWithKeys
      }]
    }

    // Sort by creation time to maintain chronological order
    const sorted = [...transactions].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
    )
    console.log('Sorted transactions:', sorted)

    const allMutations = []

    sorted.forEach((tx, txIndex) => {
      tx.mutations.forEach((mutation, mutIndex) => {
        allMutations.push({
          mutation,
          transactionId: tx.id,
          transactionIndex: txIndex,
          mutationIndex: mutIndex
        })
      })
    })
    console.log('Total mutations extracted:', allMutations.length)
    console.log('All mutations:', allMutations)

    // Group mutations by globalKey
    const mutationsByGlobalKey = new Map()
    allMutations.forEach(mutWithCtx => {
      const key = mutWithCtx.mutation.globalKey
      if (!mutationsByGlobalKey.has(key)) {
        mutationsByGlobalKey.set(key, [])
      }
      mutationsByGlobalKey.get(key).push(mutWithCtx)
    })
    console.log('Mutations grouped by globalKey:', mutationsByGlobalKey)
    console.log('Number of unique globalKeys:', mutationsByGlobalKey.size)

    // Consolidate mutations for each globalKey
    console.log('=== Starting consolidation ===')
    const consolidatedMutations = new Map()
    const cancelledMutations = new Set()

    mutationsByGlobalKey.forEach((mutations, globalKey) => {
      console.log(`\n--- Consolidating globalKey: ${globalKey} ---`)
      console.log(`Number of mutations for this key: ${mutations.length}`)

      if (mutations.length === 1) {
        // No consolidation needed
        console.log('Single mutation, no consolidation needed')
        const mutation = mutations[0].mutation
        // Reconstruct changes from original and modified
        const reconstructedMutation = {
          ...mutation,
          changes: computeChanges(mutation.original || {}, mutation.modified || {})
        }
        consolidatedMutations.set(
          `${mutations[0].transactionId}:${mutations[0].mutationIndex}`,
          reconstructedMutation
        )
        return
      }

      // Reconstruct changes for the first mutation
      let result = {
        ...mutations[0].mutation,
        changes: computeChanges(mutations[0].mutation.original || {}, mutations[0].mutation.modified || {})
      }
      let resultKey = `${mutations[0].transactionId}:${mutations[0].mutationIndex}`
      console.log(`Starting with mutation type: ${result.type}, key: ${resultKey}`)

      for (let i = 1; i < mutations.length; i++) {
        // Reconstruct changes for the incoming mutation
        const incomingMutation = mutations[i].mutation
        const incoming = {
          ...incomingMutation,
          changes: computeChanges(incomingMutation.original || {}, incomingMutation.modified || {})
        }
        const incomingKey = `${mutations[i].transactionId}:${mutations[i].mutationIndex}`
        console.log(`  Merging mutation ${i}: ${result.type} + ${incoming.type}`)

        // Mark the incoming mutation as processed (will be merged or cancelled)
        cancelledMutations.add(incomingKey)

        // Merge with the current result
        const merged = mergePendingMutations(result, incoming)

        if (merged === null) {
          // Both mutations cancelled - mark the result as cancelled too
          console.log(`  -> Result: CANCELLED (both mutations removed)`)
          cancelledMutations.add(resultKey)
          result = null
          break
        } else {
          // Update the result
          console.log(`  -> Result: ${merged.type}`)
          result = merged
        }
      }

      // Store the final consolidated mutation (if not cancelled)
      if (result !== null) {
        console.log(`Final result for ${globalKey}: ${result.type}`)
        consolidatedMutations.set(resultKey, result)
      } else {
        console.log(`Final result for ${globalKey}: CANCELLED`)
      }
    })

    console.log('\n=== Consolidation complete ===')
    console.log('Total consolidated mutations:', consolidatedMutations.size)
    console.log('Total cancelled mutations:', cancelledMutations.size)

    // Rebuild transactions with consolidated mutations
    console.log('\n=== Rebuilding transactions ===')
    const consolidatedTransactions = []

    sorted.forEach((tx, txIndex) => {
      console.log(`\nProcessing transaction ${tx.id}:`)
      console.log(`  Original mutations count: ${tx.mutations.length}`)
      const newMutations = []

      tx.mutations.forEach((_, mutIndex) => {
        const key = `${tx.id}:${mutIndex}`
        if (consolidatedMutations.has(key) && !cancelledMutations.has(key)) {
          const mut = consolidatedMutations.get(key)
          // Reconstruct the 'key' property from globalKey for consolidated mutations
          const reconstructedKey = extractKeyFromGlobalKey(mut.globalKey)
          console.log(`  Keeping mutation ${mutIndex}: ${mut.type} for ${mut.globalKey} (key: ${reconstructedKey})`)
          newMutations.push({
            ...mut,
            key: reconstructedKey
          })
        } else {
          console.log(`  Removing mutation ${mutIndex} (cancelled or merged)`)
        }
      })

      console.log(`  New mutations count: ${newMutations.length}`)

      // Only keep transactions that still have mutations
      if (newMutations.length > 0) {
        consolidatedTransactions.push({
          ...tx,
          mutations: newMutations,
          // Update keys array to reflect remaining mutations
          keys: newMutations.map(m => m.globalKey)
        })
        console.log(`  Transaction KEPT`)
      } else {
        console.log(`  Transaction REMOVED (no mutations left)`)
      }
    })

    console.log('\n=== consolidateTransactions END ===')
    console.log('Output transactions count:', consolidatedTransactions.length)
    console.log('Output transactions:', consolidatedTransactions)
    console.timeEnd('⏱️ consolidateTransactions')

    return consolidatedTransactions
  }
}

