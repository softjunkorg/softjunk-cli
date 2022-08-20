import { formatText as formatLua } from "lua-fmt";
import { v4 as uuid } from "uuid";
import lua from "luaparse";
import luamin from "luamin";
import fs from "fs";

const lineSpaces = ["game", "author", "server_script", "ui_page"];
const unnecessaryFiles = [
    ".github",
    ".editorconfig",
    ".gitattributes",
    ".prettierignore",
    ".prettierrc",
    "CODE_OF_CONDUCT.md",
    "LICENCE",
    "README.md",
];

export function updateFXManifest(path, options) {
    if (path) {
        var filePath = `${path}/fxmanifest.lua`;
        var file = lua.parse(fs.readFileSync(filePath, "utf-8"), {
            scope: true,
        });

        function setParam(name, value) {
            file.body.map(function (param, index) {
                if (param.expression.base.name === name) {
                    file.body[index].expression.argument.raw = `"${value}"`;
                }
            });
        }

        function deleteParam(name) {
            file.body = file.body.filter(p => p.expression.base.name !== name);
            file.globals = file.globals.filter(g => g.name !== name);
        }

        if (!options.server) {
            deleteParam("server_script");
        }

        if (!options.client) {
            deleteParam("client_script");
        }

        if (!options.ui) {
            deleteParam("ui_page");
            deleteParam("files");
        }

        if (options.data.name) {
            setParam("name", options.data.name);
        }

        const raw_data = formatLua(luamin.minify(file)).replace(/\n*$/, "");
        const lines = raw_data.split(/\r?\n/);
        const data = [];

        lines.map(function (line) {
            var value = line.split(" ")[0];

            if (lineSpaces.includes(line.split(" ")[0])) {
                if (value === "ui_page" && !options.server) {
                    return data.push(`\n${line}\n\n`);
                }

                if (value === "server_script" && !options.ui) {
                    return data.push(line);
                }

                return data.push(`${line}\n\n`);
            }

            data.push(`${line}\n`);
        });

        fs.writeFileSync(filePath, data.join(""));

        return new Promise(resolve => setTimeout(resolve, 500));
    }
}

export function updateBuildSettings(path, options) {
    if (path) {
        const filePath = `${path}/package.json`;
        const file = JSON.parse(fs.readFileSync(filePath, "utf-8"));

        if (!options.server) {
            file.builderSettings.options = file.builderSettings.options.filter(
                (v, i) => i !== 1,
            );
        }

        if (!options.client) {
            file.builderSettings.options = file.builderSettings.options.filter(
                (v, i) => i !== 0,
            );
        }

        fs.writeFileSync(filePath, JSON.stringify(file, null, 4));

        return new Promise(resolve => setTimeout(resolve, 250));
    }
}

export function updatePackages(path, options) {
    if (path) {
        const packagePath = `${path}/package.json`;
        const uiPackagePath = `${path}/ui/package.json`;
        const packageFile = JSON.parse(fs.readFileSync(packagePath, "utf-8"));
        const uiPackageFile = fs.existsSync(uiPackagePath)
            ? JSON.parse(fs.readFileSync(uiPackagePath, "utf-8"))
            : false;

        if (options.name) {
            packageFile.name = `@server-resources/${options.name}`;
            if (uiPackageFile) {
                uiPackageFile.name = `@server-resources-ui/${options.name}`;
            }
        }

        fs.writeFileSync(packagePath, JSON.stringify(packageFile, null, 4));
        if (uiPackageFile) {
            fs.writeFileSync(
                uiPackagePath,
                JSON.stringify(uiPackageFile, null, 4),
            );
        }

        return new Promise(resolve => setTimeout(resolve, 750));
    }
}

export function removeDirectories(path, options) {
    if (path) {
        if (options.server && fs.existsSync(`${path}/server`)) {
            fs.rmSync(`${path}/server`, { recursive: true });
        }

        if (options.client && fs.existsSync(`${path}/client`)) {
            fs.rmSync(`${path}/client`, { recursive: true });
        }

        if (options.ui && fs.existsSync(`${path}/ui`)) {
            fs.rmSync(`${path}/ui`, { recursive: true });
        }

        return new Promise(resolve => setTimeout(resolve, 750));
    }
}

export function deleteDevFiles(path) {
    if (path) {
        unnecessaryFiles.map(file => {
            if (fs.existsSync(`${path}/${file}`)) {
                fs.rmSync(`${path}/${file}`, { recursive: true });
            }
        });
    }
}
