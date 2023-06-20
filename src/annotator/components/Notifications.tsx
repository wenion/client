import { useCallback, useEffect, useState, useRef } from 'preact/hooks';
import { Panel, Tab, TabList } from '@hypothesis/frontend-shared';
import classnames from 'classnames';
import type { JSX, RefObject } from 'preact';

import type { PullingData } from '../../types/annotator';
import MarkdownView from './MarkdownView';

export type NotificationProps = {
  notification: PullingData;
  onClose: () => void;
  onChange: (ratingType: string, value: string) => void;
};

/**
 * A component that renders toast messages published from the sidebar, in a way
 * that they "appear" in the viewport even when the sidebar is collapsed.
 * This is useful to make sure screen readers announce hidden messages.
 */
export default function Notification({
  notification,
  onClose,
  onChange,
}: NotificationProps) {
  const isRelevanceSelected = (test: string) => {
    return notification.relevance == test;
  }

  const isSelected = (test: string) => {
    return notification.timeliness == test;
  }

  function processAsMarkdown(context: string) {
    if (context && context.includes("\n")) {
      context = "* "+ context.replace(/\n/g, "\n* ");
    }
    return context;
  }

  return (
    <div
      className={classnames(
        'absolute -left-96 w-96 top-2 rounded-lg z-2',
        'text-px-base leading-none' // non-scaling sizing
      )}
      // ref={notification.element}
    >
      <Panel title={notification.title} onClose={onClose}>
        <MarkdownView
          markdown={processAsMarkdown(notification.context)}
          classes="text-lg leading-relaxed font-sans"
          // style={textStyle}
        />
        <div class="flex flex-row items-center justify-between">
          <div class="text-xs text-gray-900 dark:text-white pr-2">Rate the relevance: </div>
          <TabList classes="justify-center p-2.5 gap-x-2.5 rounded-lg border bg-slate-300">
            <Tab selected={isRelevanceSelected("Relevant")} onClick={() => onChange("relevant", "Relevant")}>
              Relevant
            </Tab>
            <Tab selected={isRelevanceSelected("Not relevant")} onClick={() => onChange("relevant", "Not relevant")}>
              Not relevant
            </Tab>
          </TabList>
        </div>
        <div class="flex flex-row items-center justify-between">
          <div class="text-xs text-gray-900 dark:text-white  pr-2">Rate the timeliness: </div>
          <TabList classes="justify-center p-2.5 gap-x-2.5 rounded-lg border bg-slate-300">
            <Tab selected={isSelected("Perfect")} onClick={() => onChange("timeliness", "Perfect")}>
            Perfect
            </Tab>
            <Tab selected={isSelected("Well timed")} onClick={() => onChange("timeliness", "Well timed")}>
              Well timed
            </Tab>
            <Tab selected={isSelected("Too early")} onClick={() => onChange("timeliness", "Too early")}>
              Too early
            </Tab>
            <Tab selected={isSelected("Too late")} onClick={() => onChange("timeliness", "Too late")}>
              Too late
            </Tab>
          </TabList>
        </div>
      </Panel>
    </div>
  );
}
