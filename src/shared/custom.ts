export const ADDITIONAL_TAG = 'Additional relevant knowledge available!';

export function extractHostURL(locationHash: string) {
    const decodedString = decodeURIComponent(locationHash);
    const message = JSON.parse(decodedString.split("#config=")[1]);
    if (message && message.hostURL) {
        return message.hostURL
    }
    return ''
}
