import NotebookView from './query/NotebookView';
import SearchBar from './query/SearchBar';

/**
 * The main content of the "stream" route (https://hypothes.is/stream)
 */
export default function QueryTab() {
  return (
    <>
      <SearchBar />
      <NotebookView />
    </>
  );
}
