const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '../equaguard/static/js');

function listModules(directory) {
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const filename = path.join(directory, entry.name);
        return entry.isDirectory() ? listModules(filename) : entry.name.endsWith('.js') ? [filename] : [];
    });
}

let failures = 0;
const files = listModules(root);

for (const filename of files) {
    const source = fs.readFileSync(filename, 'utf8');
    const result = spawnSync(process.execPath, ['--input-type=module', '--check'], {
        input: source,
        encoding: 'utf8',
    });
    if (result.status !== 0) {
        process.stderr.write(`${filename}\n${result.stderr}`);
        failures += 1;
    }
    for (const match of source.matchAll(/from\s+['"](\.[^'"]+)['"]/g)) {
        const dependency = path.resolve(path.dirname(filename), match[1]);
        if (!fs.existsSync(dependency)) {
            process.stderr.write(`Import não encontrado: ${filename} -> ${match[1]}\n`);
            failures += 1;
        }
    }
}

if (failures) process.exitCode = 1;
else process.stdout.write(`${files.length} módulos: sintaxe e caminhos de importação válidos.\n`);
