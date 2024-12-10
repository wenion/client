import { Card, CardContent } from '@hypothesis/frontend-shared';
import { useEffect, useRef } from 'preact/hooks';
import classnames from 'classnames';

export type ActionData = {
  id: number;
  title: string;
  description: string;
  imgSrc: string | null;
  width: number;
  height: number;
  clientX: number | null;
  clientY: number | null;
};

type ActionCardProps = {
  action: ActionData;
};

export default function ActionCard({ action }: ActionCardProps) {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const circleRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (imageRef.current && circleRef.current && action.clientX && action.clientY && action.width && action.height) {
      const width = action.width;
      const height = action.height;
      const offsetX = action.clientX;
      const offsetY = action.clientY;

      if (width && height && offsetY && offsetX) {
        const widthToHeight = width / height;
        const ratioHeight = imageRef.current.clientHeight/height;
        const ratioWidth = widthToHeight * imageRef.current.clientHeight / width;

        circleRef.current.style.top = Math.round(offsetY * ratioHeight - 8).toString() + "px";
        circleRef.current.style.left = Math.round(offsetX * ratioWidth - 8).toString() + "px";
      }
    }
  }, [imageRef.current, circleRef.current, action.clientX, action.clientY])

  return (
    <Card
      classes="cursor-pointer focus-visible-ring theme-clean:border-none"
      data-testid="thread-card"
      tabIndex={-1}
      key={action.id}
    >
      <CardContent>
        <section className="flex" data-testid="thread-container">
          <div
            className={classnames(
              // Set a max-width to ensure that annotation content does not exceed
              // the width of the container
              'grow max-w-full min-w-0',
            )}
            data-testid="thread-content"
          >
            <article className="space-y-4 m-2">
              <header className='flex'>
                <div
                  className={classnames(
                    'flex flex-col h-8 w-8 rounded-full mr-4',
                    'items-center justify-center',
                    'font-bold bg-blue-200/50'
                  )}
                >
                  <span>{action.id}</span>
                </div>
                <div>
                  <div className="text-xl">{action.title}</div>
                  <div className="text-base break-all">
                    <p>
                    {action.description}
                    </p>
                  </div>
                </div>
              </header>
              <div className="relative p-1 cursor-pointer space-y-2 overflow-hidden">
                {action.imgSrc && (
                  <img
                    ref={imageRef}
                    className={classnames(
                      'cursor-pointer',
                    )}
                    alt={action.title}
                    src={action.imgSrc}
                  />
                )}
                {action.clientX && action.clientY && (
                  <div
                    ref={circleRef}
                    className={classnames(
                      'w-6 h-6 rounded-full', 
                      'absolute border-2 border-red-500 bg-red-100/35 transition-all',
                    )}
                  />
                )}
              </div>
            </article>
          </div>
        </section>
      </CardContent>
    </Card>
  )
}
