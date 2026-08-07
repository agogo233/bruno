import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import Modal from 'components/Modal';
import SearchInput from 'components/SearchInput';
import Button from 'ui/Button';
import { IconFolder, IconChevronRight, IconCheck, IconX, IconEye, IconEyeOff, IconEdit, IconArrowBackUp } from '@tabler/icons';
import PathDisplay from 'components/PathDisplay/index';
import Help from 'components/Help';
import filter from 'lodash/filter';
import toast from 'react-hot-toast';
import StyledWrapper from './StyledWrapper';
import CollectionListItem from './CollectionListItem';
import FolderBreadcrumbs from './FolderBreadcrumbs';
import useCollectionFolderTree from 'hooks/useCollectionFolderTree';
import { removeSaveTransientRequestModal } from 'providers/ReduxStore/slices/collections';
import { insertTaskIntoQueue } from 'providers/ReduxStore/slices/app';
import { newFolder, closeTabs, mountCollection, createCollection, browseDirectory } from 'providers/ReduxStore/slices/collections/actions';
import { sanitizeName, validateName, validateNameError } from 'utils/common/regex';
import { resolveRequestFilename } from 'utils/common/platform';
import path, { normalizePath } from 'utils/common/path';
import { transformRequestToSaveToFilesystem, findCollectionByUid, findItemInCollection, areItemsLoading } from 'utils/collections';
import { DEFAULT_COLLECTION_FORMAT } from 'utils/common/constants';
import { itemSchema } from '@usebruno/schema';
import { uuid } from 'utils/common';
import { formatIpcError } from 'utils/common/error';
import get from 'lodash/get';

