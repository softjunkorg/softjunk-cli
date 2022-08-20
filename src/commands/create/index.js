import { Option } from "commander";
import { Listr } from "listr2";
import { execa } from "execa";
import * as Methods from "./lib.js";
import inquirer from "inquirer";
import boxen from "boxen";
import chalk from "chalk";
import fs from "fs";

export default {
    name: "create",
    description: "Create a resource, it shows options for you.",
    handler: async function () {
        const answers = await inquirer.prompt([
            {
                type: "input",
                name: "resource",
                message: "What is the name of the resource?",
                suffix: "",
                validate: function (input) {
                    if (!input) {
                        return "You need to specify a resource name!";
                    }

                    if (input) {
                        if (fs.existsSync(`./${input}`)) {
                            return "This resource already exists!";
                        }
                    }

                    return true;
                },
            },
            {
                type: "confirm",
                name: "init_git",
                message: "Do you want to initialize git?",
                suffix: "",
                default: true,
            },
            {
                type: "checkbox",
                name: "types",
                message: "Select what do you need on the resource:",
                suffix: "",
                choices: [
                    { type: "choice", name: "Client", value: "client" },
                    { type: "choice", name: "Server", value: "server" },
                    { type: "choice", name: "UI", value: "ui" },
                ],
                default: ["client", "server", "ui"],
                validate: function (input) {
                    if (input.length === 0) {
                        return "You need to select at least one!";
                    }

                    if (
                        !input.includes("client") &&
                        !input.includes("server")
                    ) {
                        return "The resource must have an client-side or server-side";
                    }

                    return true;
                },
            },
            {
                type: "confirm",
                name: "delete_dev_files",
                message:
                    "Do you want to delete dev files? (ESLint, Prettier, ...)",
                suffix: "",
                default: true,
            },
        ]);

        const tasks = new Listr(
            [
                {
                    title: `Creating the resource ${answers["resource"]}`,
                    task: async function () {
                        await execa("git", [
                            "clone",
                            "https://github.com/softjunkorg/boilerplate.git",
                            answers["resource"],
                        ]);
                    },
                },
                {
                    enabled: answers["init_git"],
                    title: "Creating a .git file",
                    task: async function () {
                        await execa("git", ["init"], {
                            cwd: `./${answers["resource"]}`,
                        });
                    },
                },
                {
                    title: "Setting up the FXManifest file",
                    task: async function () {
                        await Methods.updateFXManifest(
                            `./${answers["resource"]}`,
                            {
                                client: answers["types"].includes("client"),
                                server: answers["types"].includes("server"),
                                ui: answers["types"].includes("ui"),
                                data: {
                                    name: answers["resource"],
                                },
                            },
                        );
                    },
                },
                {
                    title: "Removing unnecessary files",
                    task: async function () {
                        await Methods.removeDirectories(
                            `./${answers["resource"]}`,
                            {
                                server: !answers["types"].includes("server"),
                                client: !answers["types"].includes("client"),
                                ui: !answers["types"].includes("ui"),
                            },
                        );
                    },
                },
                {
                    enabled: answers["delete_dev_files"],
                    title: "Deleting dev files",
                    task: async function () {
                        await Methods.deleteDevFiles(
                            `./${answers["resource"]}`,
                        );
                    },
                },
                {
                    title: "Creating package names",
                    task: async function () {
                        await Methods.updatePackages(
                            `./${answers["resource"]}`,
                            {
                                name: answers["resource"],
                            },
                        );
                    },
                },
            ],
            { concurrent: false },
        );

        await tasks.run();

        console.clear();
        console.log(
            boxen(
                `The resource ${chalk.green.bold(
                    answers["resource"],
                )} was created!`,
                {
                    padding: 1,
                    borderStyle: "round",
                    borderColor: "green",
                },
            ),
        );
    },
};
