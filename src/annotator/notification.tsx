import { createRef, render } from 'preact';
import type { RefObject } from 'preact';

import { isTouchDevice } from '../shared/user-agent';
import type { Destroyable, PullingData } from '../types/annotator';
// import AdderToolbar from './components/AdderToolbar';
import  Notification from './components/Notifications';

export enum ArrowDirection {
  DOWN = 1,
  UP = 2,
}

type Target = {
  /** Offset from left edge of viewport */
  left: number;
  /** Offset from top edge of viewport */
  top: number;
  /** Direction of the adder's arrow */
  arrowDirection: ArrowDirection;
};

export type ToolbarOptions = {
  onClose: (data: PullingData) => void;
};

export type NotificationElement = {
  // element: RefObject<HTMLDivElement>;
  data: PullingData;
  isLatest: boolean;
};

export class NotificationController implements Destroyable {
  private _notificationContainer: HTMLDivElement;
  private _data: PullingData;
  private _onClose: (data: PullingData) => void;

  constructor(container: HTMLElement, options: ToolbarOptions) {
    this._notificationContainer = document.createElement('div');
    container.appendChild(this._notificationContainer);

    const { onClose } = options;
    this._data = {id: "", title: "", context: "", timeliness: "", relevance: "", timestamp: 0, base_url: ""};
    this._onClose = onClose;
  }

  destroy() {
    render(null, this._notificationContainer);
    this._notificationContainer.remove();
  }

  addMessage(newMessage: PullingData, ) {
    if (newMessage.id === '') {
      return;
    }

    this._data = newMessage;
    this._render();
  }

  onChange() {
    this._render();
  }

  private _render() {
    const onClose = () => {
      this._onClose(this._data);
      render(null, this._notificationContainer);
    }

    const onChange = (ratingType: string, value: string) => {
      if (ratingType === "relevant") {
        this._data.relevance = value;
      }
      else if (ratingType === "timeliness") {
        this._data.timeliness = value;
      }
      this.onChange();
    }

    render(
      <Notification
        notification={this._data}
        onClose={onClose}
        onChange={onChange}
      />,
      this._notificationContainer
    );
  }
}

