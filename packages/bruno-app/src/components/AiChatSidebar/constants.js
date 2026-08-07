export const PROCESSING_STAGES = [
  { id: 'sending', label: 'Sending request', key: 'AI_CHAT_SIDEBAR.SIDEBAR.PROCESSING_SENDING', icon: 'send' },
  { id: 'thinking', label: 'AI is thinking', key: 'AI_CHAT_SIDEBAR.SIDEBAR.PROCESSING_THINKING', icon: 'sparkles' },
  { id: 'generating', label: 'Generating response', key: 'AI_CHAT_SIDEBAR.SIDEBAR.PROCESSING_GENERATING', icon: 'wand' },
  { id: 'applying', label: 'Preparing changes', key: 'AI_CHAT_SIDEBAR.SIDEBAR.PROCESSING_APPLYING', icon: 'code' }
];

export const CONTENT_TYPE_LABELS = {
  'app': 'AI_CHAT_SIDEBAR.SIDEBAR.CONTENT_TYPE_APP',
  'tests': 'AI_CHAT_SIDEBAR.SIDEBAR.CONTENT_TYPE_TESTS',
  'pre-request': 'AI_CHAT_SIDEBAR.SIDEBAR.CONTENT_TYPE_SCRIPT',
  'post-response': 'AI_CHAT_SIDEBAR.SIDEBAR.CONTENT_TYPE_SCRIPT',
  'docs': 'AI_CHAT_SIDEBAR.SIDEBAR.CONTENT_TYPE_DOCS'
};

export const SUGGESTIONS_BY_TYPE = {
  'app': [
    { label: 'AI_CHAT_SIDEBAR.SIDEBAR.SUGGESTION_APP_CREATE_FORM', prompt: 'Create a simple form to send this request' },
    { label: 'AI_CHAT_SIDEBAR.SIDEBAR.SUGGESTION_APP_LOADING_SPINNER', prompt: 'Add a loading spinner while the request is pending' },
    { label: 'AI_CHAT_SIDEBAR.SIDEBAR.SUGGESTION_APP_TABLE', prompt: 'Display the response data in a table' },
    { label: 'AI_CHAT_SIDEBAR.SIDEBAR.SUGGESTION_APP_ERROR_HANDLING', prompt: 'Add error handling with user-friendly messages' }
  ],
  'tests': [
    { label: 'AI_CHAT_SIDEBAR.SIDEBAR.SUGGESTION_TESTS_BASIC_TESTS', prompt: 'Generate tests for status code, response body, and headers' },
    { label: 'AI_CHAT_SIDEBAR.SIDEBAR.SUGGESTION_TESTS_RESPONSE_STRUCTURE', prompt: 'Write tests to validate the response body structure and data types' },
    { label: 'AI_CHAT_SIDEBAR.SIDEBAR.SUGGESTION_TESTS_ERROR_CASES', prompt: 'Write tests for common error scenarios' },
    { label: 'AI_CHAT_SIDEBAR.SIDEBAR.SUGGESTION_TESTS_RESPONSE_TIME_LABEL', prompt: 'Add a test to verify response time is acceptable' }
  ],
  'pre-request': [
    { label: 'AI_CHAT_SIDEBAR.SIDEBAR.SUGGESTION_PRE_REQUEST_ADD_AUTH', prompt: 'Add authorization header from environment variable' },
    { label: 'AI_CHAT_SIDEBAR.SIDEBAR.SUGGESTION_PRE_REQUEST_DYNAMIC_VARS', prompt: 'Set dynamic request variables like timestamp or unique ID' },
    { label: 'AI_CHAT_SIDEBAR.SIDEBAR.SUGGESTION_PRE_REQUEST_CONDITIONAL', prompt: 'Add conditional logic to modify the request based on environment' }
  ],
  'post-response': [
    { label: 'AI_CHAT_SIDEBAR.SIDEBAR.SUGGESTION_POST_RESPONSE_EXTRACT_VARS', prompt: 'Extract data from response and save to environment variables' },
    { label: 'AI_CHAT_SIDEBAR.SIDEBAR.SUGGESTION_POST_RESPONSE_STORE_TOKEN', prompt: 'Extract auth token from response and save for future requests' },
    { label: 'AI_CHAT_SIDEBAR.SIDEBAR.SUGGESTION_POST_RESPONSE_LOG_RESPONSE', prompt: 'Log response status and body for debugging' },
    { label: 'AI_CHAT_SIDEBAR.SIDEBAR.SUGGESTION_POST_RESPONSE_TRANSFORM', prompt: 'Transform and process the response data' }
  ],
  'docs': [
    { label: 'AI_CHAT_SIDEBAR.SIDEBAR.SUGGESTION_DOCS_FULL', prompt: 'Generate comprehensive API documentation for this endpoint' },
    { label: 'AI_CHAT_SIDEBAR.SIDEBAR.SUGGESTION_DOCS_PARAMS', prompt: 'Document all request parameters, headers, and body' },
    { label: 'AI_CHAT_SIDEBAR.SIDEBAR.SUGGESTION_DOCS_EXAMPLES_LABEL', prompt: 'Add request and response examples' },
    { label: 'AI_CHAT_SIDEBAR.SIDEBAR.SUGGESTION_DOCS_ERRORS_LABEL', prompt: 'Document common error responses and status codes' }
  ]
};

export const PLACEHOLDER_BY_TYPE = {
  'tests': { empty: 'Describe the tests you want...', filled: 'Ask to modify or add tests...' },
  'pre-request': { empty: 'Describe the script you want...', filled: 'Ask to modify the script...' },
  'post-response': { empty: 'Describe the script you want...', filled: 'Ask to modify the script...' },
  'docs': { empty: 'Describe the documentation...', filled: 'Ask to update the docs...' },
  'app': { empty: 'Describe the app you want to create...', filled: 'Ask to modify your app...' }
};
