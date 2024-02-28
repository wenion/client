// import domtoimage from 'dom-to-image';

export const ADDITIONAL_TAG = 'Additional relevant knowledge available!';

export function extractHostURL(locationHash: string) {
    const decodedString = decodeURIComponent(locationHash).split("#config=")[1];
    try {
        const message = JSON.parse(decodedString);
        return message.hostURL
    } catch (err) {
        return ''
    }
}

export async function generateImage(element: HTMLElement): Promise<string| null> {
    // try {
    //     const encodePng = await domtoimage.toPng(element);
    //     if (encodePng.length < 100) {
    //         console.error('oops, image too small')
    //         return null
    //     }
    //     return encodePng;
    // } catch (err) {
    //     console.error('oops, something went wrong!', err);
    //     return null
    // }
    return null;
}
