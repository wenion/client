import { Button, Input, ModalDialog } from '@hypothesis/frontend-shared';
import { render } from 'preact';
import { createRef } from 'preact';
import type { RefObject } from 'preact';
import { generateRandomString } from './random';

export type ConfirmModalProps = {
  title?: string;
  message: {
    init: boolean;
    name: string;
    description: string;
    startTime: number;
  };
  confirmAction?: string;
};

function generateSessionId() {
  return 'se' + Date.now().toString(36) + generateRandomString(5);
}

/**
 * Show the user a prompt asking them to confirm an action.
 *
 * This is like an async version of `window.confirm` except that:
 *
 *  - It can be used inside iframes (browsers are starting to prevent this for
 *    the native `window.confirm` dialog)
 *  - The visual style of the dialog matches the Hypothesis design system
 *
 * @return - Promise that resolves with `true` if the user confirmed the action
 *   or `false` if they canceled it.
 */
export async function recordingPrompt({
  title = 'New ShareFlow',
  message,
  confirmAction = 'Create',
}: ConfirmModalProps): Promise<{
  result: boolean,
  taskName: string,
  description: string,
  startTime: string,
  sessionId: string,
}> {
  const cancelButton = createRef<HTMLElement | undefined>();
  const nameEl = createRef<HTMLInputElement>();
  const descriptionEl = createRef<HTMLInputElement>();
  const timeEl = createRef<HTMLInputElement>();

  let errorName =
    message.init ? false : message.name.trim() === '' ? true : false;
  let errorDescription =
    message.init ? false : message.description.trim() === '' ? true : false;
  let errorTime = 
    message.init ? false : message.startTime > 0 ? true : false;

  let container = document.querySelector("div[data-testid='confirm-container']") as HTMLDivElement;
  if (!container) {
    container = document.createElement('div');
    container.setAttribute('data-testid', 'confirm-container');
  
    // Ensure dialog appears above any existing content. The Z-index value here
    // is Good Enough™ for current usage.
    container.style.position = 'relative';
    container.style.zIndex = '10';
  
    document.body.appendChild(container);
  }

  return new Promise(resolve => {
    const close = (result: boolean) => {
      const name = nameEl.current?.value?? '';
      const description = descriptionEl.current?.value?? '';
      const startTime = timeEl.current?.value?? '';

      render(null, container);
      container.remove();
      resolve({
        result: result,
        taskName : name,
        description : description,
        startTime: startTime,
        sessionId: generateSessionId(),
      });
    };

    render(
      <ModalDialog
        buttons={
          <>
            <Button
              elementRef={cancelButton}
              data-testid="cancel-button"
              onClick={() => close(false)}
            >
              Cancel
            </Button>
            <Button
              data-testid="confirm-button"
              variant="primary"
              onClick={() => close(true)}
            >
              {confirmAction}
            </Button>
          </>
        }
        initialFocus={cancelButton as RefObject<HTMLElement>}
        title={title}
        onClose={() => close(false)}
      >
        <div className='flex justify-between items-center px-1'>
          <label htmlFor='input-with-label' className='min-w-28 font-semibold'>
            Task name
          </label>
          <div className="min-w-64">
            <Input
              elementRef={nameEl}
              aria-label="Enter the task name"
              feedback={errorName ? "error": undefined}
              defaultValue={message.name}
            />
          </div>
        </div>
        <div className='flex justify-between items-center px-1'>
          <label htmlFor='input-with-label' className='min-w-28 font-semibold'>
            Description
          </label>
          <div className="min-w-64">
            <Input
              elementRef={descriptionEl}
              aria-label="Enter the description"
              feedback={errorDescription ? "error": undefined}
              defaultValue={message.description}
            />
          </div>
        </div>
        <div className='flex justify-between items-center px-1'>
          <label htmlFor='input-with-label' className='min-w-28 font-semibold'>
            Backdate time (secs)
          </label>
          <div className="min-w-64">
            <Input
              elementRef={timeEl}
              aria-label="Enter the start time in seconds"
              feedback={errorTime ? "error": undefined}
              defaultValue={message.startTime.toString()}
              placeholder={'Maximum value allowed is: -1800'}
            />
          </div>
        </div>
      </ModalDialog>,
      container,
    );
  });
}
