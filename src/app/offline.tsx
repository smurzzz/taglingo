import React from 'react';

import { OfflineView } from '@/components/taglingo/OfflineView';
import { BottomNav } from '@/components/taglingo/BottomNav';

export default function OfflineScreen() {
  return (
    <>
      <OfflineView />
      <BottomNav muted />
    </>
  );
}
