import toast from 'react-hot-toast';

export const generateAssignmentSummary = (
    merchandiser: string,
    outlets: { name: string, task?: string }[],
    date: string
) => {
    return `📍 DAILY OUTLET ASSIGNMENT – ${date}\nMerchandiser: ${merchandiser}\n\n${outlets.map((o, i) => `${i + 1}. ${o.name}${o.task ? ` (${o.task})` : ''}`).join('\n')}`;
};

export const generateGlobalAssignmentSummary = (
    assignments: { merchandiser_name?: string, outlet_name?: string, instructions?: string }[],
    date: string
) => {
    const grouped = assignments.reduce((acc, curr) => {
        const mName = curr.merchandiser_name || 'Unknown Staff';
        const oName = curr.outlet_name || 'Unknown Outlet';
        const task = curr.instructions ? ` (${curr.instructions})` : '';
        if (!acc[mName]) acc[mName] = [];
        acc[mName].push(`${oName}${task}`);
        return acc;
    }, {} as Record<string, string[]>);

    let text = `📍 *DAILY OUTLET ASSIGNMENTS – ${date}*\n\n`;

    Object.entries(grouped).forEach(([name, outlets]) => {
        text += `👤 *Staff: ${name}*\n`;
        outlets.forEach((o, i) => {
            text += `${i + 1}. ${o}\n`;
        });
        text += `\n`;
    });

    return text.trim();
};

export const generateFollowUp = (outlet: string, merchandiser: string) => {
    return `⚠️ MISSING REPORT\nOutlet: ${outlet}\nMerchandiser: ${merchandiser}\nPlease submit your report ASAP.`;
};

export const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
};
