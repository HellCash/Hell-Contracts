export abstract class DeploymentOptions {
    printLogs: boolean;
}

export const defaultDeploymentOptions: DeploymentOptions = {
    printLogs: true,
}

export const testingEnvironmentDeploymentOptions: DeploymentOptions = {
    printLogs: false,
}