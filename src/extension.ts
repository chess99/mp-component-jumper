import * as vscode from "vscode";
import { provideDefinition } from "./provider";

export const activate = (context: vscode.ExtensionContext) => {
  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(["wxml", "json"], {
      provideDefinition,
    })
  );
};

export const deactivate = () => {
  // pass
};
