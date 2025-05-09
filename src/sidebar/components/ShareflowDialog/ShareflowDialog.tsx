import { Card, Tab } from '@hypothesis/frontend-shared';
import classnames from 'classnames';
import { useEffect, useState } from 'preact/hooks';

import { useSidebarStore } from '../../store';
import type { RecordItem } from '../../../types/api';
import SidebarPanel from '../SidebarPanel';
import TabHeader from '../tabs/TabHeader';
import TabPanel from '../tabs/TabPanel';
import ExportShareflow from './ExportShareflow';
import ImportShareflowSegmentation from './ImportShareflowSegmentation';
import ShareShareflow from './ShareShareflow';

export type ShareflowDialogProps = {
  /** If true, the share tab will be rendered. Defaults to false */
  shareTab?: boolean;
};

/**
 * Panel with sharing options.
 * - If provided tabs include `export` or `import`, will show a tabbed interface
 * - Else, shows a single "Share annotations" interface
 */
export default function ShareflowDialog({ shareTab }: ShareflowDialogProps) {
  const store = useSidebarStore();
  const focusedRecordItem = store.focusedRecordItemId();
  const [recordItem, setRecordItem] = useState<RecordItem | null>(null);
  const focusedGroup = store.focusedGroup();
  const groupName = (focusedGroup && focusedGroup.name) || '...';
  const panelTitle = "Share shareflow";

  useEffect(()=> {
    if (focusedRecordItem) {
      const recordItem = store.getRecordItemById(focusedRecordItem);
      setRecordItem(recordItem);
    }
  }, [focusedRecordItem]);

  // Determine initial selected tab, based on the first tab that will be displayed
  const initialTab = shareTab ? 'share' : 'export';
  const [selectedTab, setSelectedTab] = useState<'share' | 'export' | 'import'>(
    initialTab,
  );
  const isFirstTabSelected = selectedTab === initialTab;

  return (
    <SidebarPanel
      title={panelTitle}
      panelName="shareShareFlow"
      variant="custom"
    >
      <TabHeader closeTitle="Close share panel">
        {shareTab && (
          <Tab
            id="share-panel-tab"
            aria-controls="share-panel"
            variant="tab"
            selected={selectedTab === 'share'}
            onClick={() => setSelectedTab('share')}
            textContent="Share"
          >
            Share
          </Tab>
        )}
        <Tab
          id="export-panel-tab"
          aria-controls="export-panel"
          variant="tab"
          selected={selectedTab === 'export'}
          onClick={() => setSelectedTab('export')}
          textContent="Export"
        >
          Export
        </Tab>
        <Tab
          id="import-panel-tab"
          aria-controls="import-panel"
          variant="tab"
          selected={selectedTab === 'import'}
          onClick={() => setSelectedTab('import')}
          textContent="Import"
        >
          Import
        </Tab>
      </TabHeader>
      <Card classes={classnames({ 'rounded-tl-none': isFirstTabSelected })}>
        <TabPanel
          id="share-panel"
          active={selectedTab === 'share'}
          aria-labelledby="share-panel-tab"
          title={recordItem?.taskName}
        >
          <ShareShareflow />
        </TabPanel>
        <TabPanel
          id="export-panel"
          active={selectedTab === 'export'}
          aria-labelledby="export-panel-tab"
          title={`Export: ${recordItem?.taskName}`}
        >
          <ExportShareflow />
        </TabPanel>
        <TabPanel
          id="import-panel"
          active={selectedTab === 'import'}
          aria-labelledby="import-panel-tab"
          title={`Import to ${recordItem?.taskName}`}
        >
          <ImportShareflowSegmentation />
        </TabPanel>
      </Card>
    </SidebarPanel>
  );
}
