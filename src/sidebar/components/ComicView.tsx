import { useEffect } from 'preact/hooks';

import { withServices } from '../service-context';
import TimelineList from './TimelineList';
import { useSidebarStore } from '../store';
import { RecordingService } from '../services/recording';

export type ComicViewProps = {
  // injected
  recordingService: RecordingService;
};
/**
 * The main content of the "comic" route (https://hypothes.is/comic)
 *
 * @param {ComicViewProps} props
 */
function ComicView({ recordingService }: ComicViewProps) {
  const store = useSidebarStore();
  const sessionId = store.routeParams().sessionId ?? '';
  const userid = store.routeParams().userid ?? '';

  const selectedRecording = store.getSelectedRecord();
  const allRecordingsCount = store.allRecordingsCount();

  useEffect(() => {
    store.annotationFetchStarted();
    recordingService.getRecording(sessionId, userid);
    store.annotationFetchFinished();
  }, [allRecordingsCount]);

  return (
    <div className="" data-testid="comic-container">
      {selectedRecording ? (
        <TimelineList
          recording={selectedRecording}
          onSelectImage={() => {}}
          onDataComicsEvent={() => {}}
          onNewPage={() =>{}}
          onClose={() => {}}
        />
      ) : (
        <div>invaild params</div>)
      }
    </div>
  );
}

export default withServices(ComicView, [
  'recordingService',
]);
