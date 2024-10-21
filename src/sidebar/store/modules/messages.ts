/**
 * State management for the set of annotations currently loaded into the
 * sidebar.
 */
import { createStoreModule, makeAction } from '../create-store';
import type { RawMessageData, MessagePanelName } from '../../../types/api'

const initialState = {
  activated: true,
  interval: 20000,
  expandedMessagePanels: ['organization', ],
  messages: [],
  unreadMessages: [],
} as {
  /** Set of currently-loaded annotations */
  activated: boolean;
  interval: number;
  expandedMessagePanels: MessagePanelName[];
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
      unreadMessages: state.unreadMessages.concat(added),
    };
  },

  REMOVE_FROM_UNREAD_MESSAGE(state: State, action: {needToRemove: RawMessageData[] }) {
    const added = []
    for (let msg of action.needToRemove) {
      msg.unread_flag = false;
      let existing;
      if (msg.id) existing = findByID(state.messages, msg.id)
      if (!existing && msg.need_save_flag) added.push(msg)
    }
    return {
      messages: state.messages.concat(added),
      unreadMessages: state.unreadMessages.filter(item => !action.needToRemove.includes(item))
    };
  },

  REMOVE_OVERTIME_MESSAGES(state: State) {
    const instanceMessages = state.messages.filter(m => {
      return m.type === 'instant_message' &&
      ( new Date().getTime() - new Date(m.date/1000).getTime()) < (10 * 60 *1000); // 10 mins
    })
    const organisationEventMessages = state.messages.filter(m => m.type === 'organisation_event')
    const remain = state.messages.filter(m => m.type !== 'organisation_event' && m.type !== 'instant_message')

    return {
      messages: instanceMessages.concat([...organisationEventMessages, ...remain]),
    }
  },

  CLEAR_MESSAGES(): Partial<State> {
    return { messages: [], unreadMessages: []};
  },

  CHANGE_PANEL(state: State, action: { panel: MessagePanelName }) {
    const include = state.expandedMessagePanels.includes(action.panel)

    return include ? {
      expandedMessagePanels: state.expandedMessagePanels.filter((panel => panel !== action.panel))
    } : {
      expandedMessagePanels : [...state.expandedMessagePanels, action.panel]
    }
  },

  SET_INTERVAL(state: State, action: {value: number | null}): Partial<State> {
    return { interval: action.value == null? 30000 : action.value};
  },

  SET_ACTIVATED(state: State, action: {value: boolean}): Partial<State> {
    return { activated: action.value};
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

function removeFromUnreadMessage(needToRemove: RawMessageData[]) {
  return makeAction(reducers, 'REMOVE_FROM_UNREAD_MESSAGE', { needToRemove });
}

/** Set the currently displayed messages to the empty set. */
function clearMessages() {
  return makeAction(reducers, 'CLEAR_MESSAGES', undefined);
}

function removeOverTimeMessage() {
  return makeAction(reducers, 'REMOVE_OVERTIME_MESSAGES', undefined);
}

function setInterval(value: number | null) {
  return makeAction(reducers, 'SET_INTERVAL', { value });
}

function setActivated(value: boolean) {
  return makeAction(reducers, 'SET_ACTIVATED', { value });
}

function toggleMessagePanelExpansion(panel: MessagePanelName) {
  return makeAction(reducers, 'CHANGE_PANEL', { panel });
}

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

function allOrganisationEventMessages(state: State) {
  return state.messages.filter(m => m.type === 'organisation_event')
}

function allInstanceMessages(state: State) {
  return state.messages.filter(m => m.type === 'instant_message')
}

function allAdditionalMessages(state: State) {
  return state.messages.filter(m => m.type === 'additional_knoledge')
}

function unreadMessages(state: State) {
  return state.unreadMessages;
}

function findMessagesByPubid(state: State, id: string) {
  return findByID(state.messages, id);
}

function getInterval(state: State) {
  return state.interval;
}

function getActivated(state: State) {
  return state.activated;
}

function isMessagePanelExpanded(state: State, panelName: MessagePanelName) {
  return state.expandedMessagePanels.includes(panelName);
}

export const messagesModule = createStoreModule(initialState, {
  namespace: 'messagess',
  reducers,
  actionCreators: {
    addMessages,
    removeFromUnreadMessage,
    removeOverTimeMessage,
    clearMessages,
    setInterval,
    toggleMessagePanelExpansion,
    setActivated,
  },
  selectors: {
    allMessages,
    allOrganisationEventMessages,
    allInstanceMessages,
    allAdditionalMessages,
    unreadMessages,
    unreadMessageCount,
    allMessageCount,
    getInterval,
    getActivated,
    isMessagePanelExpanded,
    findMessagesByPubid,
  },
});
