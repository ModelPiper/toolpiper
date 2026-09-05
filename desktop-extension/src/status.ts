/**
 * The one tool this extension serves on its own, and only while ToolPiper is
 * not running.
 *
 * It reports a fact and names the command that fixes it. It downloads nothing,
 * installs nothing and opens nothing, and its description is setup text rather
 * than a pitch, because the Anthropic directory rejects tool descriptions that
 * promote products and services.
 */

export const STATUS_TOOL_NAME = 'toolpiper_status';

export const statusTool = {
    name: STATUS_TOOL_NAME,
    title: 'ToolPiper status',
    description:
        'Report whether the ToolPiper app is running on this Mac and, when it is not, the command that starts it.',
    inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false,
    },
    annotations: {
        title: 'ToolPiper status',
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
    },
} as const;

export function notRunningText(origin: string): string {
    return [
        'ToolPiper is not running on this Mac, so none of its tools are available right now.',
        '',
        'Start it:    open -a ToolPiper',
        'Get it:      https://modelpiper.com/toolpiper',
        '',
        `This extension speaks only to ${origin} on this machine. It downloads nothing and`,
        'installs nothing. When ToolPiper starts, its tool list appears here on its own.',
    ].join('\n');
}

export function unavailableText(toolName: string): string {
    return [
        `"${toolName}" is a ToolPiper tool, and ToolPiper is not running on this Mac.`,
        '',
        'Start it:    open -a ToolPiper',
        'Get it:      https://modelpiper.com/toolpiper',
    ].join('\n');
}
