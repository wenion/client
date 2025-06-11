import {
  Button,
  CardActions,
  Input,
  RadioGroup,
  Select,
} from '@hypothesis/frontend-shared';
import { useCallback, useEffect, useId, useMemo, useState } from 'preact/hooks';

import { downloadFile } from '../../../shared/download-file';
import { formatDate } from '../../helpers/export-annotations';
import { withServices } from '../../service-context';
import type { RecordingService } from '../../services/recording';
import type { ToastMessengerService } from '../../services/toast-messenger';
import { useSidebarStore } from '../../store';
import type { RecordItem } from '../../../types/api';
import { truncate } from '../../util/unicode';

export type ExportShareflowProps = {
  // injected
  recordingService: RecordingService;
  toastMessenger: ToastMessengerService;
};

type ExportFormat = {
  /** Unique format identifier used also as file extension */
  value: 'json' | 'csv' | 'txt' | 'html';
  /** The title to be displayed in the listbox item */
  title: string;

  /**
   * The title to be displayed in the Select button.
   * Falls back to `title` when not provided.
   */
  shortTitle?: string;

  description: string;
};

const exportFormats: ExportFormat[] = [
  {
    value: 'json',
    title: 'JSON',
    description: 'For import into segmentation shareflow',
  },
  // {
  //   value: 'txt',
  //   title: 'Plain text (TXT)',
  //   shortTitle: 'Text',
  //   description: 'For import into word processors as plain text',
  // },
  // {
  //   value: 'html',
  //   title: 'Rich text (HTML)',
  //   shortTitle: 'HTML',
  //   description: 'For import into word processors as rich text',
  // },
  // {
  //   value: 'csv',
  //   title: 'Table (CSV)',
  //   shortTitle: 'CSV',
  //   description: 'For import into a spreadsheet',
  // },
];

function formatToMimeType(format: ExportFormat['value']): string {
  const typeForFormat: Record<ExportFormat['value'], string> = {
    json: 'application/json',
    txt: 'text/plain',
    csv: 'text/csv',
    html: 'text/html',
  };
  return typeForFormat[format];
}

/**
 * Render content for "export" tab panel: allow user to export annotations
 * with a specified filename.
 */
function ExportShareflow({
  recordingService,
  toastMessenger,
}: ExportShareflowProps) {
  const store = useSidebarStore();

  const focusedRecordItemId = store.focusedRecordItemId();
  const recordSteps = store.recordSteps();
  const [recordItem, setRecordItem] = useState<RecordItem | null>(null);

  useEffect(()=> {
    if (focusedRecordItemId) {
      const recordItem = store.getRecordItemById(focusedRecordItemId);
      setRecordItem(recordItem);
      recordingService.getTracesById(focusedRecordItemId);
    } else {
      setRecordItem(null);
    }
  }, [focusedRecordItemId]);

  const [imageIncludes, setImageIncludes] = useState<'with' | 'without'>('with');
  const [exportFormat, setExportFormat] = useState(exportFormats[0]);

  const fileInputId = useId();
  const userSelectId = useId();

  const defaultFilename = useMemo(
    () =>{
      const filenameSegments = [formatDate(new Date())];
      if (recordItem) {
        filenameSegments.push(truncate(recordItem.taskName, 50));
        filenameSegments.push('v');
      }
      return filenameSegments.join('-');
    },
    [recordItem],
  );
  const [customFilename, setCustomFilename] = useState<string>();

  async function getImageBase64(url: string) {
    const response = await fetch(url);
    const blob = await response.blob();
  
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result); // Base64 string (with data URL prefix)
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob); // Converts blob to Base64 string
    });
  }

  const buildExportJson =  useCallback(
    async (format: ExportFormat['value'], context: 'file' | 'clipboard'): Promise<string> => {
      const dataToExport = recordSteps;
      switch (format) {
        case 'json': {
          const data = await Promise.all(
            dataToExport.map(async (item) => {
              if (imageIncludes === 'without') {
                return item;
              }
              else {
                if (item.image) {
                  const base64 = await getImageBase64(item.image);
                  return {
                    ...item,
                    image_data: base64,
                  };
                } else {
                  return {
                    ...item,
                    image_data: null,
                  };
                }
              }
            })
          );

          return JSON.stringify({
            version: recordItem?.version??null,
            name: recordItem?.taskName??null,
            description: recordItem?.description??null,
            data: data
          }, null, 2);
        }
        /* istanbul ignore next - This should never happen */
        default:
          throw new Error(`Invalid format: ${format}`);
      }
    },
    [
      focusedRecordItemId,
      imageIncludes,
      recordSteps,
    ],
  );

  const exportShareflow = useCallback(
    async (e: Event) => {
      e.preventDefault();

      try {
        const format = exportFormat.value;
        const filename = `${customFilename ?? defaultFilename}.${format}`;
        const exportData = await buildExportJson(format, 'file');
        const mimeType = formatToMimeType(format);

        downloadFile(exportData, mimeType, filename);
      } catch (e) {
        toastMessenger.error(`Exporting shareflow failed: ${e.message}`, {
          autoDismiss: false,
        });
      }
    },
    [
      buildExportJson,
      customFilename,
      defaultFilename,
      exportFormat.value,
      imageIncludes,
      toastMessenger,
    ],
  );

  return (
    <form
      className="space-y-3"
      onSubmit={exportShareflow}
      data-testid="export-form"
    >
      {recordItem ? (
        <>
          <p className="text-color-text-light">
            version: {recordItem.version}
          </p>
          <div className="flex flex-col gap-y-3">
            <label htmlFor={userSelectId} className="font-medium">
              Select information to export:
            </label>
            <RadioGroup aria-label="Items" selected={imageIncludes} onChange={setImageIncludes}>
              <RadioGroup.Radio value="with">
                With Image(base64)
              </RadioGroup.Radio>
              <RadioGroup.Radio value="without">
                Without Image
              </RadioGroup.Radio>
            </RadioGroup>
            <label
              data-testid="export-count"
              htmlFor={fileInputId}
              className="font-medium"
            >
              Name of export file:
            </label>
            <div className="flex">
              <Input
                classes="grow"
                data-testid="export-filename"
                id={fileInputId}
                defaultValue={defaultFilename}
                value={customFilename}
                onChange={(e : Event) =>
                  setCustomFilename((e.target as HTMLInputElement).value)
                }
                required
                maxLength={250}
              />
              <div className="grow-0 ml-2 min-w-[5rem]">
                <Select
                  aria-label="Export format"
                  value={exportFormat}
                  onChange={setExportFormat}
                  buttonContent={exportFormat.shortTitle ?? exportFormat.title}
                  data-testid="export-format-select"
                  alignListbox="right"
                  listboxOverflow="wrap"
                >
                  {exportFormats.map(exportFormat => (
                    <Select.Option
                      key={exportFormat.value}
                      value={exportFormat}
                    >
                      <div className="flex-col gap-y-2">
                        <div className="font-bold" data-testid="format-name">
                          {exportFormat.title}
                        </div>
                        <div data-testid="format-description">
                          {exportFormat.description}
                        </div>
                      </div>
                    </Select.Option>
                  ))}
                </Select>
              </div>
            </div>
          </div>
        </>
      ) : (
        <p data-testid="no-annotations-message">
          There is no shareflow available for export.
        </p>
      )}
      <CardActions>
        <Button
          data-testid="export-button"
          variant="primary"
          disabled={recordItem === null}
          type="submit"
        >
          Export
        </Button>
      </CardActions>
    </form>
  );
}

export default withServices(ExportShareflow, [
  'annotationsExporter',
  'recordingService',
  'toastMessenger',
]);
