import { Scroll, ScrollContainer, ScrollContent } from '@hypothesis/frontend-shared';
import { useEffect, useState, useRef } from 'preact/hooks';
import classnames from 'classnames';

import { withServices } from '../service-context';
import { useSidebarStore } from '../store';
import type { dataComics, kmProcess, RecordingStepData } from '../../types/api';
import { RecordingService } from '../services/recording';
import Detail from './DataComicsDetail';
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


/**
 * Create the iframe that will load the notebook application.
 */
function DataComicsNote({recordingService, data, onDataComicsEvent}:
  {recordingService: RecordingService; data: dataComics; onDataComicsEvent:(step: RecordingStepData) => void}) {
  const store = useSidebarStore();
  const [selectIndex, setSelectIndex] = useState(-1);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const scrollTop = store.getStep();

  const onScroll = (e: Event) => {
    if (scrollRef.current) {
      const scrollTop = scrollRef.current.scrollTop;
    }
  }

  const comicCompleted = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollTop;
    }
  }

  const onMouseLeave = () => {
    if (scrollRef.current) {
      const scrollTop = scrollRef.current.scrollTop;
      // recordingService.updateTracking(data.sessionId, data.userid, scrollTop);
    }
  }

  return (
    <div className="data-comics-height">
      <ScrollContainer borderless>
        {/* <div className='bg-white'>
          {data.KM_Process && <SiteMap id={data.sessionId} process={data.KM_Process} onSelectImage={setSelectIndex}/>}
        </div> */}
        <Scroll
          onMouseLeave={(e) => onMouseLeave()}
          onScroll={(e) => onScroll(e)}
          elementRef={scrollRef}
        >
          <ScrollContent>
            <div className='bg-white'>
              {data.KM_Process && (
                <Detail
                  id={data.sessionId}
                  userid={data.userid}
                  title={data.taskName}
                  process={data.KM_Process}
                  selected={selectIndex}
                  onClickImage={onDataComicsEvent}
                  onRendered={comicCompleted}
                />
              )}
            </div>
          </ScrollContent>
        </Scroll>
      </ScrollContainer>
    </div>
  );
}

export default withServices(DataComicsNote, ['recordingService']);
