import {createShadowRootUi} from 'wxt/client';
import ReactDOM from 'react-dom/client';
import testBoycottList1 from '@/assets/boycott_lists/test-boycott-list-1.json';
import testBoycottList2 from '@/assets/boycott_lists/test-boycott-list-2.json';
import "~/assets/tailwind.css";
import BoycottPopup from '~/components/BoycottPopup';

const defaultBoycottLists: Record<string, { name: string; items: { domain: string; description: string }[] }> = {
    testList1: testBoycottList1,
    testList2: testBoycottList2,
};

const timeoutDurations: Record<string, number> = {
    '1h': 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
    '1w': 7 * 24 * 60 * 60 * 1000,
};

export default defineContentScript({
    matches: ['<all_urls>'],
    cssInjectionMode: 'ui',
    async main(ctx) {
        const domain = window.location.hostname.toLowerCase();

        const {
            isActive,
            selectedBoycottLists,
            timeoutDuration,
            skippedDomains,
            cachedBoycottLists
        } = await chrome.storage.sync.get({
            isActive: false,
            selectedBoycottLists: [],
            timeoutDuration: '1h',
            skippedDomains: {},
            cachedBoycottLists: defaultBoycottLists,
        });

        if (!isActive) {
            return;
        }

        const activeLists = Array.isArray(selectedBoycottLists) ? selectedBoycottLists : [];
        if (activeLists.length === 0) {
            console.info('Extension is active but no boycott lists are selected');
            return;
        }

        const boycottEntries: { source: string; description: string }[] = [];
        const matchingListNames: string[] = [];

        for (const listName of activeLists) {
            const list = cachedBoycottLists[listName] || defaultBoycottLists[listName] || {name: listName, items: []};
            const entry = list.items.find((item: { domain: string; }) =>
                domain === item.domain || domain.endsWith(`.${item.domain}`)
            );
            if (entry) {
                boycottEntries.push({source: list.name, description: entry.description});
                matchingListNames.push(list.name);
            }
        }

        if (boycottEntries.length > 0) {
            const now = Date.now();
            const skipData = skippedDomains[domain];

            if (skipData && now < skipData) {
                return;
            }

            const canGoBack = window.history.length > 1;
            const ui = await createShadowRootUi(ctx, {
                name: 'boycott-popup',
                position: 'inline',
                anchor: document.documentElement,
                onMount: (container) => {
                    const app = document.createElement('div');
                    container.append(app);
                    const root = ReactDOM.createRoot(app);
                    root.render(
                        <BoycottPopup
                            entries={boycottEntries}
                            matchingListNames={matchingListNames}
                            onProceed={() => {
                                const timeoutMs = timeoutDurations[timeoutDuration];
                                const expiry = now + timeoutMs;
                                const updatedSkippedDomains = {...skippedDomains, [domain]: expiry};
                                chrome.storage.sync.set({skippedDomains: updatedSkippedDomains});
                                ui.remove();
                            }}
                            onClose={() => {
                                if (canGoBack) {
                                    window.history.back();
                                } else {
                                    chrome.runtime.sendMessage({action: 'closeTab'});
                                }
                            }}
                            canGoBack={canGoBack}
                        />
                    );
                    return root;
                },
                onRemove: (root) => {
                    root?.unmount();
                },
            });
            ui.mount();
        }
    },
});