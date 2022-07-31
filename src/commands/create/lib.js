import { formatText as formatLua } from "lua-fmt";
import { v4 as uuid } from "uuid";
import lua from "luaparse";
import luamin from "luamin";
import fs from "fs";

const lineSpaces = ["game", "author", "server_script", "ui_page"];

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
            file.body = file.body.filter(
                (p) => p.expression.base.name !== name
            );
            file.globals = file.globals.filter((g) => g.name !== name);
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

        return new Promise((resolve) => setTimeout(resolve, 500));
    }
}

export function updateBuildSettings(path, options) {
    if (path) {
        const filePath = `${path}/.build.json`;
        const file = JSON.parse(fs.readFileSync(filePath, "utf-8"));

        if (!options.server) {
            file.options = file.options.filter((v, i) => i !== 1);
        }

        if (!options.client) {
            file.options = file.options.filter((v, i) => i !== 0);
        }

        fs.writeFileSync(filePath, JSON.stringify(file, null, 4));

        return new Promise((resolve) => setTimeout(resolve, 250));
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
            packageFile.name = `@resource/${uuid()}-${options.name}`;
            if (uiPackageFile) {
                uiPackageFile.name = `@resource-ui/${uuid()}-${options.name}`;
            }
        }

        fs.writeFileSync(packagePath, JSON.stringify(packageFile, null, 4));
        if (uiPackageFile) {
            fs.writeFileSync(
                uiPackagePath,
                JSON.stringify(uiPackageFile, null, 4)
            );
        }

        return new Promise((resolve) => setTimeout(resolve, 750));
    }
}

export function removeDirectories(path) {
    if (path) {
        if (fs.existsSync(`${path}/src/server`)) {
            fs.rmSync(`${path}/src/server`, { recursive: true });
        }

        if (fs.existsSync(`${path}/src/client`)) {
            fs.rmSync(`${path}/src/client`, { recursive: true });
        }

        if (fs.existsSync(`${path}/src/ui`)) {
            fs.rmSync(`${path}/ui`, { recursive: true });
        }

        return new Promise((resolve) => setTimeout(resolve, 750));
    }
}
