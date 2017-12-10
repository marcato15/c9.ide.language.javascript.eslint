/**
 * Cloud9 Language Foundation
 *
 * @copyright 2013, Ajax.org B.V.
 */
define(function(require, exports, module) {
    main.consumes = ["language","Plugin"];
    main.provides = ["eslintlocal"];

    function main(options, imports, register) {
        var Plugin = imports.Plugin;
        var language = imports.language;

        var plugin = new Plugin("eslintlocal", main.consumes);

        plugin.on("load", function () {
            language.unregisterLanguageHandler("plugins/c9.ide.language.javascript.eslint/worker/eslint_worker");
            language.registerLanguageHandler("plugins/c9.ide.language.javascript.eslintlocal/worker/eslintlocal_worker");
        });

        plugin.on("unload", function () {
            language.unregisterLanguageHandler("plugins/c9.ide.language.javascript.eslintlocal/worker/eslintlocal_worker");
            language.registerLanguageHandler("plugins/c9.ide.language.javascript.eslint/worker/eslint_worker");
        });

        
        register(null, {eslintlocal: plugin});
    }
    
    return main;
});
