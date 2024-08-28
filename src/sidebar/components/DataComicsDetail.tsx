import { useEffect, useState, useRef, useLayoutEffect } from 'preact/hooks';
import classnames from 'classnames';
import debounce from 'lodash.debounce';

import { withServices } from '../service-context';
import { ListenerCollection } from '../../shared/listener-collection';
import type { kmProcess, RecordingStepData } from '../../types/api';
import { RecordingService } from '../services/recording';

import ClickIcon from '../../images/icons/action-click';
import TypeIcon from '../../images/icons/action-type';
import ScrollUpIcon from '../../images/icons/action-scroll-up';
import SelectionIcon from '../../images/icons/action-selection';
import SelectAreaIcon from '../../images/icons/action-select-area';
import SubmitIcon from '../../images/icons/action-submit';
import ScrollDownIcon from '../../images/icons/action-scroll-down';
import SearchIcon from '../../images/icons/action-search';
import QuestionIcon from '../../images/icons/action-question';


function Thumbnail({title, image, size, onClickEvent, onLoad}: {
  title: string,
  image: string,
  size: {width: number|undefined, height: number|undefined, offsetX: number|undefined, offsetY: number|undefined},
  onClickEvent: (step: RecordingStepData) => void,
  onLoad: () => void,
}) {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const circleRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const listeners = new ListenerCollection();

    const updateCirclePosition = debounce(
      () => {
        if (imageRef.current && circleRef.current && size.width && size.height && size.offsetX && size.offsetY) {
          const width = size.width;
          const height = size.height;
          const offsetX = size.offsetX;
          const offsetY = size.offsetY;

          if (width && height && offsetY && offsetX) {
            const widthToHeight = width / height;
            const ratioHeight = imageRef.current.clientHeight/height;
            const ratioWidth = widthToHeight * imageRef.current.clientHeight / width;

            circleRef.current.style.top = Math.round(offsetY * ratioHeight - 8).toString() + "px";
            circleRef.current.style.left = Math.round(offsetX * ratioWidth - 8).toString() + "px";
          }
        }
        onLoad();
      },
      10,
      { maxWait: 1000 }
    );

    listeners.add(window, 'resize', updateCirclePosition);
    if (imageRef.current) {
      imageRef.current.onload = updateCirclePosition;
    }

    return () => {
      listeners.removeAll();
      updateCirclePosition.cancel();
    };
  }, [])

  const hover = (hoved: boolean) => {
    if (hoved && circleRef.current) {
      circleRef.current.classList.add("animate-blink");
    }
    if (!hoved && circleRef.current) {
      circleRef.current.classList.remove("animate-blink");
    }
  }

  return (
    <div className='relative p-1 cursor-pointer border hover:shadow-lg my-0.5'>
      <img
        ref={imageRef}
        className={classnames(
          'cursor-pointer',
        )}
        onClick={() => onClickEvent({
          type: 'screenshot',
          id: 'screenshot',
          image: image,
          width : size.width?? 0,
          height : size.height?? 0,
          offsetX : size.offsetX?? 0,
          offsetY : size.offsetY?? 0,
        })}
        onMouseEnter={() => hover(true)}
        onMouseLeave={() => hover(false)}
        alt={title}
        src={image}
      />
      {size && size.offsetX && size.offsetY && (
        <div
          ref={circleRef}
          className='w-6 h-6 rounded-full absolute border-2 border-red-500 bg-red-100/35 transition-all'
        />
      )}
    </div>
  )
}

