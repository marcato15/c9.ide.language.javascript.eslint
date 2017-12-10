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


    handler.handlesLanguage = function(language) {
        return language === "javascript" || language == "jsx";
    };

    handler.analyze = function(value, ast, options, callback) {
        console.log("options",options);
        handler.analyzer(value, options.path, function(markers) {
            callback(markers);
        });
    };

    handler.analyzer = function(value, path, callback) {
        var doc = this.doc;
        var markers = [];
        var workdir = this.environmentDir;
        var file = this.environmentDir + this.path;
        var nodepath = workdir + "/node_modules/.bin/eslint";
        console.log("nodepath",nodepath);
        console.log("file",file);
        console.log("this",this);
        console.log("value",value);

        workerUtil.execAnalysis(
            nodepath,
            {
                args: ["-f","json","--stdin","--stdin-filename",file],
                mode: "stdin",
                maxCallInterval: 1200,
            },
            function(err, stdout, stderr) {
                var messages = stdout ? stdout[0].messages : [];

                messages.forEach(function(m) {
                    var level;
                    if (m.severity === 2)
                        level = "error";
                    else if (m.severity === 1)
                        level = "warning";
                    else
                        level = "info";

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

                    markers.push({
                        pos: {
                            sl: m.line,
                            sc: m.column,
                            ec: ec
                        },
                        type: level,
                        level: level !== "info" && level,
                        message: m.message
                    });
                });

                console.log("markers");
                callback(markers);

            }
        );

    };


    handler.getMaxFileSizeSupported = function() {
        // .5 of current base_handler default
        return .5 * 10 * 1000 * 80;
    };


});
