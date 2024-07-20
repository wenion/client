import { Callout } from '@hypothesis/frontend-shared';
import { useEffect, useRef, useMemo } from 'preact/hooks';

import classnames from 'classnames';
import { withServices } from '../service-context';
import { username } from '../helpers/account-id';
import type { RecordingService } from '../services/recording';
import { useSidebarStore } from '../store';

export type ChatTabProps = {
  recordingService: RecordingService;
};

/**
 * The main content of the "stream" route (https://hypothes.is/stream)
 */
function ChatTab({recordingService}: ChatTabProps) {
  const baselineRef = useRef<HTMLIFrameElement | null>(null);
  const store = useSidebarStore();
  const subjectId = username(store.profile().userid);
  const taskId = recordingService.getExtensionStatus().recordingTaskName;
  const model = store.getDefault('model');
  const token = store.getDefault('token');

  const role = store.profile().role ?? null;

  const hint = useMemo(() => {
    if (role) {
      return `The user is a Monash University ${role.teaching_role} in the Faculty of ${role.faculty}, \
located at the ${role.campus} campus. The user is teaching ${role.teaching_unit} and \
has been working for the university since ${role.joined_year}, \
with ${role.years_of_experience} ${role.years_of_experience > 1 ? 'years' : 'year'} of teaching experience.`;
    }
    return null;
  }, [role])

  const link = useMemo(()=> {
    if (hint) {
      const link = `https://chat.kmass.io/?hint=${hint}&model=${model}&task_id=${taskId}&subject_id=${subjectId}&token=${token}`
      return encodeURI(link);
    }
    return '';
  }, [subjectId, taskId, model, token, role])

  useEffect(()=> {
    const bl = baselineRef.current!;
    if (bl && subjectId && taskId !== '' && model && token) {
      bl.src = link;
    }
    else if (bl) {
      bl.src = 'https://chat.kmass.io/'
    }
  }, [subjectId, taskId, model, token])

  return (
    <div className='chat-height'>
    {subjectId && taskId !== '' && model && token && role ? (
      <iframe
        ref={baselineRef}
        src="https://chat.kmass.io/"
        title="Baseline Tool"
        className={classnames('w-full h-full')}
      />
    ) : (
      <Callout status="error">
        Invalid link. Please check the token or user information!
      </Callout>
    )}
    </div>
  );
}

export default withServices(ChatTab, ['recordingService']);
