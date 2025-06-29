import { useEffect, useState, useRef} from 'preact/hooks';
import { Button, CancelIcon } from '@hypothesis/frontend-shared';

import type { RecordingService } from '../../sidebar/services/recording';
import type { RecordStep } from '../../types/api';
import { useSidebarStore } from '../../sidebar/store';
import { withServices } from '../../sidebar/service-context';

type ImageEditorProps = {
  trace: RecordStep;
  recordingService: RecordingService;
  onSave: (id: string) => void;
  onCancel: (id: string) => void;
};

function ImageEditor({
  trace,
  recordingService,
  onSave: onSave,
  onCancel: onCancel,
}: ImageEditorProps) {
  const store = useSidebarStore();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasRef2 = useRef<HTMLCanvasElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);

  const [changed, setChanged] = useState(false);

  const drawImageToCanvas = (trace: RecordStep) => {
    const canvas = canvasRef.current;
    if (!canvas || !trace.image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const canvas2 = canvasRef2.current;
    if (!canvas2 || !trace.image) return;

    const ctx2 = canvas2.getContext('2d');
    if (!ctx2) return;

    const image = new Image();
    image.crossOrigin = "anonymous"; // must be set before setting src
    image.onload = () => {
      const ratio = image.naturalWidth / image.naturalHeight;
      const canvasWidth = window.screen.width * 0.8;
      const canvasHeight = canvasWidth / ratio;

      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      ctx.drawImage(
        image,
        0, 0, image.naturalWidth, image.naturalHeight,
        0, 0, canvasWidth, canvasHeight
      );

      canvas2.width = canvasWidth;
      canvas2.height = canvasHeight;

      ctx2.drawImage(
        image,
        0, 0, image.naturalWidth, image.naturalHeight,
        0, 0, canvasWidth, canvasHeight
      );
    };

    image.src = trace.image!;
  }

  useEffect(() => {
    drawImageToCanvas(trace);
  }, []);

  const applyBlur = (
    x: number,
    y: number,
    w: number,
    h: number
  ) => {
    const canvas = canvasRef2.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let region = ctx.getImageData(x, y, w, h);
    let data = region.data;

    // Simple blur algorithm: average neighbors
    for (let i = 0; i < data.length; i += 4) {
      let r = 0, g = 0, b = 0, count = 0;
      for (let dx = -7; dx <= 7; dx++) {
        for (let dy = -7; dy <= 7; dy++) {
          let nx = (i / 4) % w + dx;
          let ny = Math.floor((i / 4) / w) + dy;
          if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
            let ni = (ny * w + nx) * 4;
            r += data[ni];
            g += data[ni + 1];
            b += data[ni + 2];
            count++;
          }
        }
      }
      data[i] = r / count;
      data[i + 1] = g / count;
      data[i + 2] = b / count;
    }

    // Put the blurred data back
    ctx.putImageData(region, x, y);
  }

  const onMouseDown = (e: MouseEvent) => {
    setStartX(e.offsetX);
    setStartY(e.offsetY);
    setIsDragging(true);
  };

  const onMouseMove = (e: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!isDragging) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const width = e.offsetX - startX;
    const height = e.offsetY - startY;

    ctx.fillStyle = "lightgrey";
    ctx.strokeStyle = "grey";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]); // 5px dash, 5px gap
    ctx.strokeRect(startX, startY, width, height);
  };

  const onMouseUp = (e: MouseEvent) => {
    if (!isDragging) {
      return;
    }
    setIsDragging(false);
   
    applyBlur(
      Math.min(startX, e.offsetX), Math.min(startY, e.offsetY),
      Math.abs(e.offsetX - startX), Math.abs(e.offsetY - startY)
    );
    setChanged(true);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const onMouseLeave = (e: MouseEvent) => {
    setIsDragging(false);
  };

  const undo = () => {
    drawImageToCanvas(trace);
    setChanged(false);
  };

  const save = async () => {
    const canvas = canvasRef2.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const data = canvas.toDataURL("image/jpeg", 1);
    setChanged(false);

    if (trace.image) {
      let url = trace.image;
      let match = url.match(/\/(\d+)\.jpg$/);
      let id = match ? match[1] : null;

      if (id) {
        await recordingService.updateImage(id, data);
        store.updateRecordStep(trace);
        onSave(id);
        window.location.reload();
      }
    }
  };

  const cancel = () => {
    if (trace) {
      onCancel(trace.id);
    }
  };

  return (
    <div class="flex flex-col w-4/5 h-5/6">
      <div>
        <div
          class="relative"
        >
          <canvas
            ref={canvasRef}
            id="canvas"
            class="absolute z-10"
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
          />
          <canvas
            ref={canvasRef2}
            class="absolute z-0"
            // onMouseDown={onMouseDown}
            // onMouseUp={onMouseUp}
            // onMouseMove={onMouseMove}
          />
        </div>
      </div>
      <div class='fixed flex mt-8 z-20 right-2 top-2'>
        {changed && (
          <>
            <Button
              data-testid="cancel-button"
              classes='mx-2'
              onClick={() => undo()}
            >
              Undo
            </Button>
            <Button
              data-testid="confirm-button"
              classes='mx-2'
              onClick={() => save()}
            >
              Save
            </Button>
          </>
        )}
        <Button
          data-testid="confirm-button"
          classes='mx-2'
          onClick={() => cancel()}
        >
          <CancelIcon />
        </Button>
      </div>
    </div>
  )
};

export default withServices(ImageEditor, [
  'recordingService',
]);