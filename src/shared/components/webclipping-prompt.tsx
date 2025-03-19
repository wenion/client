import { Button, Textarea, ModalDialog, Select } from '@hypothesis/frontend-shared';
import { render } from 'preact';
import { createRef } from 'preact';
import type { RefObject } from 'preact';

export type ConfirmModalProps = {
  title?: string;
  message: {
    name: string;
    access: string;
  };
  confirmAction?: string;
  rowOfTextArea?: number;
};

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
export async function webClippingPrompt({
  title = 'New Webpage',
  message,
  confirmAction = 'Yes',
  rowOfTextArea = 3,
}: ConfirmModalProps): Promise<{
  result: boolean,
  name: string,
  access: string,
}> {
  const cancelButton = createRef<HTMLElement | undefined>();

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
  
  const nameEl = createRef<HTMLTextAreaElement>();
  const accessEl = createRef<HTMLSelectElement>();

  const items = [
    { id: '1', name: 'Private', value: 'private' },
    { id: '2', name: 'Public', value: 'public' },
  ];

  return new Promise(resolve => {
    const close = (result: boolean, access: string) => {
      const name = nameEl.current!.value;

      render(null, container);
      container.remove();
      resolve({
        result: result,
        name: name,
        access: access,
      });
    };

    const renderModal = (
      name: string,
      access: string,
    ) => render(
      <ModalDialog
        buttons={
          <>
            <Button
              elementRef={cancelButton}
              data-testid="cancel-button"
              onClick={() => close(false, access)}
            >
              Cancel
            </Button>
            <Button
              data-testid="confirm-button"
              variant="primary"
              onClick={() => close(true, access)}
            >
              {confirmAction}
            </Button>
          </>
        }
        initialFocus={cancelButton as RefObject<HTMLElement>}
        title={title}
        onClose={() => close(false, access)}
      >
        <div className='flex justify-between items-center px-1'>
          <label htmlFor='textarea-name' className='font-semibold'>
            Page Title
          </label>
          <div className="sm:w-56 lg:w-96">
            <Textarea
              elementRef={nameEl}
              id="textarea-name"
              aria-label="Type the title"
              value={name}
              rows={rowOfTextArea}
            />
          </div>
        </div>

        <div className='flex justify-between items-center px-1'>
          <label htmlFor='select-access' className='font-semibold'>
            Access Control
          </label>
          <div className="sm:w-56 lg:w-96">
            <Select
              elementRef={accessEl}
              value={access}
              onChange={(newValue) => {
                accessEl.current!.value = newValue;
                renderModal(nameEl.current!.value, newValue);
              }}
              buttonId="select-access"
              buttonContent={items.find(item => item.value === access)?.name || 'Select an action'}
            >
              {items.map(item => (
                <Select.Option key={item.id} value={item.value}>
                  {item.name}
                </Select.Option>
              ))}
            </Select>
          </div>
        </div>
      </ModalDialog>,
      container,
    );
    renderModal(message.name, message.access);
  });
}
