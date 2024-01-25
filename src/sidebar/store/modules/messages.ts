/**
 * State management for the set of annotations currently loaded into the
 * sidebar.
 */
import type { Dispatch } from 'redux';
import { createSelector } from 'reselect';

import { createStoreModule, makeAction } from '../create-store';
import type { State as RouteState } from './route';
import type { State as SessionState } from './session';
import type { RawMessageData } from '../../../types/api'

const initialState = {
  messages: [],
  unreadMessages: [],
} as {
  /** Set of currently-loaded annotations */
  messages: RawMessageData[];
  unreadMessages: RawMessageData[];
};

export type State = typeof initialState;

function findByID(annotations: RawMessageData[], id: string) {
  return annotations.find(a => a.id === id);
}

/**
 * Merge client annotation data into the annotation object about to be added to
 * the store's collection of `annotations`.
 *
 * `annotation` may either be new (unsaved) or a persisted annotation retrieved
 * from the service.
 *
 * @param tag - The `$tag` value that should be used for this if it doesn't have
 * a `$tag` already
 * @return - API annotation data with client annotation data merged
 */
// function initializeMessage(
//   message: Omit<Message, '$anchorTimeout'>,
// ): Message {

//   return Object.assign({}, message, {
//     date: 
//   });
// }

const reducers = {
  ADD_MESSAGES(state: State, action: { messages: RawMessageData[] }): Partial<State> {
    const added = [];
    for (const msg of action.messages) {
      let existing;
      if (msg.id) {
        existing = findByID(added, msg.id)
      }
      if (!existing) {
        added.push(msg)
      }
    }
    return {
      unreadMessages: added,
    };
  },

  REMOVE_FROM_UNREAD_MESSAGE(state: State) {
    const added = [];
    for (const msg of state.unreadMessages) {
      msg.unread_flag = false;
      let existing;
      if (msg.id) {
        existing = findByID(state.messages, msg.id)
      }
      if (!existing && msg.need_save_flag) {
        added.push(msg)
      }
    }
    return {
      messages: state.messages.concat(added),
      unreadMessage: [],
    };
  },

  CLEAR_MESSAGES(): Partial<State> {
    return { messages: [], unreadMessages: []};
  },
};

/* Action creators */

/**
 * Add these `annotations` to the current collection of annotations in the
 * store.
 */
function addMessages(messages: RawMessageData[]) {
  return makeAction(reducers, 'ADD_MESSAGES', { messages });
}

function removeFromUnreadMessage() {
  return makeAction(reducers, 'REMOVE_FROM_UNREAD_MESSAGE', undefined);
}

/** Set the currently displayed messages to the empty set. */
function clearMessages() {
  return makeAction(reducers, 'CLEAR_MESSAGES', undefined);
}

/* Selectors */

/**
 * Count the number of messages (as opposed to notes or orphans)
 */
function unreadMessageCount(state: State) {
  return state.unreadMessages.length;
}

function allMessageCount(state: State) {
  return state.messages.length;
}

function allMessages(state: State) {
  return state.messages;
}

function unreadMessages(state: State) {
  return state.unreadMessages;
}

function findMessagesByPubid(state: State, id: string) {
  return findByID(state.messages, id);
}

export const messagesModule = createStoreModule(initialState, {
  namespace: 'messagess',
  reducers,
  actionCreators: {
    addMessages,
    removeFromUnreadMessage,
    clearMessages,
  },
  selectors: {
    allMessages,
    unreadMessages,
    unreadMessageCount,
    allMessageCount,
    findMessagesByPubid,
  },
});
