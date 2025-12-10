# Security

## Extension Storage Security

VeilWallet uses browser extension storage APIs to protect keys from phishing attacks.

### Why Extension Storage?

1. **Isolated from Web Pages**: Extension storage is completely isolated from the web page context
2. **Phishing Protection**: Phishing websites cannot access extension storage
3. **Browser Encryption**: Extension storage is automatically encrypted by the browser
4. **Extension-Only Access**: Only the extension's scripts can read/write to extension storage

### Security Layers

1. **Extension Context Verification**: All key operations verify they're running in extension context
2. **Password Encryption**: Private keys encrypted with user password (PBKDF2, 100k iterations)
3. **Extension Storage**: Keys stored in extension storage (isolated from web pages)
4. **No Server Access**: Keys never sent to servers
5. **Client-Side Signing**: All transactions signed locally

## Protection Against Attacks

### Phishing Attacks

- ✅ **Protected**: Phishing sites cannot access extension storage
- ✅ **Protected**: Extension context verification prevents web page access
- ✅ **Protected**: Keys never exposed to web page JavaScript

### XSS Attacks

- ✅ **Protected**: Extension storage isolated from web page DOM
- ✅ **Protected**: Content Security Policy prevents script injection
- ✅ **Protected**: Extension scripts run in separate context

### Key Storage

- ✅ **Encrypted**: Private keys encrypted with user password
- ✅ **Isolated**: Stored in extension storage, not accessible by web pages
- ✅ **Memory Safety**: Keys only decrypted in memory during signing operations

## Best Practices

1. **Never expose keys to web pages**: All key operations must verify extension context
2. **Clear keys from memory**: Keys should only exist in memory during signing operations
3. **Use strong passwords**: Encourage users to use strong, unique passwords
4. **Regular security audits**: Review code for potential vulnerabilities
5. **User education**: Educate users about phishing and how extension storage protects them

## Compliance

- **Non-Custodial**: ✅ Keys never stored on servers
- **User Control**: ✅ Users control their keys
- **Privacy**: ✅ No key data sent to servers
- **Security**: ✅ Multiple layers of protection

