import {useTuiStore} from '../store/tui-store.js';
import {DiffViewer} from '../components/DiffViewer.js';

export const DiffOverlay = () => {
	const diffViewer = useTuiStore(state => state.diffViewer);
	const closeOverlay = useTuiStore(state => state.closeOverlay);

	if (!diffViewer) {
		return null;
	}

	return <DiffViewer {...diffViewer} onClose={closeOverlay} />;
};
