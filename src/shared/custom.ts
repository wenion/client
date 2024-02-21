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
