import { Scroll, ScrollContainer, ScrollContent } from '@hypothesis/frontend-shared';
import { useEffect, useState, useRef, useLayoutEffect } from 'preact/hooks';
import classnames from 'classnames';
import debounce from 'lodash.debounce';

import { ListenerCollection } from '../../shared/listener-collection';
import type { dataComics, kmProcess, RecordingStepData } from '../../types/api';
import ArrowIcon from '../../images/icons/dataComicsArrow';


function SiteMap({id, process, onSelectImage}: {id: string; process: kmProcess[], onSelectImage: (id: number) => void;}) {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const scollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (imageRef.current) {
      imageRef.current.style.width = '80px';
      imageRef.current.style.height = '80px';
    }
  }, [])

  const onImageClick = (id: number) => {
    onSelectImage(id);
  }

  const truncateStringAtWhitespace = (str:string, charLimit:number) => {
    if (str.length <= charLimit) {
      return str;
    }

    // Slice the string to get the first `charLimit` characters
    let truncatedStr = str.slice(0, charLimit);

    // Find the position of the last whitespace character within the truncated string
    let lastWhitespaceIndex = truncatedStr.lastIndexOf(' ');

    // If there is a whitespace character, trim the string at that position
    if (lastWhitespaceIndex !== -1) {
      truncatedStr = truncatedStr.slice(0, lastWhitespaceIndex);
    }

    if (!/[a-zA-Z0-9]$/.test(truncatedStr)) {
      truncatedStr = truncatedStr.slice(0, -1);
    }

    return truncatedStr + '...';
  }

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
  }

  const onArrowClick = (index: number) => {
    let totallength = 0;
    for (let i = 0; i < index; i++) {
      const nodeElement = document.getElementById(`${id}` + '_' + `${i}`);
      if (nodeElement) {
        totallength += nodeElement.clientWidth + 30;
      }
      const arrowElement = document.getElementById(`${id}` + '_' + `${i}` + '_arrow');
      if (arrowElement) {
        totallength += arrowElement.clientWidth;
      }
    }

    if (scollRef.current) {
      scollRef.current.scrollTo({left: totallength, behavior: 'smooth'});
      onSelectImage(index);
    }
  }

  return (
    <>
      <div className="text-xl font-bold text-blue-chathams m-2" >Process Overview</div>
      <div
        className='flex h-fit m-2 overflow-y-auto'
        id={id}
        ref={scollRef}
        onWheel={(event) => onWheelEvent(event)}
      >
        <div className='flex min-w-max justify-center'>
        {process.map((p, index) => (
          <>
            {index !== 0 &&
              <div
                className='max-w-16 mx-1 cursor-pointer'
                id={id + '_' + index + '_arrow'}
                onClick={() => onArrowClick(index)}
              >
                <ArrowIcon />
              </div>
            }
            <div className='grid grid-cols-1'>
              <div
                className={classnames(
                  'place-self-center border border-gray-300 hover:border-2 hover:border-gray-500',
                  'flex justify-center items-center text-nowrap',
                  'text-blue-chathams relative cursor-pointer max-w-32',
                  {
                    'p-4': p.name.toLowerCase() !== 'match',
                    'px-0': p.name.toLowerCase() === 'match',
                    'py-4': p.name.toLowerCase() === 'match',
                  }
                )}
                id={id + '_' + index}
                onClick={() => onImageClick(index)}
              >
                {p.name.toLowerCase() === 'match' ? (<b>&nbsp;</b>) : (<b>{p.name}</b>)}
              </div>
              <div className='flex text-xs text-center max-w-32 pt-2'>{truncateStringAtWhitespace(p.title, 40)}</div>
            </div>
          </>
          )
        )}
        </div>
      </div>
    </>
  )
}

function Thumbnail({title, image, size, onClickEvent}: {
  title: string,
  image: string,
  size: {width: number|undefined, height: number|undefined, offsetX: number|undefined, offsetY: number|undefined},
  onClickEvent: (step: RecordingStepData) => void
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
      },
      10,
      { maxWait: 1000 }
    );

    listeners.add(window, 'resize', updateCirclePosition);

    return () => {
      listeners.removeAll();
      updateCirclePosition.cancel();
    };
  }, [])

  useEffect(() => {
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
  }, [])

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
        alt={title}
        src={image}
      />
      {size && size.offsetX && size.offsetY && (
        <div
          ref={circleRef}
          className='w-6 h-6 rounded-full absolute border-2 border-blue-500 bg-blue-100/35 transition-all'
        />
      )}
    </div>
  )

}

function Detail({id, title, process, selected, onClickImage}:
  {id: string; title: string, process: kmProcess[], selected: number, onClickImage: (step: RecordingStepData) => void;}) {

  const onClick = (url: string) => {
    window.open(url, '_blank');
  }

  useEffect(() => {
      // Add blink class to the selected element
      const selectedElement = document.getElementById(`${id}_ps_${selected}`);
      if (selectedElement) {
          selectedElement.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'start' });
          selectedElement.classList.add('blink');

          // Remove blink class after 2 seconds
          const timeout = setTimeout(() => {
              selectedElement.classList.remove('blink');
          }, 1500);

          // Clean up timeout if component unmounts or selected changes
          return () => clearTimeout(timeout);
      }
  }, [selected]);

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
                      onClick={e => onClick(step.url)}
                    >
                      <b>Go to:&nbsp;</b> {step.title}
                    </div>
                    // <img
                    //   className='cursor-pointer hover:border-blue-chathams'
                    //   alt={step.title}
                    //   src={step.image}
                    //   onClick={e => onClick(step.url)}
                    // />
                  ) :  (
                    <>
                      <img
                        className={classnames(
                          'inline cursor-pointer my-0.5',
                          'hover:shadow-lg',
                          'md:w-[200px]',
                          'lg:w-[300px]'
                          // {'max-w-80': !step.screenshot},
                          // {'max-w-80': step.screenshot && !(index > 0 && arr[index-1].screenshot)} // previous is not screenshot
                        )}
                        alt={step.title}
                        src={step.image}
                        onClick={() => onClickImage({
                          type: 'screenshot',
                          id: 'screenshot',
                          image: step.image,
                          width : step.width?? 0,
                          height : step.height?? 0,
                        })}
                      />
                      {step.screenshot && (
                        <Thumbnail
                          title={step.title}
                          image={step.screenshot}
                          size={{width:step.width, height:step.height, offsetX:step.offsetX, offsetY:step.offsetY}}
                          onClickEvent={onClickImage}
                        />
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

/**
 * Create the iframe that will load the notebook application.
 */
export default function DataComicsNote({data, onDataComicsEvent}: {data: dataComics, onDataComicsEvent:(step: RecordingStepData) => void}) {

  const [selectIndex, setSelectIndex] = useState(-1);

  return (
    <div className="data-comics-height">
      <ScrollContainer borderless>
        {/* <div className='bg-white'>
          {data.KM_Process && <SiteMap id={data.sessionId} process={data.KM_Process} onSelectImage={setSelectIndex}/>}
        </div> */}
        <Scroll>
          <ScrollContent>
            <div className='bg-white'>
              {data.KM_Process && <Detail id={data.sessionId} title={data.taskName} process={data.KM_Process} selected={selectIndex} onClickImage={onDataComicsEvent}/>}
            </div>
          </ScrollContent>
        </Scroll>
      </ScrollContainer>
    </div>
  );
}