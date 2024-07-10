import { Scroll, ScrollContainer, ScrollContent } from '@hypothesis/frontend-shared';
import { useEffect, useState, useRef } from 'preact/hooks';
import classnames from 'classnames';

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

  const onWheelEvent = (e: WheelEvent) => {
    e.preventDefault();
    if (scollRef.current) {
      if (e.deltaY > 0) {
        scollRef.current.scrollLeft += 50;
      }
      else {
        scollRef.current.scrollLeft -= 50;
      }
    }
  }

  return (
    <>
      <p className="text-3xl font-bold text-yellow-500" >Process Overview</p>
      <div
        className='flex max-h-32 m-2 overflow-y-auto'
        id={id}
        ref={scollRef}
        onWheel={(event) => onWheelEvent(event)}
      >
        <div className='flex min-w-max justify-center items-start'>
        {process.map((p, index) => (
          <>
            {index !== 0 &&
              <div className='-mt-24 -ml-8 -mr-8 -rotate-90-scale-20'>
                <ArrowIcon />
              </div>
            }
            {index === 0 ? (
              <div className='grid grid-cols-1 place-items-center'>
                <div
                  className={classnames(
                    'border border-gray-300 hover:border-2 hover:border-gray-500',
                    'flex rounded-full justify-center items-center text-nowrap',
                    'text-amber-400 relative cursor-pointer w-20 h-20',
                  )}
                  id={id + '_' + index}
                  onClick={() => onImageClick(index)}
                >
                  {p.name}
                </div>
                <div className='flex justify-center items-center'>{p.title}</div>
              </div>
            ) : (
              <div className='grid grid-cols-1 place-items-center'>
                <div
                  className={classnames(
                    'border border-gray-300 hover:border-2 hover:border-gray-500',
                    'flex rounded-full justify-center items-center text-nowrap',
                    'text-amber-400 relative cursor-pointer w-20 h-20',
                  )}
                  id={id + '_' + index}
                  onClick={() => onImageClick(index)}
                >
                  {p.name}
                </div>
                <div className='flex justify-center items-center'>{p.title}</div>
              </div>
            )}
          </>
          )
        )}
        </div>
      </div>
    </>
  )
}

function Detail({id, title, process, selected, onClickImage}: {id: string; title: string, process: kmProcess[], selected: number, onClickImage: (step: RecordingStepData) => void;}) {
  // const [currentIndex, setCurrentIndex] = useState(selected);

  const onClick = (url: string) => {
    window.open(url, '_blank');
  }

  useEffect(() => {
      // Add blink class to the selected element
      const selectedElement = document.getElementById(`${id}_ps_${selected}`);
      if (selectedElement) {
          selectedElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
      <p className="text-3xl font-bold text-yellow-500" >Process in Detail</p>
      <div className="text-xl text-center text-yellow-500">
        {title}
      </div>

      <div
        className='message-grid'
      >
      {process.map(
        (p, index) =>
          (
            <>
              <div
                className='relative flex justify-center items-center h-full w-full data-comics-node cursor-pointer'
                id={id + '_ps_' + index}
              >
                <div className='content-center -rotate-90'>{p.name}</div>
              </div>
              <div
                className='timeline-content m-4'
                id={id}
              >
                {p.steps && p.steps.map(step => (
                  step.type === 'Navigation' ? (
                    <img
                      className='cursor-pointer'
                      alt={step.title}
                      src={step.image}
                      onClick={e => onClick(step.url)}
                    />
                  ) :  (
                    <>
                      <img
                        className={classnames('inline',
                          // 'max-h-24'
                        )}
                        alt={step.title}
                        src={step.image}
                      />
                      {step.screenshot && (
                        <img
                          className='cursor-pointer'
                          onClick={() => onClickImage({
                            type: 'screenshot',
                            id: 'screenshot',
                            image: step.screenshot,
                            width : step.width?? 0,
                            height : step.width?? 0,
                            offsetX : step.width?? 0,
                            offsetY : step.width?? 0,
                          })}
                          alt={step.title}
                          src={step.screenshot}
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

  const [selectIndex, setSelectIndex] = useState(0);

  return (
    <div className="data-comics-height">
      <ScrollContainer borderless>
        <div className='bg-white'>
          {data.KM_Process && <SiteMap id={data.sessionId} process={data.KM_Process} onSelectImage={setSelectIndex}/>}
        </div>
        <Scroll classes={'mt-1'}>
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