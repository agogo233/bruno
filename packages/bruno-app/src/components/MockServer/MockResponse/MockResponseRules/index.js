import React, { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import EditableTable from 'components/EditableTable';
import { uuid } from 'utils/common';
import StyledWrapper from './StyledWrapper';

const TARGET_OPTIONS = [
  { value: 'header', labelKey: 'HEADER' },
  { value: 'query', labelKey: 'QUERY' },
  { value: 'body', labelKey: 'BODY' }
];

const OPERATOR_OPTIONS = [
  { value: 'equals', labelKey: 'EQUALS' },
  { value: 'not_equals', labelKey: 'NOT_EQUALS' },
  { value: 'contains', labelKey: 'CONTAINS' },
  { value: 'matches', labelKey: 'MATCHES' }
];

const DEFAULT_CONDITION = {
  target: 'header',
  key: '',
  operator: 'equals',
  value: ''
};

const KEY_PLACEHOLDERS = {
  body: '$.user.type',
  query: 'page',
  header: 'x-api-key'
};

const MockResponseRules = ({ rules, editMode, onChange }) => {
  const { t } = useTranslation();
  const conditions = rules?.conditions || [];
  const operator = rules?.operator === 'OR' ? 'OR' : 'AND';
  const rowUidsRef = useRef([]);

  const rows = useMemo(() => conditions.map((condition, index) => {
    if (condition.uid) {
      return condition;
    }

    rowUidsRef.current[index] = rowUidsRef.current[index] || uuid();
    return { ...condition, uid: rowUidsRef.current[index] };
  }), [conditions]);

  const handleRowsChange = (updatedRows) => {
    onChange({
      operator,
      conditions: updatedRows.map((row) => ({
        uid: row.uid,
        target: row.target || DEFAULT_CONDITION.target,
        key: row.key || '',
        operator: row.operator || DEFAULT_CONDITION.operator,
        value: row.value || ''
      }))
    });
  };

  const columns = [
    {
      key: 'target',
      name: t('MOCK_SERVER.RULES.TARGET'),
      width: '20%',
      render: ({ value, onChange: onCellChange }) => (
        <select
          value={value || DEFAULT_CONDITION.target}
          disabled={!editMode}
          onChange={(event) => onCellChange(event.target.value)}
          aria-label={t('MOCK_SERVER.RULES.RULE_TARGET')}
        >
          {TARGET_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{t(`MOCK_SERVER.RULES.TARGET_${option.labelKey}`)}</option>
          ))}
        </select>
      )
    },
    {
      key: 'key',
      name: t('MOCK_SERVER.RULES.KEY'),
      isKeyField: true,
      width: '27%',
      readOnly: !editMode,
      placeholder: KEY_PLACEHOLDERS.header,
      render: ({ row, value, onChange: onCellChange }) => (
        <input
          type="text"
          autoComplete="off"
          spellCheck="false"
          className="mousetrap"
          value={value || ''}
          readOnly={!editMode}
          placeholder={KEY_PLACEHOLDERS[row.target] || KEY_PLACEHOLDERS.header}
          onChange={(event) => onCellChange(event.target.value)}
        />
      )
    },
    {
      key: 'operator',
      name: t('MOCK_SERVER.RULES.OPERATOR'),
      width: '22%',
      render: ({ value, onChange: onCellChange }) => (
        <select
          value={value === 'regex' ? 'matches' : (value || DEFAULT_CONDITION.operator)}
          disabled={!editMode}
          onChange={(event) => onCellChange(event.target.value)}
          aria-label={t('MOCK_SERVER.RULES.RULE_OPERATOR')}
        >
          {OPERATOR_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{t(`MOCK_SERVER.RULES.OPERATOR_${option.labelKey}`)}</option>
          ))}
        </select>
      )
    },
    {
      key: 'value',
      name: t('MOCK_SERVER.RULES.VALUE'),
      width: '31%',
      readOnly: !editMode,
      placeholder: t('MOCK_SERVER.RULES.VALUE')
    }
  ];

  return (
    <StyledWrapper>
      <div className="flex items-center justify-end mb-3">
        <div className="flex items-center gap-2 text-xs">
          <label htmlFor="mock-response-rule-operator">{t('MOCK_SERVER.RULES.MATCH')}</label>
          <select
            id="mock-response-rule-operator"
            className="rule-operator"
            value={operator}
            disabled={!editMode}
            onChange={(event) => onChange({ operator: event.target.value, conditions })}
          >
            <option value="AND">{t('MOCK_SERVER.RULES.ALL_AND')}</option>
            <option value="OR">{t('MOCK_SERVER.RULES.ANY_OR')}</option>
          </select>
        </div>
      </div>

      {rows.length === 0 && !editMode ? (
        <div className="text-xs opacity-70">
          {t('MOCK_SERVER.RULES.NO_RULES')}
        </div>
      ) : (
        <EditableTable
          tableId="mock-response-rules"
          columns={columns}
          rows={rows}
          onChange={handleRowsChange}
          defaultRow={DEFAULT_CONDITION}
          showCheckbox={false}
          showAddRow={editMode}
          showDelete={editMode}
          testId="mock-response-rules-table"
        />
      )}
    </StyledWrapper>
  );
};

export default MockResponseRules;
