/**
 * Browser Safety Layer
 */

import { RiskLevel, classifyRisk } from 'floyd-agent-core';

export interface SafetyCheck {
  allowed: boolean;
  requiresConfirmation: boolean;
  reason: string;
  riskLevel: RiskLevel;
}

const BLOCKED_URL_PATTERNS = [
  /^file:\/\//i, /^chrome:/i, /^chrome-extension:/i, /^about:/i,
];

const SENSITIVE_DOMAINS = [
  'github.com', 'gitlab.com', 'aws.amazon.com', 'paypal.com', 'stripe.com',
];

export function checkUrlSafety(url: string): SafetyCheck {
  for (const pattern of BLOCKED_URL_PATTERNS) {
    if (pattern.test(url)) {
      return { allowed: false, requiresConfirmation: false,
        reason: `Blocked: ${pattern.source}`, riskLevel: RiskLevel.HIGH };
    }
  }
  for (const domain of SENSITIVE_DOMAINS) {
    if (url.toLowerCase().includes(domain)) {
      return { allowed: true, requiresConfirmation: true,
        reason: `Sensitive domain: ${domain}`, riskLevel: RiskLevel.MEDIUM };
    }
  }
  return { allowed: true, requiresConfirmation: false,
    reason: 'Safe', riskLevel: RiskLevel.LOW };
}

export function checkActionSafety(action: string, target?: string): SafetyCheck {
  const risk = classifyRisk(`browser_${action}`, { action, target });
  if (action === 'submit' || (target?.toLowerCase().includes('password'))) {
    return { allowed: true, requiresConfirmation: true,
      reason: 'Sensitive action', riskLevel: RiskLevel.HIGH };
  }
  return { allowed: true, requiresConfirmation: risk.level !== RiskLevel.LOW,
    reason: risk.reasons[0] || 'Safe', riskLevel: risk.level };
}

export class BrowserSafetyLayer {
  private confirmCallback?: (msg: string) => Promise<boolean>;

  setConfirmationCallback(cb: (msg: string) => Promise<boolean>): void {
    this.confirmCallback = cb;
  }

  async validateNavigation(url: string): Promise<boolean> {
    const check = checkUrlSafety(url);
    if (!check.allowed) return false;
    if (check.requiresConfirmation && this.confirmCallback) {
      return this.confirmCallback(check.reason);
    }
    return true;
  }

  async validateAction(action: string, target?: string): Promise<boolean> {
    const check = checkActionSafety(action, target);
    if (!check.allowed) return false;
    if (check.requiresConfirmation && this.confirmCallback) {
      return this.confirmCallback(check.reason);
    }
    return true;
  }
}

export default BrowserSafetyLayer;
