import { execSync } from 'child_process';
import { XMLParser } from 'fast-xml-parser';
import { readFile } from 'fs/promises';
import { join } from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import {yellow} from 'colors/safe'

const { path } = yargs(hideBin(process.argv)).parse();

const baseBranch = 'develop';
const currentBranch = 'actual';

interface File {
    path: string;
    lines: { covered: number, total: number };
    branches: { covered: number, total: number };
    branch: string;
}


let files: File[] = [];
const lines = { total: 0, covered: 0 };
const branches = { total: 0, covered: 0 };

const commands = {
    currentChangedFilesCoverage: `yarn test --coverage --watchAll=false --changedSince=${baseBranch}`,
    allCoverage: 'yarn test --coverage --watchAll=false',
    checkoutToBaseBranch: 'git checkout develop',
    checkoutToPreviousBranch: 'git checkout -',
    currentBranchName: 'git rev-parse --abbrev-ref HEAD',
    stashUnsavedChanges: 'git stash -u',
    applyStashedChanges: 'git stash apply 0',
    deleteLastStashEntry: 'git stash drop 0',
}


const execCMD = (cmd: string) => {
    try {
        return execSync(cmd, { cwd: path, stdio: 'pipe' });
    } catch (error) {
        throw new Error(error);
    }
}

const parseCoverageXML = async () => {
    const xmlData = await readFile(join(path, '/coverage/clover.xml'));
    const parser = new XMLParser({ ignoreAttributes: false });
    return parser.parse(xmlData);
}

const saveCoverageMetrics = (xmlFileObject, branch: string) => {
    const folders = xmlFileObject?.package || xmlFileObject;
    
    const pushToFiles = (data ) => {
        files.push({
            path: data['@_path'],
            lines: { 
                covered: Number(data.metrics['@_coveredstatements']), 
                total: Number(data.metrics['@_statements']),
            },
            branches: { 
                covered: Number(data.metrics['@_coveredconditionals']),
                total: Number(data.metrics['@_conditionals']),
            },
            branch,
        });
    }
    

    const iterateOnFolders = (file) => {
        if(Array.isArray(file)) {
            file.forEach(pushToFiles);
        } else if(typeof file === 'object') {
            pushToFiles(file);
        } else {
            throw new Error("no valid file tag found");
        }
    }

    if(Array.isArray(folders)) {
        folders.forEach(folder => iterateOnFolders(folder.file));
    } else if(typeof folders === 'object') {
        iterateOnFolders(folders.file);
    } else {
        throw new Error("no valid packages tag found");
    }
}

const main = async () => {
    console.log(yellow("PLEASE DON'T DO ANY CHANGES ON GIT UNTIL THE SCRIPT IS DONE"));

    
    // get current coverage from current branch and save filename, covered lines and branches and total lines and branches
    const currentBranchName = execCMD(commands.currentBranchName);

    console.log(`[Running test on ${currentBranchName.toString().trim()} branch]`);
    execCMD(commands.currentChangedFilesCoverage);
    let res = await parseCoverageXML();
    saveCoverageMetrics(res.coverage.project, currentBranch);


    // save uncommitted files
    execCMD(commands.stashUnsavedChanges);

    
    // checkout to develop branch
    execCMD(commands.checkoutToBaseBranch);
    

    // get coverage from develop branch
    console.log('[Running test on develop branch]');
    execCMD(commands.allCoverage);
    res = await parseCoverageXML();
    saveCoverageMetrics(res.coverage.project, baseBranch);


    // compare previous branches and lines to the current ones
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if(file.branch === baseBranch) continue;

        const previousFile = files.find(fileAux => 
            fileAux.path === file.path && fileAux.branch === baseBranch
        );
        
        lines.covered += file.lines.covered - (previousFile?.lines?.covered || 0);
        lines.total += file.lines.total - (previousFile?.lines?.total || 0);

        branches.covered += file.branches.covered - (previousFile?.branches?.covered || 0);
        branches.total += file.branches.total - (previousFile?.branches?.total || 0);
    }

    let linesCoverage = lines.covered / lines.total;
    linesCoverage = !isNaN(linesCoverage) ?  linesCoverage * 100 : 100;
    
    let branchesCoverage = branches.covered / branches.total;
    branchesCoverage = !isNaN(branchesCoverage) ? branchesCoverage * 100 : 100;
    
    let totalCoverage = ((branches.covered + lines.covered) / (branches.total + lines.total));
    totalCoverage = !isNaN(totalCoverage) ? totalCoverage * 100 : 100;
    
    // restore git to previous state before this script
    console.log('[cleaning workspace]');
    execCMD(commands.checkoutToPreviousBranch);
    execCMD(commands.applyStashedChanges);
    execCMD(commands.deleteLastStashEntry);


    console.log('\n\n[RESULTS]');
    console.log(`Line Coverage: ${linesCoverage}%`);
    console.log(`Branch Coverage: ${branchesCoverage}%`);
    console.log(`Total Coverage: ${totalCoverage}%`);
}


try {
    main();
} catch (error) {
    console.error(error);
}
