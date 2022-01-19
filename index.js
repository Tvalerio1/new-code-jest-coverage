"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var child_process_1 = require("child_process");
var fast_xml_parser_1 = require("fast-xml-parser");
var promises_1 = require("fs/promises");
var path_1 = require("path");
var yargs_1 = require("yargs");
var helpers_1 = require("yargs/helpers");
var safe_1 = require("colors/safe");
var path = (0, yargs_1["default"])((0, helpers_1.hideBin)(process.argv)).parse().path;
var baseBranch = 'develop';
var currentBranch = 'actual';
var files = [];
var lines = { total: 0, covered: 0 };
var branches = { total: 0, covered: 0 };
var commands = {
    currentChangedFilesCoverage: "yarn test --coverage --watchAll=false --changedSince=".concat(baseBranch),
    allCoverage: 'yarn test --coverage --watchAll=false',
    checkoutToBaseBranch: 'git checkout develop',
    checkoutToPreviousBranch: 'git checkout -',
    currentBranchName: 'git rev-parse --abbrev-ref HEAD',
    stashUnsavedChanges: 'git stash -u',
    applyStashedChanges: 'git stash apply 0',
    deleteLastStashEntry: 'git stash drop 0'
};
var execCMD = function (cmd) {
    try {
        return (0, child_process_1.execSync)(cmd, { cwd: path, stdio: 'pipe' });
    }
    catch (error) {
        throw new Error(error);
    }
};
var parseCoverageXML = function () { return __awaiter(void 0, void 0, void 0, function () {
    var xmlData, parser;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, promises_1.readFile)((0, path_1.join)(path, '/coverage/clover.xml'))];
            case 1:
                xmlData = _a.sent();
                parser = new fast_xml_parser_1.XMLParser({ ignoreAttributes: false });
                return [2 /*return*/, parser.parse(xmlData)];
        }
    });
}); };
var saveCoverageMetrics = function (xmlFileObject, branch) {
    var folders = (xmlFileObject === null || xmlFileObject === void 0 ? void 0 : xmlFileObject.package) || xmlFileObject;
    var pushToFiles = function (data) {
        files.push({
            path: data['@_path'],
            lines: {
                covered: Number(data.metrics['@_coveredstatements']),
                total: Number(data.metrics['@_statements'])
            },
            branches: {
                covered: Number(data.metrics['@_coveredconditionals']),
                total: Number(data.metrics['@_conditionals'])
            },
            branch: branch
        });
    };
    var iterateOnFolders = function (file) {
        if (Array.isArray(file)) {
            file.forEach(pushToFiles);
        }
        else if (typeof file === 'object') {
            pushToFiles(file);
        }
        else {
            throw new Error("no valid file tag found");
        }
    };
    if (Array.isArray(folders)) {
        folders.forEach(function (folder) { return iterateOnFolders(folder.file); });
    }
    else if (typeof folders === 'object') {
        iterateOnFolders(folders.file);
    }
    else {
        throw new Error("no valid packages tag found");
    }
};
var main = function () { return __awaiter(void 0, void 0, void 0, function () {
    var currentBranchName, res, _loop_1, i, linesCoverage, branchesCoverage, totalCoverage;
    var _a, _b, _c, _d;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                console.log((0, safe_1.yellow)("PLEASE DON'T DO ANY CHANGES ON GIT UNTIL THE SCRIPT IS DONE"));
                currentBranchName = execCMD(commands.currentBranchName);
                console.log("[Running test on ".concat(currentBranchName.toString().trim(), " branch]"));
                execCMD(commands.currentChangedFilesCoverage);
                return [4 /*yield*/, parseCoverageXML()];
            case 1:
                res = _e.sent();
                saveCoverageMetrics(res.coverage.project, currentBranch);
                // save uncommitted files
                execCMD(commands.stashUnsavedChanges);
                // checkout to develop branch
                execCMD(commands.checkoutToBaseBranch);
                // get coverage from develop branch
                console.log('[Running test on develop branch]');
                execCMD(commands.allCoverage);
                return [4 /*yield*/, parseCoverageXML()];
            case 2:
                res = _e.sent();
                saveCoverageMetrics(res.coverage.project, baseBranch);
                _loop_1 = function (i) {
                    var file = files[i];
                    if (file.branch === baseBranch)
                        return "continue";
                    var previousFile = files.find(function (fileAux) {
                        return fileAux.path === file.path && fileAux.branch === baseBranch;
                    });
                    lines.covered += file.lines.covered - (((_a = previousFile === null || previousFile === void 0 ? void 0 : previousFile.lines) === null || _a === void 0 ? void 0 : _a.covered) || 0);
                    lines.total += file.lines.total - (((_b = previousFile === null || previousFile === void 0 ? void 0 : previousFile.lines) === null || _b === void 0 ? void 0 : _b.total) || 0);
                    branches.covered += file.branches.covered - (((_c = previousFile === null || previousFile === void 0 ? void 0 : previousFile.branches) === null || _c === void 0 ? void 0 : _c.covered) || 0);
                    branches.total += file.branches.total - (((_d = previousFile === null || previousFile === void 0 ? void 0 : previousFile.branches) === null || _d === void 0 ? void 0 : _d.total) || 0);
                };
                // compare previous branches and lines to the current ones
                for (i = 0; i < files.length; i++) {
                    _loop_1(i);
                }
                linesCoverage = lines.covered / lines.total;
                linesCoverage = !isNaN(linesCoverage) ? linesCoverage * 100 : 100;
                branchesCoverage = branches.covered / branches.total;
                branchesCoverage = !isNaN(branchesCoverage) ? branchesCoverage * 100 : 100;
                totalCoverage = ((branches.covered + lines.covered) / (branches.total + lines.total));
                totalCoverage = !isNaN(totalCoverage) ? totalCoverage * 100 : 100;
                // restore git to previous state before this script
                console.log('[cleaning workspace]');
                execCMD(commands.checkoutToPreviousBranch);
                execCMD(commands.applyStashedChanges);
                execCMD(commands.deleteLastStashEntry);
                console.log('\n\n[RESULTS]');
                console.log("Line Coverage: ".concat(linesCoverage, "%"));
                console.log("Branch Coverage: ".concat(branchesCoverage, "%"));
                console.log("Total Coverage: ".concat(totalCoverage, "%"));
                return [2 /*return*/];
        }
    });
}); };
try {
    main();
}
catch (error) {
    console.error(error);
}
