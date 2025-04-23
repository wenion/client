import classnames from 'classnames';

import PowerIcon from '../../images/icons/power'
import LogoIcon from '../../images/icons/logo'

export type ControlBarrProps = {
  isVisible: boolean;
  onToggleHide: (value: string) => void;
  onHome: () => void;
};

/**
 * Render controls to change highlight-cluster styling.
 */
export default function ControlBar({
  isVisible,
  onToggleHide,
  onHome,
}: ControlBarrProps) {
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
        onClick={() => onHome()}
      >
        <LogoIcon />
      </div>
    </div>
  );
}
