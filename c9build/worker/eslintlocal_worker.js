/**
 * Cloud9 Language Foundation
 *
 * @copyright 2013, Ajax.org B.V.
 */
define(function(require, exports, module) {

var baseLanguageHandler = require('plugins/c9.ide.language/base_handler');
var workerUtil = require('plugins/c9.ide.language/worker_util');
var util = require("plugins/c9.ide.language/worker_util");
var handler = module.exports = Object.create(baseLanguageHandler);

handler.init = function(callback) {
    loadConfigFile(true, function(err) {
        if (err) console.error(err);
        util.$watchDir("/", handler);
        util.$onWatchDirChange(onWorkspaceDirChange);
    });
    
    callback();
};

function onWorkspaceDirChange(e) {
    console.log("onWorkspaceDirChange");
    e.data.files.forEach(function(f) {
        console.log(f.name);
    });
}

handler.handlesLanguage = function(language) {
    return language === "javascript" || language == "jsx";
};

handler.analyze = function(value, ast, options, callback) {
    if (options.minimalAnalysis)
        return callback();
    callback(handler.analyzeSync(value, ast, options.path));
};

handler.getMaxFileSizeSupported = function() {
    // .5 of current base_handler default
    return .5 * 10 * 1000 * 80;
};

handler.analyzer = function(value, path, callback) {
  var markers = [];
    console.log("handler.analyzer");
    console.log("workspace",this.workspaceDir);
    console.log("value",path);
    console.log("path",path);

    workerUtil.execAnalysis(
        "bash",
        {
            args: ["-c", "eslint"],
            mode: "stdin"
        },
        function(err, stdout, stderr) {
            if (err || stderr) {
                console.error('[eslintd] Unhandled Error', err || stderr);

                return callback(markers);
            }

            var response;

            if (typeof stdout === 'string') {
                try {
                    response = JSON.parse(stdout.replace(/# exit 1$/m, ''));
                } catch (e) {
                    console.error('[eslintd] Parsing Error', stdout);

                    return callback(markers);
                }
            } else {
                response = stdout;
            }

            var results = response ? response[0].messages : [];
        }
    );

};

handler.analyzeSync = function(value, ast, path) {
    console.log("analyzeSync");
    var doc = this.doc;
    var markers = [];

    messages.forEach(function(message) {
        var marker = parseMarker(message) 
        markers.push(marker);
    });
    return markers;
};

function parseMarker(m) {
    var level;
    if (m.severity === 2)
        level = "error";
    else if (m.severity === 1)
        level = "warning";
    else
        level = "info";

    if (isJson && level !== "error")
        return;

    if (m.message.match(/'([^']*)' is defined but never used/)) {
        var target = RegExp.$1;
        if (target.toUpperCase() === target && target.toLowerCase() !== target)
            return; // ignore unused constants
        if (target === "h")
            return; // ignore 'h', used in preact
        if (m.severity === 1)
            level = "info";
    }
    if (m.ruleId && m.ruleId.match(/space|spacing/) && m.severity === 1)
        level = "info";

    // work around column offset bug
    m.column--;
    m.line--;

    var ec;
    if (m.message.match(/is not defined|was used before it was defined|is already declared|is already defined|unexpected identifier|defined but never used/i)) {
        var line = doc.getLine(m.line);
        var id = workerUtil.getFollowingIdentifier(line, m.column);
        if (m.message.match(/is already defined/) && line.match("for \\(var " + id))
            return;
        ec = m.column + id.length;
    }
    if (m.message.match(/'([^']*)' is not defined/)) {
        // TODO: quickfix :)
        m.message = RegExp.$1 + " is not defined; please fix or add /*global " + RegExp.$1 + "*/";
    }
    if (m.message.match(/missing semicolon/i)) {
        var line = doc.getLine(m.line);
        if (line.substr(m.column).match(/\s*}/))
            return; // allow missing semi at end of block
        // HACK: allow missing semi at end of aura definitions
        if ((m.line === doc.getLength() || m.line === doc.getLength() - 1)
            && line.match(/^\s*\}\)\s*$/))
            return;
        if (m.severity === 1)
            level = "info";
    }
    return {
        pos: {
            sl: m.line,
            sc: m.column,
            ec: ec
        },
        type: level,
        level: level !== "info" && level,
        message: m.message
    }
}
    
});
