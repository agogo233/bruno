import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { setIsOpeningCollection } from 'providers/ReduxStore/slices/app';
import {
  browseDirectories,
  scanForBrunoFiles,
  openMultipleCollections
} from 'providers/ReduxStore/slices/collections/actions';
import Modal from 'components/Modal';
import Portal from 'components/Portal';
import SelectionList from 'components/SelectionList';
import SelectionFooter from 'components/SelectionFooter';
import SkippedPathsWarning from 'components/SkippedPathsWarning';
import { getRelativePath, normalizePath } from 'utils/common/path';
import StyledWrapper from './StyledWrapper';

const OpenCollectionModal = ({ onClose }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const [showSelection, setShowSelection] = useState(false);
  const [collectionPaths, setCollectionPaths] = useState([]);
  const [skippedCollectionPaths, setSkippedCollectionPaths] = useState([]);
  const [selectedCollectionPaths, setSelectedCollectionPaths] = useState([]);
  const startedRef = useRef(false);
  const notifyOpenResult = (result) => {
    const openedCount = result?.opened?.length || 0;
    const failedCount = (result?.failed?.length || 0) + (result?.invalid?.length || 0);
    if (openedCount > 0) {
      toast.success(openedCount === 1 ? t('SIDEBAR.OPEN_COLLECTION.ADDED') : t('SIDEBAR.OPEN_COLLECTION.ADDED_PLURAL'));
    }
    if (failedCount > 0) {
      toast.error(`${t('SIDEBAR.OPEN_COLLECTION.FAILED')} ${failedCount} collection${failedCount === 1 ? '' : 's'}`);
    }
  };

  useEffect(() => {
    // Guard against opening the picker twice
    if (startedRef.current) return;
    startedRef.current = true;

    (async () => {
      try {
        const dirPaths = await dispatch(browseDirectories());
        if (!Array.isArray(dirPaths) || dirPaths.length === 0) {
          onClose();
          return;
        }

        const scanResults = await Promise.all(
          dirPaths.map((dirPath) =>
            dispatch(scanForBrunoFiles(dirPath))
              .then((res) => ({ dirPath, res }))
              .catch(() => ({ dirPath, res: null }))
          )
        );

        const itemsByPath = new Map();
        const skippedSet = new Set();
        scanResults.forEach(({ dirPath, res }) => {
          (res?.items || []).forEach((item) => {
            if (!itemsByPath.has(item.pathname)) {
              // add basePath so the list item can show its location as a relative path to that folder
              itemsByPath.set(item.pathname, { ...item, basePath: dirPath });
            }
          });
          (res?.skippedItems || []).forEach((skippedPath) => skippedSet.add(skippedPath));
        });

        const items = [...itemsByPath.values()];
        const skippedItems = [...skippedSet];
        const failedScans = scanResults.filter(({ res }) => !res);

        if (items.length === 0) {
          if (failedScans.length) {
            toast.error(t('SIDEBAR.COMMON.ERROR_OPENING'));
          }
          onClose();
          return;
        }

        if (failedScans.length) {
          toast.error(t('SIDEBAR.COMMON.ERROR_OPENING'));
        }

        // If all selected folders are collections, open them directly
        const pickedFolders = new Set(dirPaths.map(normalizePath));
        const noNestedCollections = items.every((item) => pickedFolders.has(normalizePath(item.pathname)));
        if (
          failedScans.length === 0
          && skippedItems.length === 0
          && items.length === pickedFolders.size
          && noNestedCollections
        ) {
          try {
            const result = await dispatch(openMultipleCollections(items.map((item) => item.pathname), { silent: true }));
            notifyOpenResult(result);
          } catch {
            toast.error(t('SIDEBAR.COMMON.ERROR_OPENING'));
          }
          onClose();
          return;
        }

        setCollectionPaths(items);
        setSkippedCollectionPaths(skippedItems);
        setSelectedCollectionPaths([]);
        setShowSelection(true);
      } catch (err) {
        console.error(err);
        toast.error(t('SIDEBAR.COMMON.ERROR_OPENING'));
        onClose();
      }
    })();
  }, []);

  const handleCollectionSelect = (collectionPathname) => {
    setSelectedCollectionPaths((prevSelected) =>
      prevSelected.includes(collectionPathname)
        ? prevSelected.filter((pathname) => pathname !== collectionPathname)
        : [...prevSelected, collectionPathname]
    );
  };

  const handleSelectAllCollections = (e, filteredCollectionPaths) => {
    setSelectedCollectionPaths((prevSelected) =>
      e.target.checked
        ? Array.from(new Set([...prevSelected, ...filteredCollectionPaths]))
        : prevSelected.filter((pathname) => !filteredCollectionPaths.includes(pathname))
    );
  };

  const handleConfirm = async () => {
    if (selectedCollectionPaths.length === 0) {
      return;
    }
    try {
      const result = await dispatch(openMultipleCollections(selectedCollectionPaths, { silent: true }));
      notifyOpenResult(result);
      if (result?.opened?.length) {
        onClose();
      }
    } catch {
      toast.error(t('SIDEBAR.COMMON.ERROR_OPENING'));
    }
  };

  const describeLocation = (collection) => {
    const relative = getRelativePath(collection.basePath, collection.pathname);
    // When the folder itself is the collection, relative resolves to '.' so use its folder name instead.
    return relative === '.' ? normalizePath(collection.pathname).split('/').pop() : relative;
  };

  // Only show the modal if there are collections to select from
  if (!showSelection) {
    return null;
  }

  return (
    <Portal id="open-collection-portal">
      <Modal
        size="md"
        title={t('SIDEBAR.OPEN_COLLECTION.TITLE')}
        confirmText={t('SIDEBAR.OPEN_COLLECTION.OPEN')}
        handleConfirm={handleConfirm}
        handleCancel={onClose}
        confirmDisabled={selectedCollectionPaths.length === 0}
        footerLeft={(
          <SelectionFooter>
            <span>{selectedCollectionPaths.length}</span> of {collectionPaths.length} {t('SIDEBAR.OPEN_COLLECTION.SELECTED')}
          </SelectionFooter>
        )}
      >
        <StyledWrapper>
          <p className="modal-description">
            {t('SIDEBAR.OPEN_COLLECTION.FOUND_HINT')}
          </p>
          <div className="w-full min-w-0 flex flex-col gap-3">
            <SkippedPathsWarning paths={skippedCollectionPaths} itemNoun="collections" />
            <SelectionList
              title={t('SIDEBAR.OPEN_COLLECTION.COLLECTIONS')}
              searchPlaceholder={t('SIDEBAR.OPEN_COLLECTION.SEARCH_COLLECTIONS')}
              items={collectionPaths}
              selectedItems={selectedCollectionPaths}
              onSelectAll={handleSelectAllCollections}
              onItemToggle={handleCollectionSelect}
              getItemId={(collection) => collection.pathname}
              renderItemTitle={(collection) => collection.name}
              renderItemDescription={describeLocation}
              visibleRows={8}
              rowHeight={60}
              rowGap={4}
            />
          </div>
        </StyledWrapper>
      </Modal>
    </Portal>
  );
};

const OpenCollection = () => {
  const dispatch = useDispatch();
  const isOpeningCollection = useSelector((state) => state.app.isOpeningCollection);

  if (!isOpeningCollection) {
    return null;
  }

  return <OpenCollectionModal onClose={() => dispatch(setIsOpeningCollection(false))} />;
};

export default OpenCollection;
