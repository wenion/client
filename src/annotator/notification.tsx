import { createRef, render } from 'preact';
import type { RefObject } from 'preact';

import { isTouchDevice } from '../shared/user-agent';
import type { Destroyable } from '../types/annotator';
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

export type Data = {
  id: string;
  title: string;
  context: string;
};

export type NotificationElement = {
  element: RefObject<HTMLDivElement>;
  data: Data;
  isLatest: boolean;
};

export class NotificationController {
  private _notificationContainer: HTMLDivElement;
  currentMessageList: NotificationElement[];

  constructor(container: HTMLElement) {
    this._notificationContainer = document.createElement('div');
    container.appendChild(this._notificationContainer);
    this.currentMessageList = []; // this._notificationList = createRef<HTMLDivElement>();
  }

  onClose(element: NotificationElement) {
    console.log('close', element);
    element.element.current?.remove();
    element.element.current = null;
  }

  destroy() {
    render(null, this._notificationContainer);
    this._notificationContainer.remove();
  }

  addMessage(newMessage: Data) {
    this.currentMessageList.map(child => {
      child.isLatest = false;
    })

    const el = createRef<HTMLDivElement>();
    this.currentMessageList.push({data: newMessage, element: el, isLatest: true});
    const first = this.currentMessageList.shift();
    if (first) {
      this.render(first, this.onClose);
    }
  }

  render(notification: NotificationElement, onClose: (element: NotificationElement) => void) {
    render(
      <Notification notification={notification} onClose={this.onClose}/>,
      this._notificationContainer
    );
  }
}

