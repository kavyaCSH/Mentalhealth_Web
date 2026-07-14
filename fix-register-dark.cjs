const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/pages/auth/RegisterPage.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const replacements = [
    { from: /bg-\[#F9FBFA\]/g, to: 'bg-page' },
    { from: /bg-indigo-50/g, to: 'bg-indigo-50 dark:bg-indigo-500/10' },
    { from: /bg-purple-50/g, to: 'bg-purple-50 dark:bg-purple-500/10' },
    { from: /text-slate-400/g, to: 'text-muted' },
    { from: /text-slate-900/g, to: 'text-main' },
    { from: /text-slate-500/g, to: 'text-muted' },
    { from: /border-slate-100/g, to: 'border-border-card' },
    { from: /bg-red-50 border border-red-100 text-red-600/g, to: 'bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400' },
    { from: /bg-slate-50/g, to: 'bg-card' },
    { from: /text-slate-500 hover:text-slate-700/g, to: 'text-muted hover:text-main' },
    { from: /bg-slate-100\/80/g, to: 'bg-card' },
    { from: /bg-white text-indigo-600 shadow-xl shadow-indigo-100\/50/g, to: 'bg-page text-indigo-500 shadow-xl dark:shadow-none' },
    { from: /text-slate-400 hover:text-slate-600/g, to: 'text-muted hover:text-main' },
    { from: /bg-white border-slate-100/g, to: 'bg-card border-border-card' },
    { from: /hover:border-slate-200/g, to: 'hover:border-indigo-500/50' },
    { from: /bg-slate-300/g, to: 'bg-border-card' },
    { from: /border-slate-300/g, to: 'border-border-card' },
    { from: /text-slate-300/g, to: 'text-muted/50' },
    { from: /bg-white rounded-xl text-indigo-600/g, to: 'bg-page rounded-xl text-indigo-500' },
    { from: /shadow-indigo-100/g, to: 'shadow-indigo-100 dark:shadow-none' },
];

replacements.forEach(({ from, to }) => {
    content = content.replace(from, to);
});

// Couple specific manual fixes
content = content.replace('bg-page rounded-[1.5rem]', 'bg-card rounded-[1.5rem]'); // if any
content = content.replace('bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600', 'bg-indigo-500/10 text-indigo-500'); // Comm prefs

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed RegisterPage.tsx');
