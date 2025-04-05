import {createShadowRootUi} from 'wxt/client';
import ReactDOM from 'react-dom/client';
import testBoycottList1 from '@/assets/boycott_lists/test-boycott-list-1.json';
import testBoycottList2 from '@/assets/boycott_lists/test-boycott-list-2.json';
import "~/assets/tailwind.css";
import BoycottPopup from '~/components/BoycottPopup';

const defaultBoycottLists: Record<string, { domain: string; description: string }[]> = {
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
            selectedBoycottList,
            timeoutDuration,
            skippedDomains,
            cachedBoycottLists
        } = await chrome.storage.sync.get({
            isActive: true,
            selectedBoycottList: 'testList1',
            timeoutDuration: '1h',
            skippedDomains: {},
            cachedBoycottLists: defaultBoycottLists,
        });

        console.log('Is active:', isActive);
        console.log('Current domain:', domain);
        console.log('Selected list:', selectedBoycottList);
        console.log('Timeout duration:', timeoutDuration);
        console.log('Skipped domains:', skippedDomains);
        console.log('Using boycott lists:', cachedBoycottLists);

        if (!isActive) {
            console.log('Extension inactive, skipping popup');
            return;
        }

        const activeList = cachedBoycottLists[selectedBoycottList] || cachedBoycottLists['testList1'] || [];
        const entry = activeList.find((item: { domain: string; }) =>
            domain === item.domain || domain.endsWith(`.${item.domain}`)
        );

        if (entry) {
            const now = Date.now();
            const skipData = skippedDomains[domain];
            console.log('Skip data for domain:', skipData, 'Now:', now);

            if (skipData && now < skipData) {
                console.log('Skipping popup due to active timeout');
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
                            description={entry.description}
                            onProceed={() => {
                                const timeoutMs = timeoutDurations[timeoutDuration];
                                const expiry = now + timeoutMs;
                                const updatedSkippedDomains = {...skippedDomains, [domain]: expiry};
                                chrome.storage.sync.set({skippedDomains: updatedSkippedDomains}, () => {
                                    console.log('Set skip timeout for', domain, 'until', expiry);
                                });
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