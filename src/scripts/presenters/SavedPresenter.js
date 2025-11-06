import { getAllSavedStories, removeSavedStory, getOutboxStories } from '../data/saved-store';

export default class SavedPresenter {
  constructor(view) { this._view = view; }

  async load() {
    const saved = await getAllSavedStories();
    const outbox = await getOutboxStories();
    return { saved, outbox };
  }

  async delete(id) {
    await removeSavedStory(id);
    return this.load();
  }
}