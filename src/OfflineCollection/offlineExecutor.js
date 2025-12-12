import { startOfflineExecutor } from '@tanstack/offline-transactions';
import { organizationCollection } from '../organization/index.js';
import { syncOrganization } from '../organization/index.js';

export const offlineExecutor = startOfflineExecutor({
    collections: { organization: organizationCollection },
    mutationFns: {
        syncOrganization,
    },
    
    onLeadershipChange: (isLeader) => {
      if (!isLeader) {
          console.info('Running in online-only mode (another tab is the leader)');
      }
    },
  });



