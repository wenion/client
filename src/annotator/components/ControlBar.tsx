import classnames from 'classnames';
import { useState } from 'preact/hooks';

import Menu from './Menu';
import MenuItem from './MenuItem';

import PowerIcon from '../../images/icons/power'
import LogoIcon from '../../images/icons/logo'

export type ControlBarrProps = {
  isVisible: boolean;
  onToggleHide: (value: string) => void;
  onHome: (option: string) => void;
};

/**
 * Render controls to change highlight-cluster styling.
 */
export default function ControlBar({
  isVisible,
  onToggleHide,
  onHome,
}: ControlBarrProps) {
  const [position, setPosition] = useState({ x: 0, y: 0});

  const [isOpen, setOpen] = useState(false);

  return (
    <div
      className={classnames(
        'fixed',
        'flex',
        'bg-slate-50 bg-blend-lighten',
        'border rounded-3xl',
        'p-1',
        'shadow-lg cursor-move',
      )}
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
        id="Goldmind Icon"
        class={classnames(
          'm-2',
          'w-4 h-4',
          'content-center',
          'cursor-pointer',
        )}
        title="Goldmind Icon"
        onContextMenu={(event: MouseEvent) => {
          event.preventDefault();
          setPosition({ x: event.clientX, y: event.clientY});
          setOpen(true);
        }}
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