const SaveTransientRequest = ({ item: itemProp, collection: collectionProp, isOpen = false, onClose, closeAfterSave = false }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const latestCollection = useSelector((state) =>
    collectionProp ? findCollectionByUid(state.collections.collections, collectionProp.uid) : null
  );
  const latestItem = latestCollection && itemProp ? findItemInCollection(latestCollection, itemProp.uid) : itemProp;

  const item = itemProp;
  const collection = collectionProp;

  const { workspaces, activeWorkspaceUid } = useSelector((state) => state.workspaces);
  const activeWorkspace = workspaces.find((w) => w.uid === activeWorkspaceUid);
  const allCollections = useSelector((state) => state.collections.collections);
  const isScratchCollection = activeWorkspace?.scratchCollectionUid === collection?.uid;
  const preferences = useSelector((state) => state.app.preferences);
  const isDefaultWorkspace = activeWorkspace?.type === 'default';
  const defaultCollectionLocation = isDefaultWorkspace
    ? get(preferences, 'general.defaultLocation', '')
    : (activeWorkspace?.pathname ? path.join(activeWorkspace.pathname, 'collections') : '');

  const availableCollections = useMemo(() => {
    if (!isScratchCollection || !activeWorkspace) return [];

    return (activeWorkspace.collections || []).map((wc) => {
      const fullCollection = allCollections.find((c) => normalizePath(c.pathname) === normalizePath(wc.path));
      // Use stable deterministic UID based on path to avoid duplicate Redux entries
      const stableUid = wc.path ? `pending-${wc.path.replace(/[^a-zA-Z0-9]/g, '-')}` : uuid();
      return fullCollection || { ...wc, uid: stableUid, mountStatus: 'unmounted' };
    }).filter((c) => !workspaces.some((w) => w.scratchCollectionUid === c.uid));
  }, [isScratchCollection, activeWorkspace, allCollections, workspaces]);

  const handleClose = () => {
    if (onClose) {
      onClose();
      return;
    }
    dispatch(removeSaveTransientRequestModal({ itemUid: item.uid }));
  };
  const [requestName, setRequestName] = useState(item?.name || '');
  const [searchText, setSearchText] = useState('');
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDirectoryName, setNewFolderDirectoryName] = useState('');
  const [showFilesystemName, setShowFilesystemName] = useState(false);
  const [isEditingFolderFilename, setIsEditingFolderFilename] = useState(false);
  const [pendingFolderNavigation, setPendingFolderNavigation] = useState(null);

  // State for new collection creation
  const [newCollection, setNewCollection] = useState({ show: false, name: '', location: '', format: DEFAULT_COLLECTION_FORMAT });

  const [selectedTargetCollectionPath, setSelectedTargetCollectionPath] = useState(null);
  const [isSelectingCollection, setIsSelectingCollection] = useState(isScratchCollection);
  const folderTreeCollectionUid = selectedTargetCollectionPath
    ? availableCollections.find((c) => (c.path || c.pathname) === selectedTargetCollectionPath)?.uid
    : collection?.uid;

  const selectedTargetCollection = selectedTargetCollectionPath
    ? availableCollections.find((c) => (c.path || c.pathname) === selectedTargetCollectionPath)
    : null;

  useEffect(() => {
    const isMounted = selectedTargetCollection?.mountStatus === 'mounted';
    const isFullyLoaded = isMounted && !areItemsLoading(selectedTargetCollection);
    if (selectedTargetCollectionPath && isFullyLoaded) {
      setIsSelectingCollection(false);
    }
  }, [selectedTargetCollectionPath, selectedTargetCollection]);

  const {
    currentFolders,
    breadcrumbs,
    selectedFolderUid,
    navigateIntoFolder,
    navigateToRoot,
    navigateToBreadcrumb,
    getCurrentParentFolder,
    getCurrentSelectedFolder,
    reset,
    isAtRoot
  } = useCollectionFolderTree(folderTreeCollectionUid);

  const resetForm = useCallback(() => {
    setRequestName(item?.name || '');
    setSearchText('');
    reset();
    setShowNewFolderInput(false);
    setNewFolderName('');
    setNewFolderDirectoryName('');
    setShowFilesystemName(false);
    setIsEditingFolderFilename(false);
    setPendingFolderNavigation(null);
    setSelectedTargetCollectionPath(null);
    setIsSelectingCollection(isScratchCollection);
    // Reset new collection state
    setNewCollection({ show: false, name: '', location: '', format: DEFAULT_COLLECTION_FORMAT });
  }, [item?.name, isScratchCollection, reset]);

  useEffect(() => {
    if (isOpen && item) {
      resetForm();
    }
  }, [isOpen, item, resetForm]);

  useEffect(() => {
    if (pendingFolderNavigation) {
      const newFolder = currentFolders.find((f) => f.filename === pendingFolderNavigation);
      if (newFolder) {
        navigateIntoFolder(newFolder.uid);
        setPendingFolderNavigation(null);
      }
    }
  }, [currentFolders, pendingFolderNavigation, navigateIntoFolder]);

  const filteredFolders = useMemo(() => {
    if (!searchText.trim()) {
      return currentFolders;
    }
    const searchLower = searchText.toLowerCase();
    return filter(currentFolders, (folder) => folder.name.toLowerCase().includes(searchLower));
  }, [currentFolders, searchText]);

  const handleCancel = () => {
    resetForm();
    handleClose();
  };

  const handleSelectCollection = useCallback((selectedCollection) => {
    const collectionPath = selectedCollection.path || selectedCollection.pathname;
    const isMounted = selectedCollection.mountStatus === 'mounted';
    const isFullyLoaded = isMounted && !areItemsLoading(selectedCollection);

    setSelectedTargetCollectionPath(collectionPath);

    if (isFullyLoaded) {
      setIsSelectingCollection(false);
      return;
    }

    if (!isMounted && selectedCollection.mountStatus !== 'mounting') {
      dispatch(
        mountCollection({
          collectionUid: selectedCollection.uid || uuid(),
          collectionPathname: collectionPath,
          brunoConfig: selectedCollection.brunoConfig
        })
      );
    }
  }, [dispatch]);

  const handleConfirm = async () => {
    if (!item || !collection || !latestItem) {
      return;
    }

    const targetCollection = selectedTargetCollection || collection;

    try {
      const { ipcRenderer } = window;

      const selectedFolder = getCurrentSelectedFolder();
      const targetDirname = selectedFolder ? selectedFolder.pathname : targetCollection.pathname;

      const trimmedName = requestName.trim();
      if (!trimmedName || trimmedName.length === 0) {
        toast.error(t('SAVE_TRANSIENT.REQUEST_NAME_REQUIRED'));
        return;
      }

      if (!validateName(trimmedName)) {
        toast.error(validateNameError(trimmedName));
        return;
      }

      const sanitizedFilename = sanitizeName(trimmedName);

      const hasFileModeEdit = latestItem.draft?.raw != null && latestItem.draft.raw !== latestItem.raw;
      let baseItem;
      if (hasFileModeEdit) {
        const rawSourceFormat = collection.format || DEFAULT_COLLECTION_FORMAT;
        try {
          const parsed = await ipcRenderer.invoke(
            'renderer:convert-to-json',
            latestItem,
            latestItem.draft.raw,
            rawSourceFormat
          );
          baseItem = { ...latestItem, ...parsed, uid: latestItem.uid, pathname: latestItem.pathname };
        } catch (err) {
          toast.error(formatIpcError(err) || 'Invalid request content - fix it in file mode before saving');
          return;
        }
      } else {
        baseItem = latestItem.draft ? { ...latestItem, ...latestItem.draft } : { ...latestItem };
      }

      const itemToSave = { ...baseItem };
      itemToSave.name = sanitizedFilename;
      delete itemToSave.draft;
      delete itemToSave.raw;

      const transformedItem = transformRequestToSaveToFilesystem(itemToSave);
      await itemSchema.validate(transformedItem);

      const targetFormat = targetCollection.format || DEFAULT_COLLECTION_FORMAT;
      const sourceFormat = collection.format || DEFAULT_COLLECTION_FORMAT;
      const targetFilename = resolveRequestFilename(sanitizedFilename, targetFormat);
      const targetPathname = path.join(targetDirname, targetFilename);

      await ipcRenderer.invoke('renderer:save-transient-request', {
        sourcePathname: item.pathname,
        targetDirname,
        targetFilename,
        request: transformedItem,
        format: targetFormat,
        sourceFormat
      });

      if (!closeAfterSave) {
        dispatch(
          insertTaskIntoQueue({
            uid: uuid(),
            type: 'OPEN_REQUEST',
            collectionUid: targetCollection.uid,
            itemPathname: targetPathname,
            preview: false
          })
        );
      }

      dispatch(closeTabs({ tabUids: [item.uid] }));

      dispatch({
        type: 'collections/deleteItem',
        payload: {
          itemUid: item.uid,
          collectionUid: collection.uid
        }
      });

      toast.success(t('SAVE_TRANSIENT.REQUEST_SAVED'));
      handleClose();
    } catch (err) {
      toast.error(formatIpcError(err) || t('SAVE_TRANSIENT.FAILED_SAVE_REQUEST'));
      console.error('Error saving request:', err);
    }
  };

  const handleShowNewFolder = () => {
    setShowNewFolderInput(true);
    setNewFolderName('');
    setNewFolderDirectoryName('');
    setShowFilesystemName(false);
    setIsEditingFolderFilename(false);
  };

  const handleCancelNewFolder = () => {
    setShowNewFolderInput(false);
    setNewFolderName('');
    setNewFolderDirectoryName('');
    setShowFilesystemName(false);
    setIsEditingFolderFilename(false);
  };

  const handleNewFolderNameChange = (value) => {
    setNewFolderName(value);
    if (!isEditingFolderFilename) {
      setNewFolderDirectoryName(sanitizeName(value));
    }
  };

  const handleCreateNewFolder = async () => {
    const trimmedFolderName = newFolderName.trim();

    if (!trimmedFolderName) {
      toast.error(t('SAVE_TRANSIENT.FOLDER_NAME_REQUIRED'));
      return;
    }

    if (!validateName(trimmedFolderName)) {
      toast.error(validateNameError(trimmedFolderName));
      return;
    }

    const directoryName = newFolderDirectoryName.trim() || sanitizeName(trimmedFolderName);
    const parentFolder = getCurrentParentFolder();
    const targetCollectionUid = selectedTargetCollection?.uid || collection?.uid;

    try {
      await dispatch(newFolder(trimmedFolderName, directoryName, targetCollectionUid, parentFolder?.uid));
      toast.success(t('SAVE_TRANSIENT.FOLDER_CREATED'));

      setPendingFolderNavigation(directoryName);
      handleCancelNewFolder();
    } catch (err) {
      const errorMessage = err?.message || t('SAVE_TRANSIENT.ERROR_ADD_FOLDER');
      toast.error(errorMessage);
    }
  };

  // New Collection handlers
  const handleShowNewCollection = () => {
    setNewCollection({ show: true, name: '', location: defaultCollectionLocation, format: DEFAULT_COLLECTION_FORMAT });
  };

  const handleCancelNewCollection = () => {
    setNewCollection({ show: false, name: '', location: '', format: DEFAULT_COLLECTION_FORMAT });
  };

  const handleBrowseCollectionLocation = () => {
    dispatch(browseDirectory())
      .then((dirPath) => {
        if (typeof dirPath === 'string') {
          setNewCollection((prev) => ({ ...prev, location: dirPath }));
        }
      })
      .catch(() => {});
  };

  const handleCreateNewCollection = async () => {
    const trimmedName = newCollection.name.trim();
    if (!trimmedName) {
      toast.error(t('SAVE_TRANSIENT.COLLECTION_NAME_REQUIRED'));
      return;
    }
    if (!validateName(trimmedName)) {
      toast.error(validateNameError(trimmedName));
      return;
    }
    if (!newCollection.location) {
      toast.error(t('SAVE_TRANSIENT.LOCATION_REQUIRED'));
      return;
    }
    try {
      await dispatch(createCollection(trimmedName, sanitizeName(trimmedName), newCollection.location, { format: newCollection.format, source: 'save-transient-request', entryPoint: 'save-transient-request' }));
      toast.success('Collection created!');
      handleCancelNewCollection();
    } catch (err) {
      toast.error(err?.message || t('SAVE_TRANSIENT.ERROR_CREATE_COLLECTION'));
    }
  };

  const handleFolderClick = (folderUid) => {
    navigateIntoFolder(folderUid);
    setSearchText('');
  };

  const handleBreadcrumbNavigate = useCallback((index) => {
    navigateToBreadcrumb(index);
    setSearchText('');
  }, [navigateToBreadcrumb]);

  if (!isOpen) {
    return null;
  }

  const showNewFolderFooterButton = !showNewFolderInput && !isSelectingCollection && (filteredFolders.length > 0 && !searchText.trim());

  return (
    <StyledWrapper>
      <Modal
        size="sm"
        title={isSelectingCollection ? t('SAVE_TRANSIENT.SELECT_COLLECTION') : t('SAVE_TRANSIENT.SAVE_REQUEST')}
        handleCancel={handleCancel}
        handleConfirm={handleConfirm}
        confirmText={t('SAVE_TRANSIENT.SAVE')}
        cancelText={t('SAVE_TRANSIENT.CANCEL')}
        hideFooter={true}
        dataTestId="save-transient-request-modal"
      >
        <div className="save-request-form">
          <div className="form-section">
            <label htmlFor="request-name" className="form-label">
              {t('SAVE_TRANSIENT.REQUEST_NAME')}
            </label>
            <input
              id="request-name"
              data-testid="save-transient-request-name"
              type="text"
              className="form-input textbox"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              value={requestName}
              onChange={(e) => setRequestName(e.target.value)}
              autoFocus={!isSelectingCollection}
              onFocus={(e) => e.target.select()}
            />
          </div>

          <div className="collections-section">
            <div className="collections-label">
              {isSelectingCollection ? t('SAVE_TRANSIENT.SELECT_COLLECTION_TO_SAVE') : t('SAVE_TRANSIENT.SAVE_TO_COLLECTIONS')}
            </div>

            {isScratchCollection && (
              <div className="collection-name">
                <span
                  className={isSelectingCollection ? '' : 'collection-name-breadcrumb'}
                  onClick={!isSelectingCollection ? () => {
                    setIsSelectingCollection(true);
                    setSelectedTargetCollectionPath(null);
                    reset();
                  } : undefined}
                >
                  Collections
                </span>
                {!isSelectingCollection && (
                  <>
                    <IconChevronRight size={16} strokeWidth={1.5} className="collection-name-chevron" />
                    <FolderBreadcrumbs
                      collectionName={(selectedTargetCollection || collection).name}
                      breadcrumbs={breadcrumbs}
                      isAtRoot={isAtRoot}
                      onNavigateToRoot={navigateToRoot}
                      onNavigateToBreadcrumb={handleBreadcrumbNavigate}
                    />
                  </>
                )}
              </div>
            )}

            {isSelectingCollection ? (
              <div className="collection-list">
                {availableCollections.length > 0 || newCollection.show ? (
                  <ul className="collection-list-items">
                    {availableCollections.map((coll) => {
                      const collPath = coll.path || coll.pathname;
                      return (
                        <CollectionListItem
                          key={collPath}
                          collectionUid={coll.uid}
                          collectionPath={collPath}
                          collectionName={coll.name}
                          isSelected={selectedTargetCollectionPath === collPath}
                          onSelect={() => handleSelectCollection(coll)}
                        />
                      );
                    })}
                    {newCollection.show && (
                      <li className="new-collection-item">
                        <div className="new-collection-field">
                          <label className="new-collection-label">
                            {t('SAVE_TRANSIENT.COLLECTION_NAME')}
                          </label>
                          <input
                            ref={(node) => node?.focus()}
                            type="text"
                            className="new-collection-input"
                            placeholder={t('SAVE_TRANSIENT.ENTER_COLLECTION_NAME')}
                            value={newCollection.name}
                            onChange={(e) => setNewCollection((prev) => ({ ...prev, name: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                e.stopPropagation();
                                handleCreateNewCollection();
                              } else if (e.key === 'Escape') {
                                e.stopPropagation();
                                handleCancelNewCollection();
                              }
                            }}
                          />
                        </div>

                        <div className="new-collection-field">
                          <label className="new-collection-label flex items-center">
                            {t('SAVE_TRANSIENT.LOCATION')}
                            <Help width={250} placement="top">
                              <p>
                                Bruno stores your collections on your computer's filesystem.
                              </p>
                              <p className="mt-2">
                                Choose the location where you want to store this collection.
                              </p>
                            </Help>
                          </label>
                          <div className="new-collection-location-row">
                            <input
                              type="text"
                              className="new-collection-input cursor-pointer"
                            placeholder={t('SAVE_TRANSIENT.SELECT_LOCATION')}
                            value={newCollection.location}
                              readOnly
                              onClick={handleBrowseCollectionLocation}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              color="secondary"
                              size="sm"
                              rounded="sm"
                              onClick={handleBrowseCollectionLocation}
                            >
                              {t('SAVE_TRANSIENT.BROWSE')}
                            </Button>
                            </div>
                            </div>

                            <div className="new-collection-field">
                            <label className="new-collection-label flex items-center">
                            {t('SAVE_TRANSIENT.FILE_FORMAT')}
                            <Help width={300} placement="top">
                              <p>
                                Choose the file format for storing requests in this collection.
                              </p>
                              <p className="mt-2">
                                <strong>{t('SAVE_TRANSIENT.OPEN_COLLECTION_YAML')}:</strong> {t('SAVE_TRANSIENT.YAML_DESC')}
                              </p>
                              <p className="mt-1">
                                <strong>{t('SAVE_TRANSIENT.BRU')}:</strong> {t('SAVE_TRANSIENT.BRU_DESC')}
                              </p>
                            </Help>
                          </label>
                          <select
                            className="new-collection-select"
                            value={newCollection.format}
                            onChange={(e) => setNewCollection((prev) => ({ ...prev, format: e.target.value }))}
                          >
<option value="yml">{t('SAVE_TRANSIENT.OPEN_COLLECTION_YAML')}</option>
                             <option value="bru">{t('SAVE_TRANSIENT.BRU_FORMAT')}</option>
                          </select>
                        </div>

                        <div className="new-collection-actions-footer">
                          <Button
                            type="button"
                            color="secondary"
                            variant="ghost"
                            size="sm"
                            onClick={handleCancelNewCollection}
                          >
                            {t('SAVE_TRANSIENT.CANCEL')}
                          </Button>
                          <Button
                            type="button"
                            color="primary"
                            size="sm"
                            onClick={handleCreateNewCollection}
                          >
                            {t('SAVE_TRANSIENT.CREATE')}
                          </Button>
                        </div>
                      </li>
                    )}
                  </ul>
                ) : (
                  <div className="collection-empty-state">
                    <p>{t('SAVE_TRANSIENT.NO_COLLECTIONS_YET')}</p>
                    <p className="collection-empty-state-subtitle">{t('SAVE_TRANSIENT.NO_COLLECTIONS_YET_HINT')}</p>
                    <Button
                      type="button"
                      color="primary"
                      variant="outline"
                      icon={<IconFolder size={16} strokeWidth={1.5} />}
                      onClick={handleShowNewCollection}
                      className="mt-4"
                    >
                      {t('SAVE_TRANSIENT.NEW_COLLECTION')}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <>
                {!isScratchCollection && (selectedTargetCollection || collection) && (
                  <div className="collection-name">
                    <FolderBreadcrumbs
                      collectionName={(selectedTargetCollection || collection).name}
                      breadcrumbs={breadcrumbs}
                      isAtRoot={isAtRoot}
                      onNavigateToRoot={navigateToRoot}
                      onNavigateToBreadcrumb={handleBreadcrumbNavigate}
                    />
                  </div>
                )}

                <div className="search-container">
                  <SearchInput
                    searchText={searchText}
                    setSearchText={setSearchText}
                    placeholder={t('SAVE_TRANSIENT.SEARCH_FOLDER')}
                    autoFocus={false}
                  />
                </div>

                <div className="folder-list">
                  {filteredFolders.length > 0 || showNewFolderInput ? (
                    <ul className="folder-list-items">
                      {filteredFolders.map((folder) => (
                        <li
                          key={folder.uid}
                          className={`folder-item ${selectedFolderUid === folder.uid ? 'selected' : ''}`}
                          onClick={() => handleFolderClick(folder.uid)}
                        >
                          <div className="folder-item-content">
                            <IconFolder size={16} strokeWidth={1.5} />
                            <span className="folder-item-name">{folder.name}</span>
                          </div>
                          <IconChevronRight size={16} strokeWidth={1.5} />
                        </li>
                      ))}
                      {showNewFolderInput && (
                        <li className="new-folder-item">
                          <div className="new-folder-header">
                            <IconFolder size={16} strokeWidth={1.5} />
                            <label className="new-folder-header-label">
                              {showFilesystemName ? t('SAVE_TRANSIENT.NEW_FOLDER_NAME_BRUNO') : t('SAVE_TRANSIENT.NEW_FOLDER_NAME')}
                            </label>
                          </div>
                          <div className="new-folder-input-row">
                            <input
                              ref={(node) => node?.focus()}
                              type="text"
                              className="new-folder-input"
                              placeholder={t('SAVE_TRANSIENT.UNTITLED_NEW_FOLDER')}
                              value={newFolderName}
                              onChange={(e) => handleNewFolderNameChange(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleCreateNewFolder();
                                } else if (e.key === 'Escape') {
                                  e.stopPropagation();
                                  handleCancelNewFolder();
                                }
                              }}
                            />
                            <div className="new-folder-actions">
                              <button
                                type="button"
                                className="new-folder-action-btn"
                                onClick={handleCancelNewFolder}
                                title={t('SAVE_TRANSIENT.CANCEL')}
                              >
                                <IconX size={16} strokeWidth={1.5} />
                              </button>
                              <button
                                type="button"
                                className="new-folder-action-btn"
                                onClick={handleCreateNewFolder}
                                title={t('SAVE_TRANSIENT.CREATE_FOLDER')}
                              >
                                <IconCheck size={16} strokeWidth={1.5} />
                              </button>
                            </div>
                          </div>

                          {showFilesystemName && (
                            <div className="new-folder-filesystem-wrapper">
                              <div className="flex items-center justify-between">
                                <label className="new-folder-filesystem-label flex items-center font-medium">
                                    {t('SAVE_TRANSIENT.FOLDER_NAME')} <small className="font-normal text-muted ml-1">{t('SAVE_TRANSIENT.ON_FILESYSTEM')}</small>
                                  <Help width={300} placement="top">
                                    <p>
                                      You can choose to save the folder as a different name on your file system versus what is displayed in the app.
                                    </p>
                                  </Help>
                                </label>
                                {isEditingFolderFilename ? (
                                  <IconArrowBackUp
                                    className="cursor-pointer opacity-50 hover:opacity-80"
                                    size={16}
                                    strokeWidth={1.5}
                                    onClick={() => setIsEditingFolderFilename(false)}
                                  />
                                ) : (
                                  <IconEdit
                                    className="cursor-pointer opacity-50 hover:opacity-80"
                                    size={16}
                                    strokeWidth={1.5}
                                    onClick={() => setIsEditingFolderFilename(true)}
                                  />
                                )}
                              </div>
                              {isEditingFolderFilename ? (
                                <div className="relative flex flex-row gap-1 items-center justify-between">
                                  <input
                                    type="text"
                                    className="block textbox mt-2 w-full"
                                    placeholder={t('SAVE_TRANSIENT.FOLDER_NAME')}
                                    value={newFolderDirectoryName}
                                    autoComplete="off"
                                    autoCorrect="off"
                                    autoCapitalize="off"
                                    spellCheck="false"
                                    onChange={(e) => setNewFolderDirectoryName(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleCreateNewFolder();
                                      } else if (e.key === 'Escape') {
                                        e.stopPropagation();
                                        handleCancelNewFolder();
                                      }
                                    }}
                                  />
                                </div>
                              ) : (
                                <div className="relative flex flex-row gap-1 items-center justify-between">
                                  <PathDisplay
                                    iconType="folder"
                                    baseName={newFolderDirectoryName}
                                  />
                                </div>
                              )}
                            </div>
                          )}

                          <button
                            type="button"
                            className="new-folder-toggle-filesystem-btn"
                            onClick={() => {
                              setShowFilesystemName(!showFilesystemName);
                              setNewFolderDirectoryName(sanitizeName(newFolderName));
                              setIsEditingFolderFilename(false);
                            }}
                          >
                            {showFilesystemName ? (
                              <>
                                <IconEyeOff size={16} strokeWidth={1.5} />
                                  <span>{t('SAVE_TRANSIENT.HIDE_FS_NAME')}</span>
                              </>
                            ) : (
                              <>
                                <IconEye size={16} strokeWidth={1.5} />
                                  <span>{t('SAVE_TRANSIENT.SHOW_FS_NAME')}</span>
                              </>
                            )}
                          </button>
                        </li>
                      )}
                    </ul>
                  ) : (
                    <div className="folder-empty-state">
                      <div className="flex flex-col items-center">
                        <span>
                          {searchText.trim() ? t('SAVE_TRANSIENT.NO_FOLDERS_FOUND') : t('SAVE_TRANSIENT.NO_FOLDERS_AVAILABLE') }
                        </span>
                        <Button
                          type="button"
                          color="primary"
                          variant="ghost"
                          icon={<IconFolder size={16} strokeWidth={1.5} />}
                          onClick={handleShowNewFolder}
                        >
                          {t('SAVE_TRANSIENT.NEW_FOLDER')}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="custom-modal-footer">
          <div className="footer-left">
            {showNewFolderFooterButton && (
              <Button
                type="button"
                color="primary"
                variant="ghost"
                icon={<IconFolder size={16} strokeWidth={1.5} />}
                onClick={handleShowNewFolder}
              >
                {t('SAVE_TRANSIENT.NEW_FOLDER')}
              </Button>
            )}
            {isSelectingCollection && !newCollection.show && availableCollections.length > 0 && (
              <Button
                type="button"
                color="primary"
                variant="ghost"
                icon={<IconFolder size={16} strokeWidth={1.5} />}
                onClick={handleShowNewCollection}
              >
                {t('SAVE_TRANSIENT.NEW_COLLECTION')}
              </Button>
            )}
          </div>
          <div className="footer-right">
            <Button type="button" color="secondary" variant="ghost" onClick={handleCancel}>
              {t('SAVE_TRANSIENT.CANCEL')}
            </Button>
            {!isSelectingCollection && (
              <Button type="button" color="primary" onClick={handleConfirm} data-testid="save-transient-request-submit">
                {t('SAVE_TRANSIENT.SAVE')}
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </StyledWrapper>
  );
};

export default SaveTransientRequest;
