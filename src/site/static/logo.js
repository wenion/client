import { h } from 'preact';

const LogoIcon = () => (
    <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xlinkHref="http://www.w3.org/1999/xlink" x="0px" y="0px"
        width="62px" height="43px" viewBox="0 0 100 116" xmlSpace="preserve">
    <g>
        <defs>
            <path id="SVGID_1_" d="M70.1,23.5h-0.8V6.7c0.7,1.7,0.8,3.4,0.8,4.8V23.5z M38.3,16.8c1,0.3,2.1,0.5,3.3,0.6v-0.8
                c-1-0.1-2.1-0.3-3.1-0.6c-1.3-0.3-2.5-0.6-3.7-0.6c-0.6,0-1.2,0.1-1.7,0.3v0.9c0.4-0.2,1-0.3,1.7-0.3
                C35.9,16.2,37.1,16.5,38.3,16.8z M28.6,16.2c0.7,0,1.3,0.1,1.7,0.3v-0.9c-0.5-0.2-1.1-0.3-1.7-0.3c-1.2,0-2.4,0.3-3.7,0.6
                c-1,0.3-2,0.5-3.1,0.6v0.8c1.1-0.1,2.2-0.3,3.3-0.6C26.4,16.5,27.5,16.2,28.6,16.2z M28.6,14.2c0.7,0,1.3,0.2,1.7,0.3v-0.9
                c-0.5-0.2-1.1-0.2-1.7-0.3c-1.2,0-2.4,0.3-3.7,0.6c-1,0.3-2,0.5-3.1,0.6v0.8c1.2-0.1,2.2-0.3,3.3-0.6
                C26.4,14.4,27.5,14.1,28.6,14.2z M28.6,18.3c0.7,0,1.3,0.1,1.7,0.3v-0.9c-0.5-0.2-1.1-0.2-1.7-0.3c-1.2,0-2.4,0.3-3.7,0.6
                c-1,0.3-2,0.5-3.1,0.6v0.8c1.2-0.1,2.2-0.4,3.3-0.6C26.4,18.5,27.5,18.2,28.6,18.3z M28.6,12.1c0.7,0,1.3,0.2,1.7,0.3v-0.9
                c-0.5-0.2-1.1-0.3-1.7-0.3c-1.2,0-2.4,0.3-3.7,0.6c-1,0.3-2,0.5-3.1,0.6v0.8c1.1-0.1,2.2-0.3,3.3-0.6
                C26.4,12.4,27.5,12.1,28.6,12.1z M23.2,73.3c-9.9-16.3-9.7-32.2-9.7-34.2V0.6l75,0l0,38.5c0,2,0.2,17.9-9.7,34.2
                C70,88.1,56.7,94.6,51,96.6C45.4,94.6,32.1,88.1,23.2,73.3z M43.2,70.3l-2-1.6l1.1-2.4l-2.6,0.5l-1.1-2.3l-1.2,2.3l-2.5-0.5
                l1.1,2.4l-2,1.6l2.5,0.6l0,2.6l2.1-1.6l2,1.6l0-2.6L43.2,70.3z M53.9,86.6l2.5-1.2l-2.5-1.1l0.9-2.6l-2.6,1l-1.1-2.5L50,82.6
                l-2.6-1l1,2.6l-2.5,1.1l2.5,1.2l-1,2.6l2.6-1l1.1,2.5l1.1-2.5l2.6,1L53.9,86.6z M48.4,56.8l-2,1.7l2.5,0.6l0,2.6l2-1.6l2.1,1.6
                l0.1-2.6l2.5-0.6l-2-1.7l1.1-2.4l-2.6,0.5L51,52.6l-1.1,2.3l-2.6-0.5L48.4,56.8z M57.2,73.2l1.5-1.6l-2.2-0.4l-1-2l-1,2l-2.2,0.4
                l1.6,1.6l-0.4,2.2l2-1l2,1L57.2,73.2z M64.6,65.3l1.2-2l-2.3,0l-1.1-2l-1.1,2l-2.3,0l1.2,2l-1.2,2l2.3,0l1.1,2l1.1-2l2.3,0
                L64.6,65.3z M82.2,17.1c-0.6,0.3-1.1,0.8-1.4,1.4c-0.3,0.5-0.4,1-0.4,1.5c0,0.1,0,0.2,0,0.4c0.3-0.2,0.6-0.4,0.9-0.6
                c0.2-0.2,0.4-0.5,0.6-0.7c0.2-0.4,0.3-1,0.3-1.5C82.2,17.4,82.2,17.2,82.2,17.1z M74.4,28.6c0.6,0.3,1.3,0.4,2,0.3
                c0.7-0.1,1.2-0.4,1.7-0.9c-0.6-0.3-1.2-0.4-1.9-0.3C75.5,27.8,74.9,28.2,74.4,28.6z M74.4,27.5c0.3-0.5,0.5-1.1,0.5-1.7
                c0-0.1,0-0.1,0-0.2c-0.6,0.3-1.1,0.7-1.5,1.2l0,0c-0.3,0.5-0.5,1.1-0.5,1.7c0,0.1,0,0.1,0,0.2C73.6,28.5,74.1,28.1,74.4,27.5z
                M75.2,27.3C75.2,27.3,75.2,27.4,75.2,27.3c0.2,0,0.3,0,0.4-0.1c0.4-0.3,0.6-0.7,0.8-1.2c0.1-0.3,0.2-0.7,0.2-1
                c0-0.3-0.1-0.6-0.2-0.9c-0.4,0.3-0.7,0.6-0.9,1C75.5,26,75.4,26.7,75.2,27.3z M77.1,25.7C77.1,25.8,77.1,25.8,77.1,25.7
                c0.2,0,0.3-0.1,0.4-0.2c0.3-0.4,0.4-0.8,0.5-1.3c0-0.1,0-0.2,0-0.3c0-0.5-0.2-1.1-0.5-1.6c-0.3,0.4-0.6,0.8-0.7,1.2
                C77.1,24.4,77.2,25,77.1,25.7z M78.5,23.7C78.5,23.8,78.5,23.8,78.5,23.7c0.2,0,0.3-0.1,0.4-0.3c0.1-0.3,0.2-0.6,0.2-1
                c0-0.1,0-0.3,0-0.4c-0.1-0.6-0.4-1.2-0.9-1.7c-0.2,0.4-0.3,0.9-0.3,1.3C78.2,22.4,78.4,23,78.5,23.7z M79.5,21.4
                C79.5,21.5,79.5,21.5,79.5,21.4c0.2-0.1,0.2-0.2,0.3-0.4c0-0.1,0-0.1,0-0.2c0-0.4-0.1-0.8-0.2-1.2c-0.2-0.6-0.7-1-1.3-1.4
                c-0.1,0.2-0.1,0.5-0.1,0.7c0,0.2,0,0.4,0.1,0.6C78.9,20.2,79.3,20.8,79.5,21.4z M79.9,19C79.9,19,79.9,19,79.9,19
                c0.1-0.1,0.2-0.3,0.2-0.4c-0.1-0.5-0.2-0.9-0.5-1.3c-0.4-0.5-0.9-0.9-1.6-1.1c0,0.5,0.1,1,0.3,1.4C79,17.9,79.5,18.4,79.9,19z
                M79.8,16.1c-0.2-0.5-0.4-0.9-0.8-1.2c-0.5-0.4-1-0.6-1.7-0.7c0.1,0.5,0.3,0.9,0.6,1.2c0.7,0.2,1.3,0.6,1.8,1c0,0,0.1,0,0.1,0
                C79.8,16.4,79.8,16.3,79.8,16.1z M79,14.2c0-0.2-0.1-0.3-0.1-0.5c-0.3-0.4-0.6-0.7-1-0.9c-0.6-0.3-1.2-0.4-1.9-0.3
                c0.3,0.4,0.5,0.8,0.9,1.1C77.7,13.6,78.4,13.8,79,14.2C79,14.2,79,14.2,79,14.2z M78.6,27c0.6-0.2,1.1-0.7,1.5-1.3
                c-0.7-0.1-1.4-0.1-2,0.1c-0.5,0.2-1,0.7-1.4,1.2c0.3,0,0.7,0.1,1,0.2C78,27.2,78.3,27.2,78.6,27z M80.3,24.7
                c0.5-0.4,0.9-1,1.2-1.7c-0.7,0-1.4,0.2-1.9,0.6v0c-0.5,0.4-0.9,0.9-1.1,1.5c0.3-0.1,0.7-0.1,1-0.1C79.8,25,80.1,24.9,80.3,24.7z
                M82.1,20.1c-0.6,0.2-1.2,0.5-1.7,1c-0.4,0.5-0.6,1.1-0.7,1.8c0.3-0.1,0.6-0.2,1-0.3c0.3-0.2,0.5-0.4,0.7-0.6
                C81.9,21.5,82.1,20.8,82.1,20.1z M81.5,14.1c-0.5,0.5-0.9,1-1.1,1.7c-0.1,0.2-0.1,0.5-0.1,0.8c0,0.4,0.1,0.8,0.2,1.1
                c0.2-0.3,0.5-0.5,0.7-0.7c0.2-0.3,0.3-0.6,0.4-0.9c0.1-0.2,0.1-0.5,0.1-0.7C81.8,15,81.7,14.6,81.5,14.1z M79.5,13.3
                c0,0.6,0.2,1.2,0.6,1.8c0.1-0.3,0.3-0.6,0.5-0.9c0.1-0.3,0.2-0.6,0.2-0.9c0,0,0,0,0,0c0-0.7-0.2-1.3-0.6-1.9
                C79.8,12,79.5,12.6,79.5,13.3C79.5,13.3,79.5,13.3,79.5,13.3z M77.9,10.4c0,0.2,0,0.5,0.1,0.7c0.1,0.6,0.5,1.1,1,1.6
                c0.1-0.3,0.2-0.7,0.3-1c0-0.1,0-0.1,0-0.2c0-0.2,0-0.4-0.1-0.7c-0.2-0.6-0.5-1.2-1.1-1.7C78,9.5,77.9,9.9,77.9,10.4z M77.6,11.6
                c-0.4-0.3-0.8-0.5-1.2-0.7c-0.6-0.2-1.3-0.1-1.9,0.1c0.3,0.4,0.7,0.7,1.1,0.9c0.7-0.1,1.5-0.1,2.1,0.1c0,0,0.1,0,0.1,0
                C77.7,11.9,77.7,11.8,77.6,11.6z M75.7,7.8c0,0.5,0.1,1,0.3,1.5c0.3,0.6,0.8,1,1.4,1.3c0-0.4,0-0.7,0.1-1.1
                c-0.1-0.3-0.1-0.6-0.3-0.8c-0.3-0.6-0.8-1.1-1.4-1.4C75.7,7.5,75.7,7.6,75.7,7.8z M73.1,8c0.2,0.7,0.6,1.3,1.1,1.6
                c0.5,0.3,1.1,0.5,1.7,0.6c-0.2-0.2-0.3-0.4-0.5-0.7v0c-0.1-0.2-0.2-0.5-0.3-0.7c-0.1-0.1-0.1-0.1-0.2-0.2C74.5,8.2,73.9,8,73.1,8z
                M65.3,23.7c0,0.5,0.4,1.1,1.3,1.1h1.7c-0.2,0.6-0.4,1.5-0.4,2.4c0,1.2,0.2,2.2,0.6,2.9c-1.3-0.2-2.2-0.5-3.1-1l-0.1,0l-0.2,0.5
                l0.1,0c0.8,0.4,1.5,0.6,2.4,0.9c0,0,0.7,0.1,1.2,0.2c-0.1,0.1-0.2,0.3-0.2,0.5c0,0.4,0.3,0.7,0.7,0.7c0.4,0,0.7-0.3,0.7-0.7
                c0-0.2-0.1-0.4-0.2-0.5c0.5-0.1,1.1-0.2,1.1-0.2c0.9-0.2,1.7-0.4,2.5-0.9l0.1,0L73.3,29l-0.1,0c-0.9,0.5-1.8,0.8-3.1,1
                c0.3-0.7,0.6-1.7,0.6-2.9c0-0.9-0.1-1.8-0.4-2.4H72c0.9,0,1.3-0.5,1.3-1.1c0-0.4-0.3-0.8-0.8-0.8c-0.4,0-0.8,0.3-0.8,0.8
                c0,0.1,0,0.2,0.1,0.3c0.1,0.1,0.1,0.3-0.2,0.3h-1l0-12.7c0-1.7-0.1-3.8-1.1-5.8l-0.3-0.6l-0.3,0.6c-1,2-1.1,4.1-1.1,5.8v12.7h-1
                c-0.3,0-0.2-0.2-0.2-0.3c0-0.1,0.1-0.2,0.1-0.3c0-0.4-0.3-0.8-0.7-0.8C65.7,22.9,65.3,23.3,65.3,23.7z M63.2,25.2
                c-0.2-0.4-0.5-0.7-0.9-1c-0.1,0.3-0.2,0.6-0.2,0.9c0,0.3,0.1,0.7,0.2,1c0.1,0.5,0.4,0.8,0.7,1.2c0.1,0,0.3,0.1,0.4,0.1
                c0,0,0-0.1,0-0.1C63.2,26.7,63.1,26,63.2,25.2z M62.6,12.5c-0.6-0.1-1.3,0-1.9,0.3c-0.4,0.2-0.8,0.5-1,0.9c0,0.2,0,0.3-0.1,0.5
                c0,0,0.1,0,0.1,0c0.6-0.4,1.3-0.6,2.1-0.6C62.1,13.3,62.4,12.9,62.6,12.5z M61.9,23.6c-0.1-0.4-0.4-0.8-0.7-1.2
                c-0.3,0.5-0.5,1-0.5,1.6c0,0.1,0,0.2,0,0.3c0,0.5,0.2,0.9,0.5,1.3c0.1,0.1,0.3,0.2,0.4,0.3c0,0,0-0.1,0-0.1
                C61.5,25,61.6,24.4,61.9,23.6z M59.6,22.5c0,0.3,0.1,0.6,0.2,1c0.1,0.1,0.2,0.2,0.3,0.3c0,0,0-0.1,0.1-0.1c0.1-0.7,0.3-1.4,0.7-2
                c0-0.5-0.2-0.9-0.4-1.3c-0.5,0.5-0.8,1.1-0.9,1.7C59.6,22.2,59.6,22.4,59.6,22.5z M60.4,19.7c0.1-0.2,0.1-0.4,0.1-0.6
                c0-0.2-0.1-0.5-0.1-0.7c-0.6,0.4-1,0.8-1.3,1.4c-0.2,0.4-0.2,0.8-0.2,1.2c0,0.1,0,0.1,0,0.2c0.1,0.1,0.2,0.3,0.2,0.4
                c0,0,0.1,0,0.1-0.1C59.4,20.8,59.8,20.2,60.4,19.7z M58.9,16.1c0,0.1,0,0.3,0,0.4c0,0,0.1,0,0.1,0c0.5-0.5,1.1-0.8,1.8-1
                c0.3-0.4,0.5-0.8,0.6-1.2c-0.7,0.1-1.3,0.3-1.8,0.7C59.3,15.2,59,15.7,58.9,16.1z M58.6,18.6c0.1,0.1,0.1,0.3,0.1,0.5
                c0,0,0,0,0.1,0c0.4-0.6,0.9-1.1,1.6-1.4c0.2-0.4,0.3-0.9,0.3-1.4c-0.7,0.2-1.2,0.6-1.6,1.1C58.8,17.7,58.6,18.1,58.6,18.6z
                M58.2,21.1c-0.4-0.5-1-0.8-1.7-1c0.1,0.7,0.3,1.3,0.7,1.8c0.2,0.2,0.5,0.4,0.7,0.6c0.3,0.1,0.6,0.2,0.9,0.3
                C58.8,22.2,58.6,21.6,58.2,21.1z M57.2,23c0.2,0.7,0.6,1.3,1.1,1.7c0.2,0.2,0.5,0.3,0.8,0.4c0.4,0,0.7,0,1,0.1
                c-0.3-0.6-0.6-1.2-1.1-1.5l0,0C58.6,23.2,57.9,23,57.2,23z M58.6,25.8c0.4,0.6,0.8,1,1.5,1.3c0.3,0.1,0.6,0.2,0.9,0.2
                c0.3-0.1,0.7-0.1,1-0.2c-0.4-0.5-0.9-1-1.4-1.2C60,25.6,59.3,25.6,58.6,25.8z M60.6,28.1c0.5,0.5,1.1,0.8,1.8,0.9
                c0.6,0.1,1.3-0.1,1.9-0.3c-0.5-0.5-1.1-0.8-1.8-0.9h0C61.9,27.6,61.2,27.8,60.6,28.1z M65.8,28.7c0-0.1,0-0.1,0-0.2
                c0-0.6-0.2-1.2-0.5-1.7v0c-0.4-0.5-0.9-0.9-1.5-1.2c0,0.1,0,0.1,0,0.2c0,0.6,0.2,1.2,0.5,1.7C64.6,28.1,65.1,28.5,65.8,28.7z
                M63.2,9.5c-0.1,0.2-0.3,0.5-0.5,0.7c0.6,0,1.2-0.2,1.7-0.6c0.5-0.4,0.9-1,1.2-1.6c-0.7,0-1.4,0.2-1.9,0.6
                c-0.1,0.1-0.1,0.1-0.2,0.2C63.4,9,63.3,9.3,63.2,9.5L63.2,9.5z M61.2,9.5c0.1,0.4,0.1,0.7,0.1,1.1c0.6-0.3,1.1-0.8,1.3-1.3
                C62.9,8.8,63,8.3,63,7.8c0-0.2,0-0.3-0.1-0.5c-0.6,0.3-1.1,0.8-1.4,1.4C61.4,9,61.3,9.2,61.2,9.5z M60.9,12.1
                C60.9,12.1,61,12.1,60.9,12.1c0.8-0.2,1.5-0.2,2.2-0.1c0.4-0.2,0.8-0.5,1.1-0.9c-0.6-0.2-1.3-0.3-1.9-0.1
                c-0.5,0.1-0.9,0.3-1.2,0.7C61,11.8,61,11.9,60.9,12.1z M59.3,11.5c0,0.1,0,0.1,0,0.2c0.2,0.3,0.3,0.7,0.3,1c0.5-0.5,0.8-1,1-1.6
                c0.1-0.2,0.1-0.5,0.1-0.7c0-0.4-0.1-0.9-0.3-1.3c-0.5,0.5-0.9,1-1.1,1.7C59.4,11,59.3,11.2,59.3,11.5z M57.9,13.3
                c0,0.3,0.1,0.6,0.2,0.9c0.2,0.3,0.4,0.6,0.5,0.9c0.3-0.5,0.6-1.1,0.6-1.8c0,0,0,0,0,0c0-0.6-0.3-1.3-0.6-1.9
                C58.2,12,57.9,12.6,57.9,13.3C57.9,13.3,57.9,13.3,57.9,13.3z M56.9,15.4c0,0.3,0,0.5,0.1,0.7c0.1,0.3,0.2,0.6,0.4,0.9
                c0.3,0.2,0.5,0.4,0.7,0.7c0.1-0.4,0.2-0.8,0.2-1.1c0-0.3,0-0.5-0.1-0.8c-0.2-0.6-0.6-1.2-1.1-1.7C57,14.5,56.9,15,56.9,15.4z
                M56.4,17.5c0,0.5,0.1,1.1,0.4,1.5c0.1,0.3,0.3,0.5,0.6,0.7c0.3,0.1,0.6,0.3,0.9,0.5c0-0.1,0-0.3,0-0.4c0-0.5-0.1-1-0.4-1.5
                c-0.3-0.6-0.8-1.1-1.5-1.4C56.4,17.2,56.4,17.4,56.4,17.5z M32.1,25.4c0.7-0.5,1.6-0.7,2.7-0.7c1.2,0,2.4,0.2,3.7,0.6
                c1.3,0.3,2.8,0.7,4.2,0.6c0-0.7,0-14.7,0-17.3c0-0.2,0-0.3,0-0.4c-1.5,0.1-3-0.3-4.4-0.6c-1.2-0.3-2.4-0.6-3.4-0.5
                c-1.5,0-2.3,0.5-2.8,0.9v0.6V25.4z M20.8,25.8c1.4,0.1,2.8-0.2,4.2-0.6c1.3-0.3,2.5-0.6,3.7-0.6c1.1,0,2,0.3,2.7,0.7V8.6V8
                c-0.5-0.5-1.3-0.9-2.8-0.9c-1.1,0-2.2,0.2-3.4,0.5c-1.4,0.4-2.8,0.7-4.4,0.6c0,0.1,0,0.2,0,0.4C20.8,11.1,20.8,25.2,20.8,25.8z
                M18.1,28.6c0,0,11.7,0,12.1,0c0.3,0.5,0.8,0.9,1.5,0.9c0.7,0,1.3-0.4,1.5-0.9c0.4,0,12.1,0,12.1,0V8.6h-0.4h-1.1L43.9,9
                c0,0,0,0.1,0,0.1v18.1c-0.9,0-10.7,0-11.2,0c-0.2,0.3-0.4,0.4-1,0.4c-0.5,0-0.7-0.1-0.9-0.4c-0.5,0-9.5,0-11.3,0V9.1
                c0,0,0-0.1,0-0.1l0.1-0.4h-1.5L18.1,28.6z M22.5,68.7L51,43.1l28.6,25.7c1.9-3.6,3.2-7.1,4.3-10.4L51,28.8L18.2,58.3
                C19.2,61.6,20.6,65.1,22.5,68.7z M28.6,20.3c0.7,0,1.3,0.1,1.7,0.3v-0.9c-0.5-0.2-1.1-0.2-1.7-0.3c-1.2,0-2.4,0.3-3.7,0.6
                c-1,0.3-2,0.5-3.1,0.6v0.8c1.1-0.1,2.2-0.4,3.3-0.6C26.4,20.6,27.5,20.3,28.6,20.3z M28.6,22.4c0.7,0,1.3,0.1,1.7,0.3v-0.9
                c-0.5-0.2-1.1-0.3-1.7-0.3c-1.2,0-2.4,0.3-3.7,0.6c-1,0.3-2,0.5-3.1,0.6v0.8c1.1-0.1,2.2-0.4,3.3-0.6
                C26.4,22.6,27.5,22.3,28.6,22.4z M28.6,10.1c0.7,0,1.3,0.2,1.7,0.3V9.5c-0.5-0.2-1.1-0.2-1.7-0.3c-1.2,0-2.4,0.3-3.7,0.6
                c-1,0.3-2,0.5-3.1,0.6v0.8c1.1-0.1,2.2-0.3,3.3-0.6C26.4,10.3,27.5,10.1,28.6,10.1z M38.3,14.8c1,0.3,2.1,0.5,3.3,0.6v-0.8
                c-1-0.1-2.1-0.3-3.1-0.6c-1.3-0.3-2.5-0.6-3.7-0.6c-0.6,0-1.2,0.1-1.7,0.3v0.9c0.4-0.2,1-0.3,1.7-0.3
                C35.9,14.1,37.1,14.4,38.3,14.8z M38.3,10.7c1,0.3,2.1,0.5,3.3,0.6v-0.8c-1-0.1-2.1-0.3-3.1-0.6c-1.3-0.3-2.5-0.6-3.7-0.6
                c-0.6,0-1.2,0.1-1.7,0.3v0.9c0.4-0.2,1-0.3,1.7-0.3C35.9,10.1,37.1,10.3,38.3,10.7z M38.3,18.8c1,0.2,2.2,0.5,3.3,0.6v-0.8
                c-1.1-0.1-2.1-0.3-3.1-0.6c-1.3-0.3-2.5-0.6-3.6-0.6c-0.6,0-1.2,0.1-1.7,0.2v0.9c0.4-0.2,1-0.3,1.7-0.3
                C35.9,18.2,37.1,18.5,38.3,18.8z M38.3,12.7c1,0.3,2.1,0.5,3.3,0.6v-0.8c-1-0.1-2.1-0.3-3.1-0.6c-1.3-0.3-2.5-0.6-3.7-0.6
                c-0.6,0-1.2,0.1-1.7,0.3v0.9c0.4-0.2,1-0.3,1.7-0.3C35.9,12.1,37.1,12.4,38.3,12.7z M38.3,20.9c1,0.3,2.1,0.5,3.3,0.6v-0.8
                c-1-0.1-2.1-0.4-3.1-0.6c-1.3-0.3-2.5-0.6-3.7-0.6c-0.6,0-1.2,0.1-1.7,0.3v0.9c0.4-0.2,1-0.3,1.7-0.3
                C35.9,20.3,37.1,20.6,38.3,20.9z M38.3,22.9c1,0.3,2.1,0.5,3.3,0.6v-0.8c-1-0.1-2.1-0.3-3.1-0.6c-1.3-0.3-2.5-0.6-3.7-0.6
                c-0.6,0-1.2,0.1-1.7,0.3v0.9c0.4-0.2,1-0.3,1.7-0.3C35.9,22.3,37.1,22.6,38.3,22.9z M102.1,65.4l-0.2,0.5
                c-1.9,6.3-5.1,12.6-7.4,16.7L94,83.4l-3.3-3c-0.1,0.2-0.3,0.5-0.4,0.7c-8.4,13.4-20.2,23.1-34.3,28.3l-5,1.8l-5-1.8
                C32,104.3,20.1,94.5,11.8,81.1c-0.1-0.2-0.2-0.5-0.4-0.7l-3.4,3l-0.5-0.9C5.2,78.3,2.1,72,0.1,65.8L0,65.4l8.1-7.3l1-0.9l0.4,1.2
                c0.4,1.5,0.9,2.9,1.4,4.3l2.3-2.1l0.9-0.8l0.4,1.2c1.7,5.1,4,9.9,6.7,14.2c7.1,11.3,17,19.5,28.7,23.8c0,0,0.8,0.3,1.2,0.4
                c0.4-0.1,1.2-0.4,1.2-0.4c11.7-4.3,21.7-12.5,28.7-23.8c2.7-4.3,5-9.1,6.7-14.2l0.4-1.2l3.2,2.9c0.5-1.4,1-2.8,1.4-4.3l0.4-1.2
                L102.1,65.4z M6.7,77.4l-1.5-9.5l4.4-4c-0.5-1.2-0.9-2.5-1.3-3.8c-1.3,1.2-5.8,5.2-6.4,5.8C3.2,69.9,4.9,73.9,6.7,77.4z M10.6,79
                c-1-1.7-2-3.5-2.8-5.3l1.1,6.9C9.2,80.2,9.9,79.6,10.6,79z M94.3,73.7c-0.8,1.8-1.8,3.6-2.8,5.3c0,0,0,0,0,0
                c0.7,0.6,1.3,1.2,1.7,1.6L94.3,73.7z M94.9,68.2c-0.7-0.6-5-4.5-6.2-5.6c-1.7,4.8-3.8,9.4-6.4,13.5c-7.2,11.6-17.4,20-29.5,24.5
                l-1.8,0.6c0,0-1.7-0.6-1.7-0.6c-12.1-4.4-22.2-12.9-29.5-24.5c-2.6-4.1-4.7-8.7-6.4-13.5c-1.3,1.1-5.5,5-6.2,5.6
                c1.6,4.2,3.7,8.3,6,12c8.2,13.1,19.8,22.6,33.5,27.6c0,0,4,1.4,4.4,1.6c0.5-0.2,4.5-1.6,4.5-1.6c13.7-5,25.3-14.6,33.5-27.6
                C91.2,76.6,93.3,72.5,94.9,68.2z M100.2,65.8c-0.6-0.6-5.1-4.6-6.4-5.8c-0.4,1.3-0.8,2.6-1.3,3.8l4.4,4l-1.5,9.6
                C97.1,73.9,98.9,69.9,100.2,65.8z M14,78l0.1,0.4l-0.3,0.2c-0.2-0.3-0.3-0.6-0.5-1c-0.2-0.3-0.4-0.6-0.6-1l0.3-0.1l0.3,0.3
                c0.3-0.3,0.8-0.7,1-1.1l-0.7-1.3l-1.4,0.3l0.1,0.4l-0.2,0.1c-0.1-0.3-0.3-0.5-0.4-0.8c-0.1-0.2-0.2-0.4-0.4-0.7l0.3-0.1l0.3,0.3
                c1,0,3.1-0.4,4.4-0.6c0.2,0.3,0.5,0.5,0.7,0.7l0.1,0.4L15.8,76C15.1,76.7,14.3,77.7,14,78z M14.8,75.3L16,74l0,0l-1.8,0.4
                L14.8,75.3z M22.1,82.7l0.2-0.2c-0.2-0.2-0.3-0.4-0.5-0.7c-0.2-0.2-0.3-0.5-0.5-0.7l-0.3,0.2l0.2,0.4c-0.7,0.5-2.3,1.8-2.3,1.8
                l0,0c0.4-1.2,0.9-2.6,1.4-3.8c-0.2-0.2-0.3-0.4-0.5-0.6c-0.1-0.2-0.3-0.4-0.4-0.6l-0.2,0.2l0.2,0.4c-0.3,0.3-0.6,0.5-1,0.8
                l-1.1,0.8c-0.4,0.3-0.7,0.5-1.1,0.7l-0.3-0.3l-0.2,0.2c0.2,0.2,0.3,0.4,0.5,0.7c0.2,0.2,0.3,0.5,0.5,0.7l0.2-0.2L16.6,82
                c0.7-0.5,1.6-1.2,2.4-1.8l0,0c-0.5,1.2-0.9,2.5-1.4,3.9c0.1,0.1,0.2,0.3,0.3,0.4c0.1,0.1,0.2,0.3,0.3,0.4c0.4-0.3,0.8-0.7,1.4-1.1
                l1.1-0.8c0.4-0.3,0.8-0.5,1.1-0.7L22.1,82.7z M22.5,86.4c-1.1,1-1,2.5-0.1,3.4c0.6,0.6,1.2,1,2.3,1.1l0.1-0.6
                c-0.6-0.1-1.1-0.3-1.4-0.7c-0.7-0.7-0.7-1.7,0.1-2.5c0.8-0.8,1.7-0.5,2.2,0.1c0.3,0.3,0.5,0.7,0.5,1.1L26,88.7l0.2,0.3
                c0.3-0.2,0.7-0.5,1-0.6c-0.2-0.6-0.5-1-0.9-1.5C25.2,85.6,23.6,85.4,22.5,86.4z M32.2,95.6c-0.9,1.1-2.3,1.2-3.7,0.1
                c-1.3-1.1-1.5-2.4-0.5-3.7c0.9-1.1,2.4-1.2,3.7-0.1C33,93,33.2,94.4,32.2,95.6z M31.2,92.5c-0.7-0.6-1.6-0.3-2.3,0.4
                c-0.7,0.8-0.7,1.7,0,2.3c0.7,0.6,1.6,0.3,2.3-0.4C31.8,94,31.9,93,31.2,92.5z M39.2,98.9c-0.3,0.6-1,0.7-1.7,0.4
                c0.1,0.5,0.3,2.2,0.4,2.5l0.1,0.2l-0.2,0.3c-0.4-0.3-0.9-0.5-1.3-0.7c0-0.8-0.1-2-0.2-2.7l-0.3-0.2l-0.2,0.4
                c-0.3,0.4-0.5,0.8-0.6,1.1l0.3,0.3l-0.2,0.3c-0.3-0.2-0.6-0.4-0.9-0.6c-0.3-0.2-0.6-0.4-1-0.6l0.2-0.3l0.4,0.2
                c0.3-0.3,0.5-0.7,0.8-1.1l0.7-1.2c0.3-0.4,0.5-0.8,0.7-1.1l-0.3-0.3l0.2-0.3c0.2,0.2,0.5,0.3,0.7,0.5c0.3,0.2,0.6,0.3,0.9,0.5
                c0.3,0.2,0.6,0.3,0.9,0.5C39.6,97.6,39.6,98.3,39.2,98.9z M37.7,97.2c-0.3-0.2-0.4-0.2-0.6-0.3c-0.1,0.2-0.3,0.5-0.5,0.8L36.4,98
                c0.1,0.1,0.2,0.2,0.3,0.3c0.6,0.4,1.1,0.4,1.4-0.1C38.3,97.8,38.2,97.5,37.7,97.2z M45.3,102.6c-0.1,0.9-0.2,2.2-0.2,2.7l0.3,0.2
                l-0.1,0.3c-0.3-0.2-0.7-0.3-1-0.5c-0.3-0.2-0.7-0.3-1-0.4l0.1-0.3l0.4,0.1c0.1-0.4,0.2-1,0.2-1.4l-1.4-0.6l-0.9,1.1l0.3,0.2
                l-0.1,0.3c-0.3-0.1-0.6-0.3-0.8-0.4c-0.2-0.1-0.5-0.2-0.7-0.3l0.1-0.3l0.4,0.1c0.8-0.6,2.2-2.1,3.2-3.2c0.4,0.1,0.7,0.1,1,0.2
                l0.4,0.3L45.3,102.6z M44.3,100.8L44.3,100.8l-1.2,1.4l1,0.5L44.3,100.8z M59,104.3c-0.2-0.4-0.4-0.7-0.6-1.2l-0.5-1.2
                c-0.2-0.5-0.4-0.8-0.5-1.2l0.4-0.2l-0.1-0.3c-0.3,0.2-0.7,0.3-1,0.5c-0.3,0.1-0.7,0.3-1,0.4l0.1,0.3l0.4-0.1
                c0.2,0.4,0.4,0.7,0.6,1.2l0.5,1.2c0.2,0.5,0.3,0.8,0.5,1.2l-0.4,0.2l0.1,0.3c0.3-0.2,0.7-0.3,1-0.5c0.3-0.1,0.7-0.3,1-0.4
                l-0.1-0.3L59,104.3z M67.6,99.7c-0.2-0.3-0.5-0.7-0.7-1.1l-0.7-1.2c-0.3-0.4-0.5-0.8-0.6-1.1l0.3-0.3l-0.2-0.3
                c-0.3,0.2-0.6,0.4-0.8,0.5c-0.3,0.2-0.6,0.3-0.9,0.5c0.2,0.6,0.6,3,0.7,3.5c-0.5-0.4-2.3-1.8-2.7-2.3c-0.3,0.2-0.6,0.4-0.8,0.5
                c-0.3,0.2-0.6,0.3-0.9,0.5l0.2,0.3l0.4-0.1l0.3,0.6c0.3,0.6,1.4,2.4,1.6,2.9l-0.3,0.3l0.2,0.3c0.2-0.1,0.5-0.3,0.7-0.4
                c0.2-0.1,0.5-0.3,0.7-0.4l-0.2-0.3l-0.4,0.2c-0.2-0.3-0.5-0.7-0.7-1.1l-0.4-0.7c-0.3-0.6-0.6-1-0.7-1.2l0,0
                c1.7,1.5,2.7,2.2,3.1,2.6l0.6-0.4l-0.8-4l0,0c0.1,0.2,0.4,0.6,0.7,1.2l0.4,0.7c0.3,0.4,0.4,0.8,0.6,1.2l-0.3,0.3l0.1,0.3
                c0.3-0.2,0.6-0.4,0.9-0.6c0.3-0.2,0.7-0.4,1-0.6l-0.1-0.3L67.6,99.7z M72.2,96.2c-0.3-0.3-0.6-0.6-0.9-1l-0.6-0.8
                c-0.3-0.3-0.6-0.7-0.8-1.1c0.1-0.1,0.2-0.3,0.4-0.4c0.5-0.4,0.9-0.3,1.2,0c0.3,0.4,0.4,0.9-0.1,1.2c-0.1,0.1-0.2,0.2-0.3,0.2
                l0.2,0.6c0.2-0.1,0.4-0.3,0.6-0.4c1-0.8,1-1.8,0.5-2.5c-0.5-0.6-1.3-0.7-2.1,0c-0.2,0.2-0.4,0.4-0.7,0.6c-0.3,0.3-0.6,0.5-0.8,0.7
                c-0.2,0.2-0.5,0.4-0.8,0.6l0.2,0.2l0.4-0.2c0.3,0.3,0.6,0.6,0.9,1l0.8,1.1c0.3,0.4,0.6,0.7,0.8,1l-0.3,0.3l0.2,0.2
                c0.3-0.2,0.6-0.5,0.9-0.7c0.3-0.2,0.6-0.4,1-0.8l-0.2-0.2L72.2,96.2z M80.1,89l0.2,0.2c-0.3,0.2-0.5,0.5-0.8,0.8
                c-0.3,0.3-0.5,0.6-0.8,0.8l-0.2-0.2l0.2-0.3c-0.3-0.2-0.9-0.5-1.3-0.7l-1.1,1.1l0.7,1.2l0.3-0.2l0.2,0.2c-0.2,0.2-0.4,0.4-0.6,0.6
                c-0.2,0.2-0.4,0.4-0.5,0.6l-0.2-0.2l0.2-0.3c-0.3-0.9-1.3-2.8-1.9-4.1c0.2-0.3,0.4-0.6,0.5-0.9l0.4-0.2l1.8,0.8
                c0.8,0.4,2,0.9,2.4,1L80.1,89z M77,89.3l-1.7-0.8l0,0l0.9,1.6L77,89.3z M85.2,82.5l0.2,0.2c-0.3,0.4-0.6,0.8-0.8,1.2
                c-0.9,0-2.1-0.1-2.8-0.1l-0.2,0.3l0.3,0.3c0.4,0.3,0.7,0.5,1.1,0.7l0.3-0.3l0.3,0.2c-0.2,0.3-0.5,0.6-0.7,0.9
                c-0.2,0.3-0.4,0.6-0.7,0.9l-0.3-0.2l0.2-0.4c-0.3-0.3-0.6-0.5-1-0.8l-1.1-0.8c-0.4-0.3-0.7-0.5-1.1-0.8l-0.3,0.3l-0.3-0.2
                c0.2-0.2,0.4-0.4,0.5-0.7c0.2-0.3,0.4-0.5,0.6-0.8c0.2-0.3,0.4-0.5,0.6-0.8c0.8-1.1,1.5-1,2-0.6c0.5,0.4,0.6,1.1,0.3,1.7
                c0.5,0,2.2-0.1,2.5-0.1L85.2,82.5z M81.5,82.1c-0.3-0.3-0.7-0.2-1,0.3c-0.2,0.2-0.3,0.4-0.4,0.5c0.2,0.1,0.4,0.4,0.8,0.6l0.3,0.2
                c0.1-0.1,0.2-0.2,0.3-0.3C81.9,82.9,81.9,82.5,81.5,82.1z M88.6,77.9c-0.9,1.5-2.2,1.9-3.5,1.1c-1.2-0.7-1.6-2.1-0.7-3.6
                c0.9-1.5,2.1-1.9,3.5-1.1C89.1,74.9,89.5,76.4,88.6,77.9z M87.2,75.4c-0.9-0.5-1.8-0.4-2.3,0.3c-0.5,0.8-0.1,1.6,0.8,2.2
                c0.9,0.5,1.8,0.4,2.3-0.3C88.5,76.8,88.1,75.9,87.2,75.4z M51,103.7c-0.5,0-1,0.5-1,1.1c0,0.6,0.5,1.1,1,1.1
                c0.6,0,1.1-0.5,1.1-1.1C52.1,104.2,51.6,103.7,51,103.7z M12,70.4c0.6,0,1.1-0.5,1.1-1c0-0.6-0.5-1.1-1.1-1.1c-0.6,0-1,0.5-1,1.1
                C11,69.9,11.5,70.4,12,70.4z M90.2,70.4c0.6,0,1.1-0.5,1.1-1c0-0.6-0.5-1.1-1.1-1.1c-0.5,0-1,0.5-1,1.1
                C89.1,69.9,89.6,70.4,90.2,70.4z"/>
        </defs>
        <use xlinkHref="#SVGID_1_"  overflow="visible"/>
        <clipPath id="SVGID_3_">
            <use xlinkHref="#SVGID_1_"  overflow="visible"/>
        </clipPath>
    </g>
    </svg>
);

export default LogoIcon;