function capitalizeFirstLetter(str: string): string {
  if (str.length === 0) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function DigitImage({type, text, context, title, isAlign = false}: {
  type: string,
  text: string
  context: string,
  title: string,
  isAlign: boolean,
}) {
  return (
    <div
      className={classnames(
        'grid grid-rows-3 grid-flow-col gap-y-1',
        'justify-self-center content-center',
        {
          'gap-x-4': !isAlign,
        },
        {'data-comics-image gap-x-2': isAlign},
        'text-lg text-blue-chathams text-center',
        'border border-black my-0.5',
        'hover:shadow-lg',
        'cursor-pointer',
      )}
      title={title}
      // onClick={e => onClick(step.url)}
    >
      <div
        className={classnames(
          "justify-self-center content-center row-span-3",
          {"data-comics-icon": isAlign},
          {
            "min-w-20 max-w-24 p-4": !isAlign,
          },
        )}
      >
        {type.toLowerCase() === "click" ? (
          <ClickIcon />
        ) : type.toLowerCase() === "type" || type.toLowerCase() === "keyup"  ? (
          <TypeIcon />
        ) : type.toLowerCase() === "scroll" && text.toLowerCase() === "scroll down" ? (
          <ScrollDownIcon />
        ) : type.toLowerCase() === "scroll" && text.toLowerCase() === "scroll up" ? (
          <ScrollUpIcon />
        ) : type.toLowerCase() === "submit" ? (
          <SubmitIcon />
        ) : type.toLowerCase() === "search" ? (
          <SearchIcon />
        ) : type.toLowerCase() === "select" ? (
          <SelectionIcon />
        ) : type.toLowerCase() === "selectarea" ? (
          <SelectAreaIcon />
        ) : (
          <QuestionIcon />
        )}
      </div>
      <span className={classnames(
        "col-span-2 border-b border-l border-black",
        "text-lg text-black font-bold content-center"
      )}>
        {capitalizeFirstLetter(type)}
      </span>
      <div
        className={classnames(
          "row-span-2 col-span-2",
          "justify-self-center content-center",
          {"italic": isAlign},
          {"break-all": context.includes("http://") || context.includes("https://")},
          {"break-words": !context.includes("http://") && !context.includes("https://")},
          {"text-sm": context.length >= 35 && context.length <60},
          {"text-xs": context.length >= 60}
        )}
      >
        {context}
      </div>
    </div>
  )
}

type DetailProps = {
  recordingService: RecordingService;
  id: string;
  userid: string;
  title: string;
  process: kmProcess[];
  selected: number;
  onClickImage: (step: RecordingStepData) => void;
  onRendered: () => void;
};

function Detail({recordingService, id, userid, title, process, selected, onClickImage, onRendered}: DetailProps) {
  const onClick = (url: string) => {
    window.open(url, '_blank');
  }

  const getFirstQuotationContent = (text: string) => {
    const match = text.match(/"([^"]*)"/);
    if (match) {
      return(match[1]); // Output: 'the text'
    }
    return text
  }

  return (
    <>
      <p className="text-xl font-bold text-blue-chathams m-2" >Process in Detail</p>
      <div className="text-2xl font-bold text-center text-blue-chathams">
        {title}
      </div>

      <div
        className='data-comics-grid'
      >
      {process.map(
        (p, index) =>
          (
            <>
              <div
                className={classnames(
                  'relative flex justify-center h-full w-full cursor-pointer',
                  {'data-comics-node': index}
                )}
                id={id + '_ps_' + index}
              >
                <div className='text-2xl'>{index + 1}</div>
              </div>
              <div
                className={classnames({'data-comics-content': index})}
                id={id}
              >
                {p.steps && p.steps.map((step, index, arr)  => (
                  step.type === 'Navigation' ? (
                    <div
                      className={classnames(
                        'text-lg text-blue-chathams text-center',
                        'border border-black my-0.5',
                        'hover:shadow-lg',
                        'cursor-pointer',
                        'p-2'
                      )}
                      title={step.url}
                      onClick={e => onClick(step.url)}
                    >
                      <b>Go to:&nbsp;</b> {step.title}
                    </div>
                  ) : step.type === 'getfocus' ? (
                    <div
                      className={classnames(
                        'text-lg text-blue-chathams text-center',
                        'border border-black my-0.5',
                        'hover:shadow-lg',
                        'cursor-pointer',
                        'p-2'
                      )}
                      title={step.url}
                      onClick={e => onClick(step.url)}
                    >
                      <b>Switch to&nbsp;</b> {step.title}
                    </div>
                  ) : (
                    <>
                      {step.type.toLowerCase() === 'click' ? (
                        <div class="flex">
                          <DigitImage
                            type={step.type.toLowerCase()}
                            text={step.text}
                            context={getFirstQuotationContent(step.description)}
                            title={step.title}
                            isAlign={true}
                          />
                          {step.screenshot && (index !== arr.length - 1 ? (
                            <Thumbnail
                              title={step.title}
                              image={step.screenshot}
                              size={{width:step.width, height:step.height, offsetX:step.offsetX, offsetY:step.offsetY}}
                              onClickEvent={onClickImage}
                              onLoad={()=>{}}
                            />
                          ) : (
                              <Thumbnail
                                title={step.title}
                                image={step.screenshot}
                                size={{width:step.width, height:step.height, offsetX:step.offsetX, offsetY:step.offsetY}}
                                onClickEvent={onClickImage}
                                onLoad={onRendered}
                              />
                          ))}
                        </div>
                      ) : (
                        <>
                          <DigitImage
                            type={step.type.toLowerCase()}
                            text={step.text}
                            context={step.description}
                            title={step.title}
                            isAlign={false}
                          />
                          {step.screenshot && (index !== arr.length - 1 ? (
                            <Thumbnail
                              title={step.title}
                              image={step.screenshot}
                              size={{width:step.width, height:step.height, offsetX:step.offsetX, offsetY:step.offsetY}}
                              onClickEvent={onClickImage}
                              onLoad={()=>{}}
                            />
                          ) : (
                            <Thumbnail
                              title={step.title}
                              image={step.screenshot}
                              size={{width:step.width, height:step.height, offsetX:step.offsetX, offsetY:step.offsetY}}
                              onClickEvent={onClickImage}
                              onLoad={onRendered}
                            />
                          ))}
                        </>
                      )}
                    </>
                  )
                ))}
              </div>
            </>
          )
      )}
      </div>
    </>
  )
}

export default withServices(Detail, ['recordingService']);
