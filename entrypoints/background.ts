export default defineBackground({
    persistent: true,
    main: () => {
        const GITHUB_USERNAME = 'farukeryilmaz';
        const PROJECT_NAME = 'boykot-hakki-eklentisi';
        const BASE_URL = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${PROJECT_NAME}/refs/heads/main/assets/boycott_lists/`;
        const FETCH_PERIOD_IN_MINUTES = 4 * 60; // 4 hours

        // Helper function to fetch a single list
        async function fetchList(baseUrl: string, fileName: string): Promise<{
            domain: string;
            description: string
        }[] | null> {
            const response = await fetch(`${baseUrl}${fileName}`);
            if (response.ok) {
                return await response.json();
            } else {
                console.info(`Failed to fetch ${fileName} from GitHub; using local list instead`);
                return null;
            }
        }

        async function fetchBoycottLists(): Promise<void> {
            const boycottLists: Record<string, { domain: string; description: string }[]> = {};

            const testBoycottList1 = await fetchList(BASE_URL, 'test-boycott-list-1.json');
            if (testBoycottList1) {
                boycottLists['testList1'] = testBoycottList1;
            }

            const testBoycottList2 = await fetchList(BASE_URL, 'test-boycott-list-2.json');
            if (testBoycottList2) {
                boycottLists['testList2'] = testBoycottList2;
            }

            if (Object.keys(boycottLists).length > 0) {
                chrome.storage.sync.set({cachedBoycottLists: boycottLists}, () => {
                    console.log('Boycott lists fetched and cached:', boycottLists);
                });
            }
        }

        chrome.runtime.onInstalled.addListener(async () => {
            await fetchBoycottLists();
            await chrome.alarms.create('fetchBoycottLists', {periodInMinutes: FETCH_PERIOD_IN_MINUTES});
        });

        chrome.alarms.onAlarm.addListener((alarm) => {
            if (alarm.name === 'fetchBoycottLists') {
                fetchBoycottLists().catch((error) => console.info('Hourly fetch failed:', error));
            }
        });

        chrome.runtime.onMessage.addListener(async (message, sender) => {
            if (message.action === 'closeTab' && sender.tab?.id) {
                await chrome.tabs.remove(sender.tab.id);
            }
        });
    },
});