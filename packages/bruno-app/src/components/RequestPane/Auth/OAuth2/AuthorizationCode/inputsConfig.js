const inputsConfig = [
  {
    key: 'authorizationUrl',
    labelKey: 'AUTHORIZATION_URL'
  },
  {
    key: 'accessTokenUrl',
    labelKey: 'ACCESS_TOKEN_URL'
  },
  {
    key: 'clientId',
    labelKey: 'CLIENT_ID'
  },
  {
    key: 'clientSecret',
    labelKey: 'CLIENT_SECRET',
    isSecret: true
  },
  {
    key: 'scope',
    labelKey: 'SCOPE'
  },
  {
    key: 'state',
    labelKey: 'STATE',
    tooltip: 'If left empty, Bruno automatically generates a secure random value to help protect against CSRF attacks.'
  }
];

export { inputsConfig };