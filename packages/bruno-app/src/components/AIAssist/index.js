import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import get from 'lodash/get';
import Tippy from '@tippyjs/react';
import { IconX, IconArrowBackUp, IconPlayerStop } from '@tabler/icons';
import IconSparkles from 'components/Icons/IconSparkles';
import Button from 'ui/Button';
import { aiGenerateScript, stopAiGeneration } from 'utils/ai';
import StyledWrapper, { PopupWrapper } from './StyledWrapper';

const SUGGESTIONS = {
  'tests': [
    { label: 'AI_ASSIST.SUGGESTION_TESTS_STATUS_200', prompt: 'Add a test asserting the response status code is 200' },
    { label: 'AI_ASSIST.SUGGESTION_TESTS_JSON_BODY', prompt: 'Add tests validating the JSON response body structure and key fields' },
    { label: 'AI_ASSIST.SUGGESTION_TESTS_HEADERS', prompt: 'Add a test checking the content-type response header' },
    { label: 'AI_ASSIST.SUGGESTION_TESTS_RESPONSE_TIME', prompt: 'Add a test asserting the response time is below 1000ms' }
  ],
  'pre-request': [
    { label: 'AI_ASSIST.SUGGESTION_PRE_REQUEST_AUTH', prompt: 'Set an Authorization header from an environment token variable' },
    { label: 'AI_ASSIST.SUGGESTION_PRE_REQUEST_TIMESTAMP', prompt: 'Set a variable named "timestamp" containing the current epoch ms' },
    { label: 'AI_ASSIST.SUGGESTION_PRE_REQUEST_RANDOM_ID', prompt: 'Set a variable named "requestId" containing a random UUID-style id' }
  ],
  'post-response': [
    { label: 'AI_ASSIST.SUGGESTION_POST_RESPONSE_SAVE_TOKEN', prompt: 'Extract a token from the response body and save it to an environment variable' },
    { label: 'AI_ASSIST.SUGGESTION_POST_RESPONSE_SAVE_ID', prompt: 'Extract the primary id from the response body and save it to a variable' },
    { label: 'AI_ASSIST.SUGGESTION_POST_RESPONSE_LOG', prompt: 'Log the response status and a short summary of the body' }
  ],
  'docs': [
    { label: 'AI_ASSIST.SUGGESTION_DOCS_OVERVIEW', prompt: 'Write an overview section describing the purpose and key features' },
    { label: 'AI_ASSIST.SUGGESTION_DOCS_REQUEST', prompt: 'Document the request method, URL, headers, parameters, and body' },
    { label: 'AI_ASSIST.SUGGESTION_DOCS_EXAMPLES', prompt: 'Add request and response examples with sample JSON' },
    { label: 'AI_ASSIST.SUGGESTION_DOCS_ERRORS', prompt: 'Document common error responses and status codes' }
  ],
  'app-request': [
    { label: 'AI_ASSIST.SUGGESTION_APP_SEND_BUTTON', prompt: 'Add a button that calls bru.ctx.submitRequest() and displays the response status, headers, and pretty-printed body' },
    { label: 'AI_ASSIST.SUGGESTION_APP_FORM_BODY', prompt: 'Build a form whose fields override the request body, then send it with bru.ctx.submitRequest({ runtimeVariables }) and show the result' },
    { label: 'AI_ASSIST.SUGGESTION_APP_RESPONSE_VIEWER', prompt: 'Render bru.ctx.http.response with collapsible JSON and a banner showing status and response time; update on bru.ctx.http.onResponseChange' },
    { label: 'AI_ASSIST.SUGGESTION_APP_TEST_RESULTS', prompt: 'List bru.ctx.tests and bru.ctx.assertions with pass/fail badges; refresh on bru.ctx.onTestsChange and bru.ctx.onAssertionsChange' }
  ],
  'app-collection': [
    { label: 'AI_ASSIST.SUGGESTION_APP_REQUEST_LIST', prompt: 'List all requests from bru.ctx.listRequests() with their method and url, and a Run button next to each that calls bru.ctx.runRequest(pathname)' },
    { label: 'AI_ASSIST.SUGGESTION_APP_DASHBOARD', prompt: 'Build a small dashboard that runs every request from bru.ctx.listRequests() on load and shows status code, response time, and a pass/fail dot for each' },
    { label: 'AI_ASSIST.SUGGESTION_APP_FORM_RUNNER', prompt: 'Render a form, and on submit call bru.ctx.runRequest(pathname, { runtimeVariables }) for a chosen request and display the response' },
    { label: 'AI_ASSIST.SUGGESTION_APP_VARIABLES_PANEL', prompt: 'Show bru.ctx.variables.resolved in a table and allow editing values via bru.ctx.variables.runtime.set(name, value); react to bru.ctx.onVariablesChange' }
  ]
};

