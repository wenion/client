import classnames from 'classnames';
import { useState } from 'preact/hooks';
import { FilePdfIcon, FilePdfFilledIcon } from '@hypothesis/frontend-shared';

import Menu from './Menu';
import MenuItem from './MenuItem';

import PowerIcon from '../../images/icons/power'
import LogoIcon from '../../images/icons/logo'

export type ControlBarrProps = {
  isVisible: boolean;
  isPdfMode: boolean;
  onToggleHide: (value: string) => void;
  onTogglePdf: (value: boolean) => void;
  onHome: (option: string) => void;
};

/**
 * Render controls to change highlight-cluster styling.
 */
export default function ControlBar({
  isVisible,
  isPdfMode,
  onToggleHide,
  onTogglePdf,
  onHome,
}: ControlBarrProps) {
  const [position, setPosition] = useState({ x: 0, y: 0});

  const [isOpen, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={classnames(
        'fixed',
        'flex items-center',
        'bg-slate-50 bg-blend-lighten',
        'border rounded-3xl',
        'p-1',
        'shadow-lg cursor-move',
        'transition-all duration-500 ease-in-out',
      )}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <div
        id="hideToggle"
        class={classnames(
          'm-2',
          'w-4 h-4',
          'content-center',
          'cursor-pointer',
          'bg-green-700',
          'rounded-full',
          {'grayscale' : !isVisible},
        )}
        title={isVisible? 'Hide Goldmind': 'Show Goldmind'}
        onClick={() => onToggleHide(isVisible ? 'off' : 'on')}
      >
        <PowerIcon/>
      </div>
        <div
          id="pdfToggle"
          class={classnames(
            'transform scale-0',
            {'m-2 w-4 h-4 scale-100' : expanded},
            'content-center',
            'cursor-pointer',
            'transition-all duration-300 ease-in-out',
            {'grayscale' : !isPdfMode},
          )}
          title={isPdfMode? 'You are using the Goldmind Viewer': 'You are using the Normal Viewer'}
          onClick={() => onTogglePdf(!isPdfMode)}
        >
          {expanded ? (isPdfMode ? <FilePdfFilledIcon /> : <FilePdfIcon />) : <></>}
        </div>
      <div
        id="Goldmind Icon"
        class={classnames(
          'm-2',
          'w-4 h-4',
          'content-center',
          'cursor-pointer',
        )}
        title="Goldmind Icon"
        // onContextMenu={(event: MouseEvent) => {
        //   event.preventDefault();
        //   setPosition({ x: event.clientX, y: event.clientY});
        //   setOpen(true);
        // }}
      >
        <Menu
          label={<></>}
          title={"Settings"}
          align={position.x + 100 > window.innerWidth ? "right" : "left" }
          open={isOpen}
          onOpenChanged={setOpen}
        >
          <MenuItem
            label={"Disable PDF View"}
            onClick={() => onHome("disablePDF")}
          />
          <MenuItem
            label={"Enable PDF View"}
            onClick={() => onHome("enablePDF")}
          />
        </Menu>
        <LogoIcon />
      </div>
    </div>
  );
}
