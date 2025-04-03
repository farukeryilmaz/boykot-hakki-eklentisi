import {createShadowRootUi} from 'wxt/client';
import ReactDOM from 'react-dom/client';
import boycottList from '~/assets/boycott_lists/boycott-list.json';
import BoycottPopup from '~/components/BoycottPopup';

export default defineContentScript({
    matches: ['<all_urls>'],
    cssInjectionMode: 'ui',
    async main(ctx) {
        const domain = window.location.hostname.toLowerCase();
        const entry = boycottList.find(item =>
            domain === item.domain || domain.endsWith(`.${item.domain}`)
        );
        if (entry) {
            // Check if there's a previous page in history
            const canGoBack = window.history.length > 1;

            const ui = await createShadowRootUi(ctx, {
                name: 'boycott-popup',
                position: 'inline',
                anchor: 'body',
                onMount: (container) => {
                    const app = document.createElement('div');
                    container.append(app);
                    const root = ReactDOM.createRoot(app);
                    root.render(
                        <BoycottPopup
                            description={entry.description}
                            onProceed={() => ui.remove()}
                            onClose={() => {
                                if (canGoBack) {
                                    window.history.back();
                                } else {
                                    chrome.runtime.sendMessage({action: 'closeTab'});
                                }
                            }}
                            canGoBack={canGoBack} // Pass this prop to the component
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