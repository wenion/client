import { useEffect, useRef } from 'preact/hooks';
import classnames from 'classnames';

import type { RecordItem, RecordStep } from '../../types/api';
import { useSidebarStore } from '../store';
import { getElementWidthWithMargins } from '../util/dom';
import ArrowIcon from '../../images/icons/dataComicsArrow';

function capitalizeFirstLetter(str: string): string {
  if (str.length === 0) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

type NavComicsProps = {
  recordItem: RecordItem;
  steps: RecordStep[];
  onClick: (step: RecordStep, sectionId?: number) => void;
};

export default function NavComics({
  recordItem,
  steps,
  onClick,
}: NavComicsProps) {
  const store = useSidebarStore();
  const scollRef = useRef<HTMLDivElement | null>(null);
  const focusedStepId = store.getNavFocusedStepId();

  const navs = steps.filter(step => step.tagName === "Navigate" || step.tagName === "Switch");

  const onNavClick = (step: RecordStep, index: number) => {
    onClick(step, index);
    const threadIndex = navs.findIndex(t => t.id === step.id);
    if (threadIndex === -1) {
      return;
    }

    const xOffset = navs
      .slice(0, threadIndex)
      .reduce((total, thread) => total + getElementWidthWithMargins(document.getElementById("nav"+ thread.id)!), 0)

    const scrollLength = getElementWidthWithMargins(scollRef.current!);
    const scrollLeft = scollRef.current!.scrollLeft;
    const xRightOffset = xOffset + getElementWidthWithMargins(document.getElementById("nav"+ step.id)!);

    if (xRightOffset - scrollLeft > scrollLength || xOffset - scrollLeft < 0) {
      scollRef.current!.scrollTo({
        left: xOffset,
        behavior: 'smooth',
      });
    }
  };

  // For segmentation shareflow
  const onSectionClick = (index: number, id: string) => {
    const recordStep = store.getRecordStepById(id);
    if (!recordStep) {
      return;
    }
    onClick(recordStep, index);

    let xOffset = 0;
    for (let i = 0; i < index; i++) {
      // 32 is the arrow's width
      xOffset = xOffset + getElementWidthWithMargins(document.getElementById("nav" + id)!) + 32;
    }
    const scrollLength = getElementWidthWithMargins(scollRef.current!);
    const scrollLeft = scollRef.current!.scrollLeft;
    const xRightOffset = xOffset + getElementWidthWithMargins(document.getElementById("nav"+ id)!);

    if (xRightOffset - scrollLeft > scrollLength || xOffset - scrollLeft < 0) {
      scollRef.current!.scrollTo({
        left: xOffset,
        behavior: 'smooth',
      });
    }
  };

  useEffect(()=> {
    let targetIndex = steps.findIndex(step => step.id === focusedStepId);
    if (targetIndex === -1) {
      return;
    }

    let target = document.getElementById("nav" + focusedStepId);

    while(!target && targetIndex > 0) {
      targetIndex = targetIndex - 1;
      const step = steps[targetIndex];
      target = document.getElementById("nav" + step.id);
    }
    if (target) {
      target.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [focusedStepId])


  const onWheelEvent = (e: WheelEvent) => {
    e.preventDefault();
    if (scollRef.current) {
      if (e.deltaY > 1) {
        scollRef.current.scrollLeft += 50;
        return;
      }
      else if (e.deltaY < -1) {
        scollRef.current.scrollLeft -= 50;
        return;
      }

      scollRef.current.scrollLeft += e.deltaX;
    }
  };

  const onArrowClick = (index: number) => {
    // let totallength = 0;
    // for (let i = 0; i < index; i++) {
    //   const nodeElement = document.getElementById(`${id}` + '_' + `${i}`);
    //   if (nodeElement) {
    //     totallength += nodeElement.clientWidth + 30;
    //   }
    //   const arrowElement = document.getElementById(`${id}` + '_' + `${i}` + '_arrow');
    //   if (arrowElement) {
    //     totallength += arrowElement.clientWidth;
    //   }
    // }

    // if (scollRef.current) {
    //   scollRef.current.scrollTo({left: totallength, behavior: 'smooth'});
    //   // onSelectImage(index);
    // }
  }

  if (navs.length === 1) {
    return (<></>);
  }

  return (
    <div className="w-full h-24 comics-nav">
      <div
        className="flex w-full h-full overflow-x-auto bg-white"
        ref={scollRef}
        onWheel={(event) => onWheelEvent(event)}
      >
        {recordItem.extra?.sections && (
          recordItem.extra?.sections.map((item, index) => {
            return (
              <>
                <div
                  id={"nav" + item.steps_id[0]}
                  className={classnames(
                    "rounded-xl border border-gray-400",
                    "hover:shadow-lg",
                    "cursor-pointer",
                    "text-blue-chathams",
                    "text-pretty text-ellipsis",
                    "justify-center content-center",
                    "min-w-32",
                    // "overflow-hidden",
                    "px-4 m-2",     // Add padding for better spacing
                  )}
                  title={item.description}
                  onClick={() => onSectionClick(index, item.steps_id[0])}
                >
                  <b>{index + 1}. {capitalizeFirstLetter(item.title)}</b>
                </div>
                {index !== recordItem.extra?.sections.length! - 1 && (
                  <div
                    className={classnames(
                      "flex justify-center items-center px-2",
                      "cursor-pointer",
                    )}
                  >
                    <ArrowIcon />
                  </div>
                )}
              </>
            )
          })
        )}
        {recordItem.extra && Object.keys(recordItem.extra).length === 0 && (
          navs.map((step, index) => {
            return (
            <>
              <div
                id={"nav" + step.id}
                className={classnames(
                  "rounded-xl border border-gray-400",
                  "hover:shadow-lg",
                  "cursor-pointer",
                  "text-blue-chathams",
                  "text-ellipsis",
                  "justify-center content-center",
                  "min-w-32",
                  "overflow-hidden",
                  "px-4 m-2",     // Add padding for better spacing
                )}
                title={step.description ?? step.url}
                onClick={() => onNavClick(step, index)}
              >
                <b>{index + 1}. {capitalizeFirstLetter(step.title)}:</b>{" "}{step.description ?? step.url}
              </div>
              {index !== navs.length - 1 && (
                <div
                  className={classnames(
                    "flex justify-center items-center px-2",
                    "cursor-pointer",
                  )}
                >
                  <ArrowIcon />
                </div>
              )}
            </>
          )}
        ))
        }
      </div>
    </div>
  )
}
