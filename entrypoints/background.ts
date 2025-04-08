export default defineBackground({
    persistent: true,
    main: () => {
        const GITHUB_USERNAME = 'farukeryilmaz';
        const PROJECT_NAME = 'boykot-hakki-eklentisi';
        const BASE_URL = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${PROJECT_NAME}/refs/heads/main/assets/boycott_lists/`;

        // Helper function to fetch a single list
        async function fetchList(baseUrl: string, fileName: string): Promise<{
            name: string;
            items: { domain: string; claim: string; description: string; resources: string; detail_link: string }[]
        } | null> {
            try {
                const response = await fetch(`${baseUrl}${fileName}`);
                if (response.ok) {
                    return await response.json();
                } else {
                    console.info(`Failed to fetch ${fileName} from GitHub; using local list instead`);
                    return null;
                }
            } catch (error) {
                console.info(`Error fetching ${fileName}:`, error);
                return null;
            }
        }

        async function fetchBoycottLists(): Promise<boolean> {
            const boycottLists: Record<string, {
                name: string;
                items: { domain: string; claim: string; description: string; resources: string; detail_link: string }[]
            }> = {};

            const testBoycottList1 = await fetchList(BASE_URL, 'test-boycott-list-1.json');
            if (testBoycottList1) {
                boycottLists['testList1'] = testBoycottList1;
            }

            const testBoycottList2 = await fetchList(BASE_URL, 'test-boycott-list-2.json');
            if (testBoycottList2) {
                boycottLists['testList2'] = testBoycottList2;
            }

            if (Object.keys(boycottLists).length > 0) {
                chrome.storage.sync.set({cachedBoycottLists: boycottLists, lastFetchTime: Date.now()}, () => {
                    console.log('Boycott lists fetched and cached:', boycottLists);
                });
                return true;
            }
            return false;
        }

        // Initial setup on install
        chrome.runtime.onInstalled.addListener(async () => {
            await fetchBoycottLists();
            await chrome.storage.sync.set({fetchActive: true, fetchInterval: '12h', lastFetchTime: Date.now()});
            await chrome.alarms.create('fetchBoycottLists', {periodInMinutes: 12 * 60}); // Default 12h in minutes
        });

        // Periodic fetch based on interval
        chrome.alarms.onAlarm.addListener(async (alarm) => {
            if (alarm.name === 'fetchBoycottLists') {
                const {fetchActive, fetchInterval, lastFetchTime} = await chrome.storage.sync.get({
                    fetchActive: true,
                    fetchInterval: '12h',
                    lastFetchTime: 0
                });

                if (!fetchActive) return;

                const intervalMs = {
                    '4h': 4 * 60 * 60 * 1000,
                    '12h': 12 * 60 * 60 * 1000,
                    '24h': 24 * 60 * 60 * 1000
                }[fetchInterval as '4h' | '12h' | '24h'] || (12 * 60 * 60 * 1000);
                const now = Date.now();
                if (now - lastFetchTime >= intervalMs) {
                    const success = await fetchBoycottLists();
                    console.log(`Periodic fetch ${success ? 'succeeded' : 'failed'}`);
                }
            }
        });

        // Handle manual fetch request from popup
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.action === 'fetchBoycottListsNow') {
                fetchBoycottLists().then((success) => {
                    sendResponse({success});
                }).catch((error) => {
                    console.error('Fetch error:', error);
                    sendResponse({success: false});
                });
                return true; // Keep the message port open for async response
            } else if (message.action === 'closeTab' && sender.tab?.id) {
                chrome.tabs.remove(sender.tab.id).then(() => {
                    sendResponse({success: true});
                }).catch((error) => {
                    console.error('Tab close error:', error);
                    sendResponse({success: false});
                });
                return true; // Keep the message port open for async response
            }
            return false; // Synchronous response for unrecognized messages
        });

        // Check fetch on startup
        chrome.runtime.onStartup.addListener(async () => {
            const {fetchActive, fetchInterval, lastFetchTime} = await chrome.storage.sync.get({
                fetchActive: true,
                fetchInterval: '12h',
                lastFetchTime: 0
            });

            if (!fetchActive) return;

            const intervalMs = {
                '4h': 4 * 60 * 60 * 1000,
                '12h': 12 * 60 * 60 * 1000,
                '24h': 24 * 60 * 60 * 1000
            }[fetchInterval as '4h' | '12h' | '24h'] || (12 * 60 * 60 * 1000);
            const now = Date.now();
            if (now - lastFetchTime >= intervalMs) {
                await fetchBoycottLists();
            }
        });
    },
});