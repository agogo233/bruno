import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Map of collectionUid -> { activeTab, expandedSections, expandedRows, reviewDecisions }
  tabUiState: {},
  // Map of collectionUid -> { title, version, endpointCount }
  storedSpecMeta: {},
  // Map of collectionUid -> full parsed OpenAPI spec object
  storedSpec: {},
  // Map of collectionUid -> { specDrift, collectionDrift, remoteDrift, fetching, lastChecked }
  drift: {}
};

export const openapiSyncSlice = createSlice({
  name: 'openapiSync',
  initialState,
  reducers: {
    clearCollectionState: (state, action) => {
      const { collectionUid } = action.payload;
      delete state.tabUiState[collectionUid];
      delete state.storedSpecMeta[collectionUid];
      delete state.storedSpec[collectionUid];
      delete state.drift[collectionUid];
    },
    setDrift: (state, action) => {
      const { collectionUid, patch } = action.payload;
      state.drift[collectionUid] = { ...state.drift[collectionUid], ...patch };
    },
    clearDrift: (state, action) => {
      const { collectionUid } = action.payload;
      delete state.drift[collectionUid];
    },
    clearOpenApiSyncTabState: (state, action) => {
      const { collectionUid } = action.payload;
      delete state.drift[collectionUid];
      delete state.storedSpec[collectionUid];
      delete state.tabUiState[collectionUid];
    },
    setStoredSpec: (state, action) => {
      const { collectionUid, spec } = action.payload;
      if (spec === null || spec === undefined) {
        delete state.storedSpec[collectionUid];
      } else {
        state.storedSpec[collectionUid] = spec;
      }
    },
    setStoredSpecMeta: (state, action) => {
      const { collectionUid, title, version, endpointCount } = action.payload;
      state.storedSpecMeta[collectionUid] = { title, version, endpointCount };
    },
    // UI state reducers
    setTabUiState: (state, action) => {
      const { collectionUid, ...uiState } = action.payload;
      if (!state.tabUiState[collectionUid]) {
        state.tabUiState[collectionUid] = {};
      }
      Object.assign(state.tabUiState[collectionUid], uiState);
    },
    toggleSectionExpanded: (state, action) => {
      const { collectionUid, sectionKey } = action.payload;
      if (!state.tabUiState[collectionUid]) {
        state.tabUiState[collectionUid] = {};
      }
      if (!state.tabUiState[collectionUid].expandedSections) {
        state.tabUiState[collectionUid].expandedSections = {};
      }
      const current = state.tabUiState[collectionUid].expandedSections[sectionKey];
      state.tabUiState[collectionUid].expandedSections[sectionKey] = !current;
    },
    setSectionExpanded: (state, action) => {
      const { collectionUid, sectionKey, expanded } = action.payload;
      if (!state.tabUiState[collectionUid]) {
        state.tabUiState[collectionUid] = {};
      }
      if (!state.tabUiState[collectionUid].expandedSections) {
        state.tabUiState[collectionUid].expandedSections = {};
      }
      state.tabUiState[collectionUid].expandedSections[sectionKey] = expanded;
    },
    toggleRowExpanded: (state, action) => {
      const { collectionUid, rowKey } = action.payload;
      if (!state.tabUiState[collectionUid]) {
        state.tabUiState[collectionUid] = {};
      }
      if (!state.tabUiState[collectionUid].expandedRows) {
        state.tabUiState[collectionUid].expandedRows = {};
      }
      const current = state.tabUiState[collectionUid].expandedRows[rowKey];
      state.tabUiState[collectionUid].expandedRows[rowKey] = !current;
    },
    setReviewDecision: (state, action) => {
      const { collectionUid, endpointId, decision } = action.payload;
      if (!state.tabUiState[collectionUid]) {
        state.tabUiState[collectionUid] = {};
      }
      if (!state.tabUiState[collectionUid].reviewDecisions) {
        state.tabUiState[collectionUid].reviewDecisions = {};
      }
      state.tabUiState[collectionUid].reviewDecisions[endpointId] = decision;
    },
    setReviewDecisions: (state, action) => {
      const { collectionUid, decisions } = action.payload;
      if (!state.tabUiState[collectionUid]) {
        state.tabUiState[collectionUid] = {};
      }
      // Merge into existing decisions instead of replacing, so decisions
      // for other change types (e.g., specChanges) are preserved
      state.tabUiState[collectionUid].reviewDecisions = {
        ...state.tabUiState[collectionUid].reviewDecisions,
        ...decisions
      };
    }
  }
});

export const {
  clearCollectionState,
  setTabUiState,
  toggleSectionExpanded,
  setSectionExpanded,
  toggleRowExpanded,
  setReviewDecision,
  setReviewDecisions,
  setStoredSpec,
  setStoredSpecMeta,
  setDrift,
  clearDrift,
  clearOpenApiSyncTabState
} = openapiSyncSlice.actions;


export default openapiSyncSlice.reducer;
