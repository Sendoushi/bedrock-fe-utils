'use strict';

// -----------------------------------------
// IMPORTS

var path = require('path');
var exec = require('sync-exec');
var Joi = require('joi');
var validate = require('./validate.js');
var log = require('./log');
var general = require('./general');

// -----------------------------------------
// VARS

// -----------------------------------------
// PUBLIC FUNCTIONS

/**
 * Installs node dependencies
 * @param  {array} deps
 * @param  {string} cmdDir
 */
function npmInstall(deps, cmdDir) {
    validate.type(
        { deps: deps, cmdDir: cmdDir },
        { deps: Joi.array().items(Joi.string()), cmdDir: Joi.string() }
    );

    var vendorPath = npmFindModules(cmdDir);

    deps.forEach(function (dep) {
        var realDep = npmGetDepName(dep);
        var data;

        if (general.notExist(path.join(vendorPath, realDep))) {
            return;
        }

        // Install
        data = exec('npm install ' + dep);

        if (data.stderr && data.stderr.length) {
            log.logErr('npm', data.stderr);
        } else if (data.stdout && data.stdout.length) {
            log.log('npm', data.stdout);
        }
    });
}

/**
 * Tries to find a node_modules folder
 * @param  {string} cmdDir
 * @return {string}
 */
function npmFindModules(cmdDir) {
    validate.type(
        { cmdDir: cmdDir },
        { cmdDir: Joi.string() }
    );

    var basePath = cmdDir;
    var vendorPath;
    var dirFound;
    var i;

    // Lets try and find related to the CmdDir
    for (i = 0; i < 5; i += 1) {
        vendorPath = path.join(basePath, 'node_modules');

        if (general.notExist(vendorPath)) {
            basePath = path.join(basePath, '..');
        } else {
            dirFound = true;
            break
        }
    }

    if (dirFound) {
        return vendorPath;
    }

    // Lets try and find related to the working dir
    basePath = process.cwd();

    for (i = 0; i < 5; i += 1) {
        vendorPath = path.join(basePath, 'node_modules');

        if (general.notExist(vendorPath)) {
            basePath = path.join(basePath, '..');
        } else {
            dirFound = true;
            break
        }
    }

    return vendorPath;
}

/**
 * Get the dependency name
 * @param  {string} dep
 * @return {string}
 */
function npmGetDepName(dep) {
    validate.type(
        { dep: dep },
        { dep: Joi.string() }
    );

    var i = dep.indexOf('@');
    if (i === -1) {
        i = dep.indexOf('~');
    }
    if (i === -1) {
        i = dep.indexOf('^');
    }
    if (i === -1) {
        i = dep.length;
    }

    return dep.slice(0, i);
}

// -----------------------------------------
// EXPORTS

module.exports = {
    npmInstall: npmInstall,
    npmFindModules: npmFindModules,
    npmGetDepName: npmGetDepName
};
