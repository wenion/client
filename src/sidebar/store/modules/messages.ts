/**
 * State management for the set of annotations currently loaded into the
 * sidebar.
 */
import { createStoreModule, makeAction } from '../create-store';
import type { RawMessageData, MessageType } from '../../../types/api'
import { createSelector } from 'reselect';

const initialState = {
  expandedMessagePanels: ['addition', 'shareflow', 'organization',],
  messages: [],
} as {
  expandedMessagePanels: MessageType[];
  messages: RawMessageData[];
};

export type State = typeof initialState;

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

const reducers = {
  ADD_MESSAGES(state: State, action: { message: RawMessageData }) {
    const index = state.messages.
      findIndex(r => r.id === action.message.id);
    if (index === -1) {
      return { messages: [...state.messages, action.message] };
    }
    return {
      messages: state.messages,
    };
  },

  REMOVE_FROM_UNREAD_MESSAGE(state: State, action: {needToRemove: RawMessageData[] }) {
    return {
      messages: state.messages.concat(action.needToRemove),
    };
  },

  // REMOVE_OVERTIME_MESSAGES(state: State) {
  //   const instanceMessages = state.messages.filter(m => {
  //     return m.type === 'instant_message' &&
  //     ( new Date().getTime() - new Date(m.date/1000).getTime()) < (10 * 60 *1000); // 10 mins
  //   })
  //   const organisationEventMessages = state.messages.filter(m => m.type === 'organisation_event')
  //   const remain = state.messages.filter(m => m.type !== 'organisation_event' && m.type !== 'instant_message')

  //   return {
  //     messages: instanceMessages.concat([...organisationEventMessages, ...remain]),
  //   }
  // },

  UPDATE_MESSAGE(state: State, action: {message: RawMessageData}): Partial<State> {
    const index = state.messages.findIndex(r => r.id === action.message.id);
    if (index === -1) {
      return {
        messages: state.messages,
      };
    }

    return {
      messages: [
        ...state.messages.slice(0, index),
        action.message,
        ...state.messages.slice(index + 1),
      ]
    };
  },

  CLEAR_MESSAGES(): Partial<State> {
    return { messages: [] };
  },

  CHANGE_PANEL(state: State, action: { panel: MessageType }) {
    const include = state.expandedMessagePanels.includes(action.panel)

    return include ? {
      expandedMessagePanels: state.expandedMessagePanels.filter(panel => panel !== action.panel)
    } : {
      expandedMessagePanels : [...state.expandedMessagePanels, action.panel]
    }
  },
};

/* Action creators */

function addMessages(message: RawMessageData) {
  return makeAction(reducers, 'ADD_MESSAGES', { message });
}

function removeFromUnreadMessage(needToRemove: RawMessageData[]) {
  return makeAction(reducers, 'REMOVE_FROM_UNREAD_MESSAGE', { needToRemove });
}

/** Set the currently displayed messages to the empty set. */
function clearMessages() {
  return makeAction(reducers, 'CLEAR_MESSAGES', undefined);
}

function updateMessage(message: RawMessageData) {
  return makeAction(reducers, 'UPDATE_MESSAGE', { message });
}

// function removeOverTimeMessage() {
//   return makeAction(reducers, 'REMOVE_OVERTIME_MESSAGES', undefined);
// }

function toggleMessagePanelExpansion(panel: MessageType) {
  return makeAction(reducers, 'CHANGE_PANEL', { panel });
}

/* Selectors */

function findMessageByID(state: State, id: string) {
  return state.messages.find(message => message.id === id);
}

function messages(state: State) {
  return state.messages;
}

function isMessagePanelExpanded(state: State, panelName: MessageType) {
  return state.expandedMessagePanels.includes(panelName);
}

/**
 * Count the number of orphans currently in the collection
 */
const additionMessages = createSelector(
  (state: State) => state.messages,
  messages =>
    messages.filter(msg => msg.type === "additional_knowledge"),
);

const shareFlowMessages = createSelector(
  (state: State) => state.messages,
  messages =>
    messages.filter(m => m.type === 'instant_message').sort((a, b) => b.date - a.date),
);

const organizationMessages = createSelector(
  (state: State) => state.messages,
  messages =>
    messages.filter(m => m.type === 'organisation_event').sort((a, b) => b.date - a.date), // Z -> A
);

const unreadMessages = createSelector(
  (state: State) => state.messages,
  messages =>
    messages.filter(m => m.unread_flag === true),
);

export const messagesModule = createStoreModule(initialState, {
  namespace: 'messages',
  reducers,
  actionCreators: {
    addMessages,
    removeFromUnreadMessage,
    updateMessage,
    clearMessages,
    toggleMessagePanelExpansion,
  },
  selectors: {
    isMessagePanelExpanded,
    messages,
    additionMessages,
    shareFlowMessages,
    organizationMessages,
    findMessageByID,
    unreadMessages,
  },
});
