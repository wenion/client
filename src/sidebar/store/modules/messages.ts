/**
 * State management for the set of annotations currently loaded into the
 * sidebar.
 */
import { createStoreModule, makeAction } from '../create-store';
import type { RawMessageData, MessageType } from '../../../types/api'
import { createSelector } from 'reselect';

const initialState = {
  expandedMessagePanels: ['organization', ],
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
    return {
      messages: [...state.messages, action.message],
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

  CLEAR_MESSAGES(): Partial<State> {
    return { messages: [] };
  },

  CHANGE_PANEL(state: State, action: { panel: MessageType }) {
    const include = state.expandedMessagePanels.includes(action.panel)

    return include ? {
      expandedMessagePanels: state.expandedMessagePanels.filter((panel => panel !== action.panel))
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

// function removeOverTimeMessage() {
//   return makeAction(reducers, 'REMOVE_OVERTIME_MESSAGES', undefined);
// }

function toggleMessagePanelExpansion(panel: MessageType) {
  return makeAction(reducers, 'CHANGE_PANEL', { panel });
}

function allMessageCount(state: State) {
  return state.messages.length;
}

function isMessagePanelExpanded(state: State, panelName: MessageType) {
  return state.expandedMessagePanels.includes(panelName);
}

function hasMessage(state: State, messageId: string) {
  return state.messages.some(message => {
    return message.id === messageId;
  })
}

/**
 * Count the number of orphans currently in the collection
 */
const addtionMessages = createSelector(
  (state: State) => state.messages,
  messages =>
    messages.filter(msg => msg.type === "additional_knoledge"),
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

export const messagesModule = createStoreModule(initialState, {
  namespace: 'messages',
  reducers,
  actionCreators: {
    addMessages,
    removeFromUnreadMessage,
    clearMessages,
    toggleMessagePanelExpansion,
  },
  selectors: {
    allMessageCount,
    isMessagePanelExpanded,
    hasMessage,
    addtionMessages,
    shareFlowMessages,
    organizationMessages,
  },
});
