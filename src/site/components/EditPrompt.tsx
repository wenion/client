import { Button, Input, Textarea, ModalDialog, Select } from '@hypothesis/frontend-shared';
import { render } from 'preact';
import { createRef } from 'preact';
import type { RefObject } from 'preact';

import type { RecordStep } from '../../types/api';

type EditPromptProps = {
  title?: string;
  trace: RecordStep;
  confirmAction?: string;
};

export async function EditPrompt({
  title = 'Confirm',
  trace,
  confirmAction = 'Yes',
}: EditPromptProps): Promise<{
  result: boolean,
  title: string,
  description: string,
  url: string,
  type: string,
}> {
  const cancelButton = createRef<HTMLElement | undefined>();
  const container = document.createElement('div');
  container.setAttribute('data-testid', 'confirm-container');

  // Ensure dialog appears above any existing content. The Z-index value here
  // is Good Enough™ for current usage.
  container.style.position = 'relative';
  container.style.zIndex = '10';

  document.body.appendChild(container);

  const titleEl = createRef<HTMLSelectElement>();
  const descriptionEl = createRef<HTMLTextAreaElement>();
  const urlEl = createRef<HTMLInputElement>();

  const items = [
    { id: '1', name: 'Click', value: 'click', type: 'pointerdown' },
    { id: '2', name: 'Copy', value: 'copy', type: 'copy' },
    { id: '3', name: 'Create highlight', value: 'create highlight', type: 'annotation' },
    { id: '4', name: 'Delete highlight', value: 'delete highlight', type: 'annotation' },
    { id: '5', name: 'Navigate to', value: 'Navigate to', type: '' },
    { id: '6', name: 'Paste', value: 'paste', type: 'paste' },
    { id: '7', name: 'Scroll', value: 'scroll', type: 'scroll' },
    { id: '8', name: 'Select', value: 'select', type: 'mouseup' },
    { id: '9', name: 'Submit', value: 'submit', type: 'submit' },
    { id: '10', name: 'Switch to', value: 'Switch to', type: 'getfocus' },
    { id: '11', name: 'Type', value: 'type', type: 'change' },
  ];

  return new Promise(resolve => {
    const close = (result: boolean, title: string) => {
      const description = descriptionEl.current!.value;
      const url = urlEl.current!.value;

      render(null, container);
      container.remove();
      const type = items.find(item => item.value === title)?.type?? ''

      resolve({
        result: result,
        title: title,
        description: description,
        url: url,
        type: type,
      });
    };

    const renderModal = (
      title: string,
      description: string,
      url: string,
    ) => render(
      <ModalDialog
        buttons={
          <>
            <Button
              elementRef={cancelButton}
              data-testid="cancel-button"
              onClick={() => close(false, title)}
            >
              Cancel
            </Button>
            <Button
              data-testid="confirm-button"
              variant="primary"
              onClick={() => close(true, title)}
            >
              {confirmAction}
            </Button>
          </>
        }
        initialFocus={cancelButton as RefObject<HTMLElement>}
        title={title}
        onClose={() => close(false, title)}
      >
        <div className='justify-between items-center p-2'>
          <label htmlFor='select-title' className='font-semibold'>
            Type of action
          </label>
          {/* <div className="m-2">
            <Input
              elementRef={titleEl}
              id="select-title"
              aria-label="Select the type of action"
              defaultValue={trace.title}
            />
          </div> */}
          <Select
            elementRef={titleEl}
            // value={title}
            value={items.find(item => item.value === title)!}
            // onChange={(newValue) => {
            //   titleEl.current!.value = newValue;
            //   renderModal(newValue, descriptionEl.current!.value, urlEl.current!.value);
            // }}
            onChange={(item: { id: string, name: string, value: string, type: string }) => {
              titleEl.current!.value = item.value;
              renderModal(item.value, descriptionEl.current!.value, urlEl.current!.value);
            }}
            buttonId="select-title"
            buttonContent={items.find(item => item.value === title)?.name || 'Select an action'}
          >
            {items.map(item => (
              <Select.Option key={item.id} value={item}>
                {item.name}
              </Select.Option>
            ))}
          </Select>
        </div>

        <div className='justify-between items-center p-2'>
          <label htmlFor='textarea-description' className='min-w-28 font-semibold'>
            Description
          </label>
          <div className="m-2">
            <Textarea
              elementRef={descriptionEl}
              id="textarea-description"
              aria-label="Type the description"
              value={description}
              rows={8}
            />
          </div>
        </div>

        <div className='justify-between items-center p-2'>
          <label htmlFor='input-url' className='min-w-28 font-semibold'>
            URL
          </label>
          <div className="m-2">
            <Input
              elementRef={urlEl}
              id="input-url"
              aria-label="Enter the url"
              defaultValue={url}
            />
          </div>
        </div>
      </ModalDialog>,
      container,
    )

    renderModal(trace.title, trace.description, trace.url);
  });
}
