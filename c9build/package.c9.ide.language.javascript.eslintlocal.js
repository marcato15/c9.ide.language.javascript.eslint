define("plugins/c9.ide.language.javascript.eslintlocal/package.c9.ide.language.javascript.eslintlocal", [], {
    "name": "c9.ide.language.javascript.eslintlocal",
    "description": "A local version of eslint for cloud 9",
    "version": "3.0.0",
    "author": "marcato15",
    "contributors": [],
    "repository": {
        "type": "git",
        "url": "http://github.com/marcato15/c9.ide.language.javascript.eslint.git"
    },
    "categories": [
        "core"
    ],
    "licenses": [
        "C9SDK"
    ],
    "c9": {
        "plugins": [
            {
                "packagePath": "plugins/c9.ide.language.javascript.eslintlocal/eslintlocal"
            }
        ]
    }
});

define("plugins/c9.ide.language.javascript.eslintlocal/eslintlocal",[], function(require, exports, module) {
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
