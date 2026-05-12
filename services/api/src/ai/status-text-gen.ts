// ═══════════════════════════════════════════════════════════════════
// Status Text Generation — Multilingual status messages via Groq
// ═══════════════════════════════════════════════════════════════════

import { groqTextCompletion } from './groq-client';
import { AIStatusTextResult } from '../types';

const STATUS_SYSTEM_PROMPT = `You are the GHMC Status Message Generator.
Generate a plain-language status update for a citizen about their complaint.
The message must be clear, respectful, and informative.

OUTPUT FORMAT (strict JSON only):
{
  "status_text": "Your complaint about [issue] has been [action]. [next step].",
  "language": "en"
}

Rules:
- Keep messages under 160 characters (SMS-friendly)
- Use simple language accessible to all literacy levels
- Include the complaint category and current action
- Be empathetic but factual`;

export async function generateStatusText(
  status: string,
  category: string,
  language: string = 'en',
  context?: { officer_name?: string; ward_name?: string; sla_hours?: number },
): Promise<AIStatusTextResult> {
  try {
    const result = await groqTextCompletion<AIStatusTextResult>({
      systemPrompt: STATUS_SYSTEM_PROMPT,
      userPrompt: `Generate a status message in ${language} for:
Status: ${status}
Category: ${category}
${context?.officer_name ? `Officer: ${context.officer_name}` : ''}
${context?.ward_name ? `Ward: ${context.ward_name}` : ''}
${context?.sla_hours ? `SLA: ${context.sla_hours} hours` : ''}`,
    });
    return result;
  } catch {
    // Fallback to template-based messages
    return { status_text: getTemplateMessage(status, category), language };
  }
}

function getTemplateMessage(status: string, category: string): string {
  const templates: Record<string, string> = {
    NEW: `Your ${category.toLowerCase()} complaint has been received and is being processed.`,
    ROUTED: `Your complaint has been routed to the correct ward for action.`,
    ASSIGNED: `An officer has been assigned to your ${category.toLowerCase()} complaint.`,
    IN_PROGRESS: `Work is in progress on your ${category.toLowerCase()} complaint.`,
    PENDING_VERIFICATION: `Resolution is being verified for your complaint.`,
    PENDING_CITIZEN_VERIFICATION: `Please verify: has your ${category.toLowerCase()} issue been resolved?`,
    RESOLVED: `Your ${category.toLowerCase()} complaint has been resolved. Thank you for reporting.`,
    REOPENED: `Your complaint has been reopened and reassigned for resolution.`,
    ESCALATED: `Your complaint has been escalated to senior management for priority action.`,
  };
  return templates[status] || `Your complaint status: ${status}`;
}

