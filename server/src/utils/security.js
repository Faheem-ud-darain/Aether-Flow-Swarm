/**
 * Security scan utility for incoming user requirements text.
 * Prevents script injection, SQL injection, terminal exploits, and buffer overloads.
 */
export function sanitizeTextInput(text) {
  if (typeof text !== 'string') {
    return { isValid: false, reason: 'Invalid input data type.' };
  }
  
  // 1. Buffer overload safeguard (Limit size to avoid memory exhaustion)
  const MAX_CHAR_LIMIT = 2000000;
  if (text.length > MAX_CHAR_LIMIT) {
    return { isValid: false, reason: `Excessive buffer size: ${text.length} characters (Limit: ${MAX_CHAR_LIMIT}).` };
  }

  // 2. Script Injection Vectors (HTML script tags, inline handlers, javascript: URIs)
  const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>|on\w+\s*=\s*["'].*?["']|javascript:/i;
  if (scriptRegex.test(text)) {
    return { isValid: false, reason: 'Malicious HTML or Script Injection vector detected.' };
  }

  // 3. Common SQL Injection patterns (avoiding broad 'select...from' false positives in natural language)
  const sqlInjectionRegex = /\b(union\s+(all\s+)?select|drop\s+table|delete\s+from|insert\s+into)\b|or\s+['"\u2019]?\d+['"\u2019]?\s*=\s*['"\u2019]?\d+/i;
  if (sqlInjectionRegex.test(text)) {
    return { isValid: false, reason: 'Suspicious database query or SQL injection structure detected.' };
  }

  // 4. Shell Injection / Terminal exploit patterns
  const shellExploitRegex = /\b(rm\s+-rf|sudo\s+apt|chmod\s+\+x|curl\s+.*?\|\s*sh|wget\s+.*?\|\s*sh|cmd\.exe|powershell\.exe)\b/i;
  if (shellExploitRegex.test(text)) {
    return { isValid: false, reason: 'Unauthorized terminal execution command or shell payload detected.' };
  }

  return { isValid: true };
}
