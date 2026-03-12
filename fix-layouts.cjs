const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.tsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk(path.join(__dirname, 'src', 'pages'));
let modifiedCount = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    const original = content;
    
    // Replace mx-auto inside the main wrapper (which usually has p-8 and max-w-...)
    // Pattern 1: class names containing "p-8 max-w-XYZ mx-auto"
    content = content.replace(/className="(.*?)p-8(.*?)max-w-([a-z0-9]+)(.*?)mx-auto(.*?)"/g, (match, p1, p2, p3, p4, p5) => {
        return `className="${p1}p-8${p2}max-w-${p3}${p4}${p5}"`;
    });
    
    // Pattern 2: the class name contains "max-w" and "mx-auto" generally on the outmost div
    // We only want to target main container `div`s, not everything. Let's look for "p-8" and "max-w" and "mx-auto".
    content = content.replace(/className="[^"]*p-8[^"]*max-w-[a-z0-9]+[^"]*mx-auto[^"]*"/g, (match) => {
        return match.replace(/\s+mx-auto/, '').replace(/mx-auto\s+/, '');
    });
    
    // specifically handle QuestionnairePage.tsx formatting styles
    content = content.replace(/max-w-([a-z0-9]+)\s+mx-auto\s+p-8/g, 'max-w-$1 p-8');
    
    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated layout in ${path.basename(file)}`);
        modifiedCount++;
    }
});

console.log(`\nFixed ${modifiedCount} files.`);
