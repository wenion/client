import { Scroll, ScrollContainer, ScrollContent } from '@hypothesis/frontend-shared';
import { useEffect, useState, useRef } from 'preact/hooks';

import type { dataComics, kmProcess } from '../../types/api';


function SiteMap({id, process, onSelectImage}: {id: string; process: kmProcess[], onSelectImage: (id: number) => void;}) {
  const imageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (imageRef.current) {
      imageRef.current.style.width = '80px';
      imageRef.current.style.height = '80px';
      console.log("")
    }
  }, [])

  const onImageClick = (id: number) => {
    onSelectImage(id);
  }

  return (
    <>
      <p className="text-3xl font-bold text-yellow-500" >Process Overview</p>
      <div
        className='timeline-content m-4'
        id={id}
      >
        <div className='flex justify-center'>
        {process.map((child, index) => (
          <div className='relative cursor-pointer'>
            <img
              ref={imageRef}
              className='border border-gray-300 hover:border-2 hover:border-gray-500 w-20 h-20'
              id={id + '_' + index}
              src={child.image}
              onClick={() => onImageClick(index)}
            />
          </div>
          )
        )}
        </div>
      </div>
    </>
  )
}

function Detail({id, title, process, selected}: {id: string; title: string, process: kmProcess[], selected: number}) {
  // const [currentIndex, setCurrentIndex] = useState(selected);

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
                className='flex timeline-node cursor-pointer'
                id={id}
              >
                <div className='text-center content-center -rotate-90 m-[-35px]'>{p.name}</div>
              </div>
              <div
                className='timeline-content m-4'
                id={id + '_ps_' + index}
              >
                {p.steps && p.steps.map(step => (
                  step.type === 'Navigation' ? (
                    <img
                      className='h-20'
                      alt={step.title}
                      src={step.image}
                    />
                  ) :  (
                    <img
                      className='h-20 inline'
                      alt={step.title}
                      src={step.image}
                    />
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
export default function DataComicsNote({data}: {data: dataComics}) {

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
              {data.KM_Process && <Detail id={data.sessionId} title={data.taskName} process={data.KM_Process} selected={selectIndex}/>}
            </div>
          </ScrollContent>
        </Scroll>
      </ScrollContainer>
    </div>
  );
}