const TITLES = {
  'tests': 'AI_ASSIST.GENERATE_TESTS',
  'pre-request': 'AI_ASSIST.GENERATE_PRE_REQUEST',
  'post-response': 'AI_ASSIST.GENERATE_POST_RESPONSE',
  'docs': 'AI_ASSIST.GENERATE_DOCS',
  'app-request': 'AI_ASSIST.GENERATE_APP',
  'app-collection': 'AI_ASSIST.GENERATE_APP'
};

const PREVIEW_LABELS = {
  'docs': 'AI_ASSIST.PREVIEW_DOCS',
  'app-request': 'AI_ASSIST.PREVIEW_APP',
  'app-collection': 'AI_ASSIST.PREVIEW_APP'
};

const isValidType = (type) => SUGGESTIONS[type] !== undefined;

const AIAssist = ({ scriptType, currentScript, requestContext, docsContext, variables, onApply }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generated, setGenerated] = useState(null);
  const streamIdRef = useRef(null);
  const tippyRef = useRef(null);

  // Focus the prompt textarea when coming back from preview
  useEffect(() => {
    if (isOpen && generated == null) {
      tippyRef.current?.popper?.querySelector('.popup-input')?.focus();
    }
  }, [isOpen, generated]);

  // handle Escape key to close the popup
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        tippyRef.current?.hide();
      }
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [isOpen]);

  const preferences = useSelector((state) => state.app.preferences);
  const isAiEnabled = get(preferences, 'ai.enabled', false);

  const suggestions = useMemo(() => SUGGESTIONS[scriptType] || [], [scriptType]);
  const title = TITLES[scriptType] ? t(TITLES[scriptType]) : t('AI_ASSIST.GENERATE_WITH_AI');
  const previewLabel = PREVIEW_LABELS[scriptType] ? t(PREVIEW_LABELS[scriptType]) : t('AI_ASSIST.PREVIEW_DEFAULT');

  const close = useCallback(() => {
    tippyRef.current?.hide();
  }, []);

  const handleGenerate = useCallback(
    async (overridePrompt) => {
      const text = (overridePrompt ?? prompt).trim();
      if (!text || isLoading) return;
      setIsLoading(true);
      setError(null);

      const streamId = `sparkle-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      streamIdRef.current = streamId;

      try {
        const result = await aiGenerateScript({
          scriptType,
          prompt: text,
          currentScript: currentScript || '',
          requestContext,
          docsContext,
          variables,
          streamId
        });
        if (result?.stopped) {
          return;
        }
        if (result?.error) {
          setError(result.error);
          return;
        }
        if (result?.content) {
          setGenerated(result.content);
        } else {
          setError(t('AI_ASSIST.NO_CONTENT_GENERATED'));
        }
      } catch (err) {
        setError(err?.message || t('AI_ASSIST.FAILED_GENERATE'));
      } finally {
        streamIdRef.current = null;
        setIsLoading(false);
      }
    },
    [prompt, isLoading, scriptType, currentScript, requestContext, docsContext, variables]
  );

  const handleStop = useCallback(() => {
    if (streamIdRef.current) {
      stopAiGeneration(streamIdRef.current);
    }
  }, []);

  const handleApply = useCallback(() => {
    if (generated == null) return;
    onApply(generated);
    setGenerated(null);
    setPrompt('');
    close();
  }, [generated, onApply, close]);

  const handleBackToPrompt = useCallback(() => {
    setGenerated(null);
    setError(null);
  }, []);

  if (!isAiEnabled || !isValidType(scriptType)) return null;

  return (
    <StyledWrapper>
      <Tippy
        interactive
        trigger="click"
        placement="bottom-end"
        arrow={false}
        animation={false}
        maxWidth="none"
        appendTo={() => document.body}
        onCreate={(instance) => (tippyRef.current = instance)}
        onShow={(instance) => {
          setIsOpen(true);
          // rAF so the popup content is in the DOM
          requestAnimationFrame(() => instance.popper?.querySelector('.popup-input')?.focus());
        }}
        onHide={() => {
          setIsOpen(false);
          setError(null);
        }}
        render={(attrs) => (
          <PopupWrapper className="ai-assist-popup" role="dialog" aria-label={title} tabIndex={-1} {...attrs}>
            <div className="popup-header">
              <span className="popup-title">
                <IconSparkles size={12} strokeWidth={1.75} />
                {title}
              </span>
               <button className="popup-close" onClick={close} type="button" aria-label={t('AI_ASSIST.CLOSE')}>
                <IconX size={14} />
              </button>
            </div>

            {generated == null ? (
              <>
                <div className="popup-body">
                  <textarea
                    className="popup-input"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleGenerate();
                      }
                    }}
                    placeholder={t('AI_ASSIST.PROMPT_PLACEHOLDER')}
                    rows={3}
                    disabled={isLoading}
                  />

                  {!isLoading && !prompt && suggestions.length > 0 && (
                    <div className="popup-suggestions">
                      {suggestions.map((s) => (
                        <button
                          key={s.label}
                          className="suggestion-chip"
                          type="button"
                           onClick={() => handleGenerate(s.prompt)}
                           disabled={isLoading}
                         >
                           {t(s.label)}
                        </button>
                      ))}
                    </div>
                  )}

                  {error && <div className="popup-error">{error}</div>}
                </div>

                <div className="popup-footer">
                  {isLoading ? (
                     <span className="popup-loading">
                       <span className="loading-spinner" />
                       {t('AI_ASSIST.GENERATING')}
                     </span>
                   ) : (
                     <span className="popup-hint">{t('AI_ASSIST.ENTER_HINT')}</span>
                  )}
                  {isLoading ? (
                    <Button
                      variant="filled"
                      color="danger"
                      size="sm"
                      rounded="sm"
                     icon={<IconPlayerStop size={12} />}
                     onClick={handleStop}
                     title={t('AI_ASSIST.STOP_GENERATING')}
                   >
                     {t('AI_ASSIST.STOP')}
                    </Button>
                  ) : (
                    <button
                      className="btn-generate"
                      type="button"
                       onClick={() => handleGenerate()}
                       disabled={!prompt.trim()}
                     >
                       {t('AI_ASSIST.GENERATE')}
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="popup-body">
                  <div className="preview-section">
                    <span className="preview-label">{previewLabel}</span>
                    <div className="preview-code">
                      <pre>{generated}</pre>
                    </div>
                  </div>
                </div>

                <div className="popup-footer">
                   <button className="btn-secondary" type="button" onClick={handleBackToPrompt}>
                     <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                       <IconArrowBackUp size={12} /> {t('AI_ASSIST.BACK')}
                     </span>
                   </button>
                   <button className="btn-generate" type="button" onClick={handleApply}>
                     {t('AI_ASSIST.APPLY')}
                  </button>
                </div>
              </>
            )}
          </PopupWrapper>
        )}
      >
        <button
          className={`ai-assist-trigger ${isOpen ? 'open' : ''}`}
          title={title}
          type="button"
          aria-label={title}
          data-testid={`ai-assist-trigger-${scriptType}`}
        >
          <IconSparkles size={14} strokeWidth={1.75} />
        </button>
      </Tippy>
    </StyledWrapper>
  );
};

export default AIAssist;
