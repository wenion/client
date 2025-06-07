import { CancelIcon } from '@hypothesis/frontend-shared';
import classnames from 'classnames';
import { useCallback, useEffect, useState } from 'preact/hooks';

import { withServices } from '../service-context';
import type { RecordingService } from '../services/recording';
import { useSidebarStore } from '../store';
import ArrowDownwardIcon from '../../images/icons/arrow-downward';


export type FloatingPanelProps = {
  recordingService: RecordingService;
};

/**
 * Tabbed display of annotations and notes
 */
function FloatingPanel({
  recordingService,
}: FloatingPanelProps) {
  const store = useSidebarStore();
  const tabName = store.selectedTab();

  const recordSteps = store.recordSteps();
  const expertStep = store.getExpertStep();
  const recordView = recordingService.getRecordTabView();

  const [timer, setTimer] = useState<number | undefined>(undefined);

  const onShow = useCallback(()=> {
    clearTimeout(timer);
    if (expertStep) {
      const step = recordSteps.find(step => step.id === expertStep.id);
      recordingService.scrollTo(step ? step.id: null);
    }
    setTimer(setTimeout(() => store.setExpertStep(null), 1000));
  }, [recordSteps, expertStep]);

  useEffect(()=> {
    if (expertStep && tabName === 'shareflow' && recordView === 'view') {
      clearTimeout(timer);
      setTimer(setTimeout(() => store.setExpertStep(null), 12000));
    } else {
      clearTimeout(timer);
    }
  }, [expertStep, tabName, recordView]);

  return (
    <>
      {expertStep && tabName === 'shareflow' && recordView === 'view' && (
        <div className='fixed z-10 left-2 bottom-4 animate-fade-in-slow'>
          <div
            className={classnames(
              "flex w-64",
              "border-4 border-amber-400 rounded-lg",
              "cursor-pointer bg-slate-200/50",
              "hover:bg-slate-200/80",
            )}
          >
            <div className="flex" onClick={onShow}>
              <p className="grow text-xl text-gray-500">
                Got stuck? The below expert step may help
              </p>
              <div className="flex w-24 justify-center items-center">
                <ArrowDownwardIcon />
              </div>
            </div>
            <div
              className="flex w-12"
              onClick={() => store.setExpertStep(null)}
            >
              <CancelIcon />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default withServices(FloatingPanel, ['recordingService']);
