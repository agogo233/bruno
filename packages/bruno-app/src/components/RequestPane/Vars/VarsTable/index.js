import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from 'providers/Theme';
import { moveVar, setRequestVars } from 'providers/ReduxStore/slices/collections';
import { sendRequest, saveRequest } from 'providers/ReduxStore/slices/collections/actions';
import { updateTableColumnWidths } from 'providers/ReduxStore/slices/tabs';
import MultiLineEditor from 'components/MultiLineEditor';
import InfoTip from 'components/InfoTip';
import DataTypeSelector from 'components/DataTypeSelector';
import VarValueCell from 'components/VarValueCell';
import { valueToString } from '@usebruno/common/utils';
import EditableTable from 'components/EditableTable';
import { createDescriptionColumn } from 'components/EditableTable/descriptionColumn';
import StyledWrapper from './StyledWrapper';
import toast from 'react-hot-toast';
import { variableNameRegex } from 'utils/common/regex';
import { useTranslation } from 'react-i18next';

const VarsTable = ({ item, collection, vars, varType, initialScroll = 0, isDraft }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { storedTheme } = useTheme();
  const tabs = useSelector((state) => state.tabs.tabs);
  const activeTabUid = useSelector((state) => state.tabs.activeTabUid);

  // Get column widths from Redux
  const focusedTab = tabs?.find((t) => t.uid === activeTabUid);
  const varsWidths = focusedTab?.tableColumnWidths?.['request-vars'] || {};

  const handleColumnWidthsChange = (tableId, widths) => {
    dispatch(updateTableColumnWidths({ uid: activeTabUid, tableId, widths }));
  };

  const onSave = () => dispatch(saveRequest(item.uid, collection.uid));
  const handleRun = () => dispatch(sendRequest(item, collection.uid));

  const handleVarsChange = useCallback((updatedVars) => {
    dispatch(setRequestVars({
      collectionUid: collection.uid,
      itemUid: item.uid,
      vars: updatedVars,
      type: varType
    }));
  }, [dispatch, collection.uid, item.uid, varType]);

  const handleVarDrag = useCallback(({ updateReorderedItem }) => {
    dispatch(moveVar({
      type: varType,
      collectionUid: collection.uid,
      itemUid: item.uid,
      updateReorderedItem
    }));
  }, [dispatch, varType, collection.uid, item.uid]);

  const getRowError = useCallback((row, index, key) => {
    if (key !== 'name') return null;
    if (!row.name || row.name.trim() === '') return null;
    if (!variableNameRegex.test(row.name)) {
      return t('REQUEST_PANE.VARS.INVALID_CHARS');
    }
    return null;
  }, [t]);

  const descriptionColumn = createDescriptionColumn({
    theme: storedTheme,
    onSave,
    onRun: handleRun,
    collection,
    item,
    nameFromRowIndex: true
  });

  const columns = [
    {
      key: 'name',
      name: t('REQUEST_PANE.VARS.NAME'),
      isKeyField: true,
      sortable: true,
      placeholder: t('REQUEST_PANE.VARS.NAME'),
      width: '20%'
    },
    {
      key: 'value',
      name: varType === 'request' ? t('REQUEST_PANE.VARS.VALUE') : (
        <div className="flex items-center">
          <span>{t('REQUEST_PANE.VARS.EXPR')}</span>
          <InfoTip className="tooltip-mod" content={t('REQUEST_PANE.VARS.EXPR_HINT')} infotipId={`request-${varType}-var`} />
        </div>
      ),
      placeholder: varType === 'request' ? t('REQUEST_PANE.VARS.VALUE') : t('REQUEST_PANE.VARS.EXPR'),
      render: ({ row, value, onChange, isLastEmptyRow, rowIndex }) => (
        <VarValueCell
          editor={(
            <MultiLineEditor
              value={valueToString(value)}
              name={`${rowIndex}.value`}
              theme={storedTheme}
              onSave={onSave}
              onChange={onChange}
              onRun={handleRun}
              collection={collection}
              item={item}
              placeholder={value == null || (typeof value === 'string' && value.trim() === '') ? (varType === 'request' ? t('REQUEST_PANE.VARS.VALUE') : t('REQUEST_PANE.VARS.EXPR')) : ''}
            />
          )}
          renderTypeSelector={!isLastEmptyRow && varType === 'request'
            ? ({ compact }) => (
                <DataTypeSelector
                  compact={compact}
                  variable={row}
                  theme={storedTheme}
                  collection={collection}
                  onChange={(fields) => {
                    const updated = (vars || []).map((v) => v.uid === row.uid ? { ...v, ...fields } : v);
                    handleVarsChange(updated);
                  }}
                />
              )
            : null}
        />
      )
    },
    descriptionColumn
  ];

  const defaultRow = {
    name: '',
    value: '',
    description: '',
    ...(varType === 'response' ? { local: false } : {})
  };

  return (
    <StyledWrapper className="w-full">
      <EditableTable
        tableId="request-vars"
        testId={`request-vars-${varType === 'response' ? 'res' : 'req'}`}
        columns={columns}
        rows={vars || []}
        onChange={handleVarsChange}
        defaultRow={defaultRow}
        getRowError={getRowError}
        reorderable
        onReorder={handleVarDrag}
        sortStorageKey={`request-vars-sort::${item.uid}::${varType}`}
        isDraft={isDraft}
        columnWidths={varsWidths}
        onColumnWidthsChange={(widths) => handleColumnWidthsChange('request-vars', widths)}
        initialScroll={initialScroll}
      />
    </StyledWrapper>
  );
};

export default VarsTable;
