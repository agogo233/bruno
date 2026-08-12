import 'github-markdown-css/github-markdown.css';
import { useTranslation } from 'react-i18next';
import get from 'lodash/get';
import { updateCollectionDocs } from 'providers/ReduxStore/slices/collections';
import { useDispatch } from 'react-redux';
import { saveCollectionSettings } from 'providers/ReduxStore/slices/collections/actions';
import StyledWrapper from './StyledWrapper';
import { IconFileText } from '@tabler/icons';
import Button from 'ui/Button/index';
import { usePersistedState } from 'hooks/usePersistedState';
import { useDocsEditingState } from 'components/Documentation/useDocsEditingState';
import DocsEditor from 'components/Documentation/DocsEditor';

const Docs = ({ collection }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { isEditing, setEditing } = useDocsEditingState();
  const savedDocs = get(collection, 'root.docs', '');
  const docs = collection.draft?.root ? get(collection, 'draft.root.docs', '') : savedDocs;

  // Scroll tracking (both the rich-text preview/edit view and markdown mode's
  // CodeEditor) lives in DocsEditor itself; this just owns the persisted value.
  const [scroll, setScroll] = usePersistedState({ key: `collection-docs-scroll-${collection.uid}`, default: 0 });

  const toggleViewMode = () => {
    setEditing(!isEditing);
  };

  const onEdit = (value) => {
    dispatch(
      updateCollectionDocs({
        collectionUid: collection.uid,
        docs: value
      })
    );
  };

  const handleDiscardChanges = () => {
    dispatch((
      updateCollectionDocs({
        collectionUid: collection.uid,
        docs: savedDocs
      }))
    );
    toggleViewMode();
  };

  const onSave = () => {
    dispatch(saveCollectionSettings(collection.uid));
    toggleViewMode();
  };

  return (
    <StyledWrapper className="h-full w-full relative flex flex-col">
      <div className="flex flex-row w-full justify-between items-center mb-4">
        <div className="text-lg font-medium flex items-center gap-2">
          <IconFileText size={20} strokeWidth={1.5} />
          {t('COLLECTION_SETTINGS.DOCS.TITLE')}
        </div>
        <div className="flex flex-row gap-2 items-center justify-center">
          {isEditing ? (
            <>
              <Button type="button" color="secondary" onClick={handleDiscardChanges}>
                {t('COLLECTION_SETTINGS.DOCS.CANCEL')}
              </Button>
              <Button type="button" onClick={onSave}>
                {t('COLLECTION_SETTINGS.DOCS.SAVE')}
              </Button>
            </>
          ) : null}
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <DocsEditor
          docs={docs}
          onEdit={onEdit}
          onSave={onSave}
          isEditing={isEditing}
          collection={collection}
          collectionPath={collection.pathname}
          emptyPreviewContent={
            t('COLLECTION_SETTINGS.DOCS.PLACEHOLDER_TITLE') + '\n\n' +
            t('COLLECTION_SETTINGS.DOCS.PLACEHOLDER_OVERVIEW') + '\n\n' +
            t('COLLECTION_SETTINGS.DOCS.PLACEHOLDER_BEST_PRACTICES') + '\n\n' +
            t('COLLECTION_SETTINGS.DOCS.PLACEHOLDER_MARKDOWN')
          }
          onRequestEdit={toggleViewMode}
          initialScroll={scroll}
          onScroll={setScroll}
        />
      </div>
    </StyledWrapper>
  );
};

export default Docs;
