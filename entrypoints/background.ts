export default defineBackground(() => {
    chrome.runtime.onMessage.addListener(async (message, sender) => {
        if (message.action === 'closeTab' && sender.tab?.id) {
            await chrome.tabs.remove(sender.tab.id);
        }
    });
});