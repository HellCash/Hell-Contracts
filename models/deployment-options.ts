export abstract class DeploymentOptions {
    printLogs: boolean;
    initializeImplementation: boolean;
}

export const defaultDeploymentOptions: DeploymentOptions = {
    printLogs: true,
    initializeImplementation: true
}

export const testingEnvironmentDeploymentOptions: DeploymentOptions = {
    printLogs: false,
    initializeImplementation: false
}