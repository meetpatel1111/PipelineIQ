import { Logger } from 'pino';
import { z } from 'zod';

declare const FailureSourceSchema: z.ZodEnum<["github", "azure-devops"]>;
type FailureSource = z.infer<typeof FailureSourceSchema>;
declare const RepositorySchema: z.ZodObject<{
    owner: z.ZodString;
    name: z.ZodString;
    url: z.ZodString;
    defaultBranch: z.ZodOptional<z.ZodString>;
    id: z.ZodOptional<z.ZodString>;
    ownerId: z.ZodOptional<z.ZodString>;
    provider: z.ZodOptional<z.ZodString>;
    visibility: z.ZodOptional<z.ZodString>;
    clean: z.ZodOptional<z.ZodString>;
    tfvcWorkspace: z.ZodOptional<z.ZodString>;
    gitSubmoduleCheckout: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    owner: string;
    name: string;
    url: string;
    defaultBranch?: string | undefined;
    id?: string | undefined;
    ownerId?: string | undefined;
    provider?: string | undefined;
    visibility?: string | undefined;
    clean?: string | undefined;
    tfvcWorkspace?: string | undefined;
    gitSubmoduleCheckout?: string | undefined;
}, {
    owner: string;
    name: string;
    url: string;
    defaultBranch?: string | undefined;
    id?: string | undefined;
    ownerId?: string | undefined;
    provider?: string | undefined;
    visibility?: string | undefined;
    clean?: string | undefined;
    tfvcWorkspace?: string | undefined;
    gitSubmoduleCheckout?: string | undefined;
}>;
type Repository = z.infer<typeof RepositorySchema>;
declare const CommitSchema: z.ZodObject<{
    sha: z.ZodString;
    url: z.ZodString;
    message: z.ZodOptional<z.ZodString>;
    author: z.ZodOptional<z.ZodString>;
    authorEmail: z.ZodOptional<z.ZodString>;
    requestedForId: z.ZodOptional<z.ZodString>;
    queuedById: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    url: string;
    sha: string;
    message?: string | undefined;
    author?: string | undefined;
    authorEmail?: string | undefined;
    requestedForId?: string | undefined;
    queuedById?: string | undefined;
}, {
    url: string;
    sha: string;
    message?: string | undefined;
    author?: string | undefined;
    authorEmail?: string | undefined;
    requestedForId?: string | undefined;
    queuedById?: string | undefined;
}>;
type Commit = z.infer<typeof CommitSchema>;
declare const PullRequestSchema: z.ZodObject<{
    number: z.ZodNumber;
    url: z.ZodString;
    title: z.ZodString;
    author: z.ZodString;
}, "strip", z.ZodTypeAny, {
    number: number;
    url: string;
    author: string;
    title: string;
}, {
    number: number;
    url: string;
    author: string;
    title: string;
}>;
type PullRequest = z.infer<typeof PullRequestSchema>;
declare const PipelineSchema: z.ZodObject<{
    name: z.ZodString;
    url: z.ZodString;
    runUrl: z.ZodOptional<z.ZodString>;
    runId: z.ZodString;
    runNumber: z.ZodOptional<z.ZodNumber>;
    stage: z.ZodOptional<z.ZodString>;
    job: z.ZodOptional<z.ZodString>;
    step: z.ZodOptional<z.ZodString>;
    task: z.ZodOptional<z.ZodString>;
    runnerType: z.ZodOptional<z.ZodString>;
    runnerOs: z.ZodOptional<z.ZodString>;
    runnerArch: z.ZodOptional<z.ZodString>;
    agentPool: z.ZodOptional<z.ZodString>;
    runnerName: z.ZodOptional<z.ZodString>;
    agentMachineName: z.ZodOptional<z.ZodString>;
    retryCount: z.ZodOptional<z.ZodNumber>;
    runAttempt: z.ZodOptional<z.ZodNumber>;
    jobName: z.ZodOptional<z.ZodString>;
    definitionVersion: z.ZodOptional<z.ZodString>;
    definitionId: z.ZodOptional<z.ZodString>;
    reason: z.ZodOptional<z.ZodString>;
    sourcesDirectory: z.ZodOptional<z.ZodString>;
    binariesDirectory: z.ZodOptional<z.ZodString>;
    artifactStagingDirectory: z.ZodOptional<z.ZodString>;
    containerId: z.ZodOptional<z.ZodString>;
    repositoryLocalPath: z.ZodOptional<z.ZodString>;
    workflowRef: z.ZodOptional<z.ZodString>;
    workflowSha: z.ZodOptional<z.ZodString>;
    runnerEnvironment: z.ZodOptional<z.ZodString>;
    runnerDebug: z.ZodOptional<z.ZodBoolean>;
    retentionDays: z.ZodOptional<z.ZodNumber>;
    actorId: z.ZodOptional<z.ZodString>;
    triggeringActor: z.ZodOptional<z.ZodString>;
    triggeringActorId: z.ZodOptional<z.ZodString>;
    refType: z.ZodOptional<z.ZodString>;
    refProtected: z.ZodOptional<z.ZodBoolean>;
    agentId: z.ZodOptional<z.ZodString>;
    agentJobStatus: z.ZodOptional<z.ZodString>;
    agentBuildDirectory: z.ZodOptional<z.ZodString>;
    agentHomeDirectory: z.ZodOptional<z.ZodString>;
    agentTempDirectory: z.ZodOptional<z.ZodString>;
    agentToolsDirectory: z.ZodOptional<z.ZodString>;
    agentWorkFolder: z.ZodOptional<z.ZodString>;
    agentContainerMapping: z.ZodOptional<z.ZodString>;
    agentReleaseDirectory: z.ZodOptional<z.ZodString>;
    agentRootDirectory: z.ZodOptional<z.ZodString>;
    stagingDirectory: z.ZodOptional<z.ZodString>;
    testResultsDirectory: z.ZodOptional<z.ZodString>;
    cronScheduleDisplayName: z.ZodOptional<z.ZodString>;
    pipelineWorkspace: z.ZodOptional<z.ZodString>;
    stageRequestedBy: z.ZodOptional<z.ZodString>;
    stageRequestedForId: z.ZodOptional<z.ZodString>;
    sourceTfvcShelveset: z.ZodOptional<z.ZodString>;
    triggeredByBuildId: z.ZodOptional<z.ZodString>;
    triggeredByDefinitionId: z.ZodOptional<z.ZodString>;
    triggeredByDefinitionName: z.ZodOptional<z.ZodString>;
    triggeredByBuildNumber: z.ZodOptional<z.ZodString>;
    triggeredByProjectId: z.ZodOptional<z.ZodString>;
    teamProjectId: z.ZodOptional<z.ZodString>;
    teamProject: z.ZodOptional<z.ZodString>;
    buildUri: z.ZodOptional<z.ZodString>;
    buildNumber: z.ZodOptional<z.ZodString>;
    environmentId: z.ZodOptional<z.ZodString>;
    environmentResourceName: z.ZodOptional<z.ZodString>;
    environmentResourceId: z.ZodOptional<z.ZodString>;
    strategyName: z.ZodOptional<z.ZodString>;
    strategyCycleName: z.ZodOptional<z.ZodString>;
    checksStageAttempt: z.ZodOptional<z.ZodString>;
    systemWorkFolder: z.ZodOptional<z.ZodString>;
    systemCollectionId: z.ZodOptional<z.ZodString>;
    systemCollectionUri: z.ZodOptional<z.ZodString>;
    systemTeamFoundationCollectionUri: z.ZodOptional<z.ZodString>;
    systemDebug: z.ZodOptional<z.ZodString>;
    systemDefaultWorkingDirectory: z.ZodOptional<z.ZodString>;
    systemHostType: z.ZodOptional<z.ZodString>;
    systemJobDisplayName: z.ZodOptional<z.ZodString>;
    systemJobId: z.ZodOptional<z.ZodString>;
    systemJobName: z.ZodOptional<z.ZodString>;
    systemPhaseAttempt: z.ZodOptional<z.ZodString>;
    systemPhaseDisplayName: z.ZodOptional<z.ZodString>;
    systemPhaseName: z.ZodOptional<z.ZodString>;
    systemPlanId: z.ZodOptional<z.ZodString>;
    systemStageAttempt: z.ZodOptional<z.ZodString>;
    systemStageDisplayName: z.ZodOptional<z.ZodString>;
    systemStageName: z.ZodOptional<z.ZodString>;
    systemTimelineId: z.ZodOptional<z.ZodString>;
    tfBuild: z.ZodOptional<z.ZodString>;
    prIsFork: z.ZodOptional<z.ZodString>;
    prId: z.ZodOptional<z.ZodString>;
    prNumber: z.ZodOptional<z.ZodString>;
    prTargetBranchName: z.ZodOptional<z.ZodString>;
    prSourceBranch: z.ZodOptional<z.ZodString>;
    prSourceCommitId: z.ZodOptional<z.ZodString>;
    prSourceRepoUri: z.ZodOptional<z.ZodString>;
    prTargetBranch: z.ZodOptional<z.ZodString>;
    releaseDeploymentRequestedFor: z.ZodOptional<z.ZodString>;
    releaseDeploymentRequestedForEmail: z.ZodOptional<z.ZodString>;
    releaseDeploymentId: z.ZodOptional<z.ZodString>;
    releaseDefinitionEnvironmentId: z.ZodOptional<z.ZodString>;
    releaseDefinitionId: z.ZodOptional<z.ZodString>;
    releaseDefinitionName: z.ZodOptional<z.ZodString>;
    releaseEnvironmentId: z.ZodOptional<z.ZodString>;
    releaseEnvironmentName: z.ZodOptional<z.ZodString>;
    releasePrimaryArtifactSourceAlias: z.ZodOptional<z.ZodString>;
    releaseDescription: z.ZodOptional<z.ZodString>;
    releaseId: z.ZodOptional<z.ZodString>;
    requestedFor: z.ZodOptional<z.ZodString>;
    requestedForEmail: z.ZodOptional<z.ZodString>;
    requestedForId: z.ZodOptional<z.ZodString>;
    queuedBy: z.ZodOptional<z.ZodString>;
    queuedById: z.ZodOptional<z.ZodString>;
    sourceBranchName: z.ZodOptional<z.ZodString>;
    fullSourceBranch: z.ZodOptional<z.ZodString>;
    sourceVersionMessage: z.ZodOptional<z.ZodString>;
    repositoryId: z.ZodOptional<z.ZodString>;
    repositoryProvider: z.ZodOptional<z.ZodString>;
    repositoryUri: z.ZodOptional<z.ZodString>;
    releaseName: z.ZodOptional<z.ZodString>;
    releaseUri: z.ZodOptional<z.ZodString>;
    releaseArtifacts: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    triggerId: z.ZodOptional<z.ZodString>;
    triggerName: z.ZodOptional<z.ZodString>;
    action: z.ZodOptional<z.ZodString>;
    actionPath: z.ZodOptional<z.ZodString>;
    actionRepository: z.ZodOptional<z.ZodString>;
    baseRef: z.ZodOptional<z.ZodString>;
    headRef: z.ZodOptional<z.ZodString>;
    runnerTemp: z.ZodOptional<z.ZodString>;
    runnerToolCache: z.ZodOptional<z.ZodString>;
    runnerWorkspace: z.ZodOptional<z.ZodString>;
    workspace: z.ZodOptional<z.ZodString>;
    jobStatus: z.ZodOptional<z.ZodString>;
    jobContainer: z.ZodOptional<z.ZodString>;
    jobServices: z.ZodOptional<z.ZodString>;
    strategyJobIndex: z.ZodOptional<z.ZodNumber>;
    strategyJobTotal: z.ZodOptional<z.ZodNumber>;
    actionRef: z.ZodOptional<z.ZodString>;
    actionStatus: z.ZodOptional<z.ZodString>;
    repositoryGitUrl: z.ZodOptional<z.ZodString>;
    repositoryClean: z.ZodOptional<z.ZodString>;
    repositoryGitSubmoduleCheckout: z.ZodOptional<z.ZodString>;
    secretSource: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    url: string;
    runId: string;
    requestedForId?: string | undefined;
    queuedById?: string | undefined;
    runUrl?: string | undefined;
    runNumber?: number | undefined;
    stage?: string | undefined;
    job?: string | undefined;
    step?: string | undefined;
    task?: string | undefined;
    runnerType?: string | undefined;
    runnerOs?: string | undefined;
    runnerArch?: string | undefined;
    agentPool?: string | undefined;
    runnerName?: string | undefined;
    agentMachineName?: string | undefined;
    retryCount?: number | undefined;
    runAttempt?: number | undefined;
    jobName?: string | undefined;
    definitionVersion?: string | undefined;
    definitionId?: string | undefined;
    reason?: string | undefined;
    sourcesDirectory?: string | undefined;
    binariesDirectory?: string | undefined;
    artifactStagingDirectory?: string | undefined;
    containerId?: string | undefined;
    repositoryLocalPath?: string | undefined;
    workflowRef?: string | undefined;
    workflowSha?: string | undefined;
    runnerEnvironment?: string | undefined;
    runnerDebug?: boolean | undefined;
    retentionDays?: number | undefined;
    actorId?: string | undefined;
    triggeringActor?: string | undefined;
    triggeringActorId?: string | undefined;
    refType?: string | undefined;
    refProtected?: boolean | undefined;
    agentId?: string | undefined;
    agentJobStatus?: string | undefined;
    agentBuildDirectory?: string | undefined;
    agentHomeDirectory?: string | undefined;
    agentTempDirectory?: string | undefined;
    agentToolsDirectory?: string | undefined;
    agentWorkFolder?: string | undefined;
    agentContainerMapping?: string | undefined;
    agentReleaseDirectory?: string | undefined;
    agentRootDirectory?: string | undefined;
    stagingDirectory?: string | undefined;
    testResultsDirectory?: string | undefined;
    cronScheduleDisplayName?: string | undefined;
    pipelineWorkspace?: string | undefined;
    stageRequestedBy?: string | undefined;
    stageRequestedForId?: string | undefined;
    sourceTfvcShelveset?: string | undefined;
    triggeredByBuildId?: string | undefined;
    triggeredByDefinitionId?: string | undefined;
    triggeredByDefinitionName?: string | undefined;
    triggeredByBuildNumber?: string | undefined;
    triggeredByProjectId?: string | undefined;
    teamProjectId?: string | undefined;
    teamProject?: string | undefined;
    buildUri?: string | undefined;
    buildNumber?: string | undefined;
    environmentId?: string | undefined;
    environmentResourceName?: string | undefined;
    environmentResourceId?: string | undefined;
    strategyName?: string | undefined;
    strategyCycleName?: string | undefined;
    checksStageAttempt?: string | undefined;
    systemWorkFolder?: string | undefined;
    systemCollectionId?: string | undefined;
    systemCollectionUri?: string | undefined;
    systemTeamFoundationCollectionUri?: string | undefined;
    systemDebug?: string | undefined;
    systemDefaultWorkingDirectory?: string | undefined;
    systemHostType?: string | undefined;
    systemJobDisplayName?: string | undefined;
    systemJobId?: string | undefined;
    systemJobName?: string | undefined;
    systemPhaseAttempt?: string | undefined;
    systemPhaseDisplayName?: string | undefined;
    systemPhaseName?: string | undefined;
    systemPlanId?: string | undefined;
    systemStageAttempt?: string | undefined;
    systemStageDisplayName?: string | undefined;
    systemStageName?: string | undefined;
    systemTimelineId?: string | undefined;
    tfBuild?: string | undefined;
    prIsFork?: string | undefined;
    prId?: string | undefined;
    prNumber?: string | undefined;
    prTargetBranchName?: string | undefined;
    prSourceBranch?: string | undefined;
    prSourceCommitId?: string | undefined;
    prSourceRepoUri?: string | undefined;
    prTargetBranch?: string | undefined;
    releaseDeploymentRequestedFor?: string | undefined;
    releaseDeploymentRequestedForEmail?: string | undefined;
    releaseDeploymentId?: string | undefined;
    releaseDefinitionEnvironmentId?: string | undefined;
    releaseDefinitionId?: string | undefined;
    releaseDefinitionName?: string | undefined;
    releaseEnvironmentId?: string | undefined;
    releaseEnvironmentName?: string | undefined;
    releasePrimaryArtifactSourceAlias?: string | undefined;
    releaseDescription?: string | undefined;
    releaseId?: string | undefined;
    requestedFor?: string | undefined;
    requestedForEmail?: string | undefined;
    queuedBy?: string | undefined;
    sourceBranchName?: string | undefined;
    fullSourceBranch?: string | undefined;
    sourceVersionMessage?: string | undefined;
    repositoryId?: string | undefined;
    repositoryProvider?: string | undefined;
    repositoryUri?: string | undefined;
    releaseName?: string | undefined;
    releaseUri?: string | undefined;
    releaseArtifacts?: Record<string, any> | undefined;
    triggerId?: string | undefined;
    triggerName?: string | undefined;
    action?: string | undefined;
    actionPath?: string | undefined;
    actionRepository?: string | undefined;
    baseRef?: string | undefined;
    headRef?: string | undefined;
    runnerTemp?: string | undefined;
    runnerToolCache?: string | undefined;
    runnerWorkspace?: string | undefined;
    workspace?: string | undefined;
    jobStatus?: string | undefined;
    jobContainer?: string | undefined;
    jobServices?: string | undefined;
    strategyJobIndex?: number | undefined;
    strategyJobTotal?: number | undefined;
    actionRef?: string | undefined;
    actionStatus?: string | undefined;
    repositoryGitUrl?: string | undefined;
    repositoryClean?: string | undefined;
    repositoryGitSubmoduleCheckout?: string | undefined;
    secretSource?: string | undefined;
}, {
    name: string;
    url: string;
    runId: string;
    requestedForId?: string | undefined;
    queuedById?: string | undefined;
    runUrl?: string | undefined;
    runNumber?: number | undefined;
    stage?: string | undefined;
    job?: string | undefined;
    step?: string | undefined;
    task?: string | undefined;
    runnerType?: string | undefined;
    runnerOs?: string | undefined;
    runnerArch?: string | undefined;
    agentPool?: string | undefined;
    runnerName?: string | undefined;
    agentMachineName?: string | undefined;
    retryCount?: number | undefined;
    runAttempt?: number | undefined;
    jobName?: string | undefined;
    definitionVersion?: string | undefined;
    definitionId?: string | undefined;
    reason?: string | undefined;
    sourcesDirectory?: string | undefined;
    binariesDirectory?: string | undefined;
    artifactStagingDirectory?: string | undefined;
    containerId?: string | undefined;
    repositoryLocalPath?: string | undefined;
    workflowRef?: string | undefined;
    workflowSha?: string | undefined;
    runnerEnvironment?: string | undefined;
    runnerDebug?: boolean | undefined;
    retentionDays?: number | undefined;
    actorId?: string | undefined;
    triggeringActor?: string | undefined;
    triggeringActorId?: string | undefined;
    refType?: string | undefined;
    refProtected?: boolean | undefined;
    agentId?: string | undefined;
    agentJobStatus?: string | undefined;
    agentBuildDirectory?: string | undefined;
    agentHomeDirectory?: string | undefined;
    agentTempDirectory?: string | undefined;
    agentToolsDirectory?: string | undefined;
    agentWorkFolder?: string | undefined;
    agentContainerMapping?: string | undefined;
    agentReleaseDirectory?: string | undefined;
    agentRootDirectory?: string | undefined;
    stagingDirectory?: string | undefined;
    testResultsDirectory?: string | undefined;
    cronScheduleDisplayName?: string | undefined;
    pipelineWorkspace?: string | undefined;
    stageRequestedBy?: string | undefined;
    stageRequestedForId?: string | undefined;
    sourceTfvcShelveset?: string | undefined;
    triggeredByBuildId?: string | undefined;
    triggeredByDefinitionId?: string | undefined;
    triggeredByDefinitionName?: string | undefined;
    triggeredByBuildNumber?: string | undefined;
    triggeredByProjectId?: string | undefined;
    teamProjectId?: string | undefined;
    teamProject?: string | undefined;
    buildUri?: string | undefined;
    buildNumber?: string | undefined;
    environmentId?: string | undefined;
    environmentResourceName?: string | undefined;
    environmentResourceId?: string | undefined;
    strategyName?: string | undefined;
    strategyCycleName?: string | undefined;
    checksStageAttempt?: string | undefined;
    systemWorkFolder?: string | undefined;
    systemCollectionId?: string | undefined;
    systemCollectionUri?: string | undefined;
    systemTeamFoundationCollectionUri?: string | undefined;
    systemDebug?: string | undefined;
    systemDefaultWorkingDirectory?: string | undefined;
    systemHostType?: string | undefined;
    systemJobDisplayName?: string | undefined;
    systemJobId?: string | undefined;
    systemJobName?: string | undefined;
    systemPhaseAttempt?: string | undefined;
    systemPhaseDisplayName?: string | undefined;
    systemPhaseName?: string | undefined;
    systemPlanId?: string | undefined;
    systemStageAttempt?: string | undefined;
    systemStageDisplayName?: string | undefined;
    systemStageName?: string | undefined;
    systemTimelineId?: string | undefined;
    tfBuild?: string | undefined;
    prIsFork?: string | undefined;
    prId?: string | undefined;
    prNumber?: string | undefined;
    prTargetBranchName?: string | undefined;
    prSourceBranch?: string | undefined;
    prSourceCommitId?: string | undefined;
    prSourceRepoUri?: string | undefined;
    prTargetBranch?: string | undefined;
    releaseDeploymentRequestedFor?: string | undefined;
    releaseDeploymentRequestedForEmail?: string | undefined;
    releaseDeploymentId?: string | undefined;
    releaseDefinitionEnvironmentId?: string | undefined;
    releaseDefinitionId?: string | undefined;
    releaseDefinitionName?: string | undefined;
    releaseEnvironmentId?: string | undefined;
    releaseEnvironmentName?: string | undefined;
    releasePrimaryArtifactSourceAlias?: string | undefined;
    releaseDescription?: string | undefined;
    releaseId?: string | undefined;
    requestedFor?: string | undefined;
    requestedForEmail?: string | undefined;
    queuedBy?: string | undefined;
    sourceBranchName?: string | undefined;
    fullSourceBranch?: string | undefined;
    sourceVersionMessage?: string | undefined;
    repositoryId?: string | undefined;
    repositoryProvider?: string | undefined;
    repositoryUri?: string | undefined;
    releaseName?: string | undefined;
    releaseUri?: string | undefined;
    releaseArtifacts?: Record<string, any> | undefined;
    triggerId?: string | undefined;
    triggerName?: string | undefined;
    action?: string | undefined;
    actionPath?: string | undefined;
    actionRepository?: string | undefined;
    baseRef?: string | undefined;
    headRef?: string | undefined;
    runnerTemp?: string | undefined;
    runnerToolCache?: string | undefined;
    runnerWorkspace?: string | undefined;
    workspace?: string | undefined;
    jobStatus?: string | undefined;
    jobContainer?: string | undefined;
    jobServices?: string | undefined;
    strategyJobIndex?: number | undefined;
    strategyJobTotal?: number | undefined;
    actionRef?: string | undefined;
    actionStatus?: string | undefined;
    repositoryGitUrl?: string | undefined;
    repositoryClean?: string | undefined;
    repositoryGitSubmoduleCheckout?: string | undefined;
    secretSource?: string | undefined;
}>;
type Pipeline = z.infer<typeof PipelineSchema>;
declare const FailureDetailsSchema: z.ZodObject<{
    exitCode: z.ZodOptional<z.ZodNumber>;
    errorMessage: z.ZodOptional<z.ZodString>;
    failedStep: z.ZodOptional<z.ZodString>;
    failedCommand: z.ZodOptional<z.ZodString>;
    stackTrace: z.ZodOptional<z.ZodString>;
    logs: z.ZodDefault<z.ZodString>;
    logsTruncated: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    logs: string;
    logsTruncated: boolean;
    exitCode?: number | undefined;
    errorMessage?: string | undefined;
    failedStep?: string | undefined;
    failedCommand?: string | undefined;
    stackTrace?: string | undefined;
}, {
    exitCode?: number | undefined;
    errorMessage?: string | undefined;
    failedStep?: string | undefined;
    failedCommand?: string | undefined;
    stackTrace?: string | undefined;
    logs?: string | undefined;
    logsTruncated?: boolean | undefined;
}>;
type FailureDetails = z.infer<typeof FailureDetailsSchema>;
declare const FailureEventSchema: z.ZodObject<{
    source: z.ZodEnum<["github", "azure-devops"]>;
    startedAt: z.ZodString;
    failedAt: z.ZodString;
    durationMs: z.ZodOptional<z.ZodNumber>;
    queueTimeMs: z.ZodOptional<z.ZodNumber>;
    pipeline: z.ZodObject<{
        name: z.ZodString;
        url: z.ZodString;
        runUrl: z.ZodOptional<z.ZodString>;
        runId: z.ZodString;
        runNumber: z.ZodOptional<z.ZodNumber>;
        stage: z.ZodOptional<z.ZodString>;
        job: z.ZodOptional<z.ZodString>;
        step: z.ZodOptional<z.ZodString>;
        task: z.ZodOptional<z.ZodString>;
        runnerType: z.ZodOptional<z.ZodString>;
        runnerOs: z.ZodOptional<z.ZodString>;
        runnerArch: z.ZodOptional<z.ZodString>;
        agentPool: z.ZodOptional<z.ZodString>;
        runnerName: z.ZodOptional<z.ZodString>;
        agentMachineName: z.ZodOptional<z.ZodString>;
        retryCount: z.ZodOptional<z.ZodNumber>;
        runAttempt: z.ZodOptional<z.ZodNumber>;
        jobName: z.ZodOptional<z.ZodString>;
        definitionVersion: z.ZodOptional<z.ZodString>;
        definitionId: z.ZodOptional<z.ZodString>;
        reason: z.ZodOptional<z.ZodString>;
        sourcesDirectory: z.ZodOptional<z.ZodString>;
        binariesDirectory: z.ZodOptional<z.ZodString>;
        artifactStagingDirectory: z.ZodOptional<z.ZodString>;
        containerId: z.ZodOptional<z.ZodString>;
        repositoryLocalPath: z.ZodOptional<z.ZodString>;
        workflowRef: z.ZodOptional<z.ZodString>;
        workflowSha: z.ZodOptional<z.ZodString>;
        runnerEnvironment: z.ZodOptional<z.ZodString>;
        runnerDebug: z.ZodOptional<z.ZodBoolean>;
        retentionDays: z.ZodOptional<z.ZodNumber>;
        actorId: z.ZodOptional<z.ZodString>;
        triggeringActor: z.ZodOptional<z.ZodString>;
        triggeringActorId: z.ZodOptional<z.ZodString>;
        refType: z.ZodOptional<z.ZodString>;
        refProtected: z.ZodOptional<z.ZodBoolean>;
        agentId: z.ZodOptional<z.ZodString>;
        agentJobStatus: z.ZodOptional<z.ZodString>;
        agentBuildDirectory: z.ZodOptional<z.ZodString>;
        agentHomeDirectory: z.ZodOptional<z.ZodString>;
        agentTempDirectory: z.ZodOptional<z.ZodString>;
        agentToolsDirectory: z.ZodOptional<z.ZodString>;
        agentWorkFolder: z.ZodOptional<z.ZodString>;
        agentContainerMapping: z.ZodOptional<z.ZodString>;
        agentReleaseDirectory: z.ZodOptional<z.ZodString>;
        agentRootDirectory: z.ZodOptional<z.ZodString>;
        stagingDirectory: z.ZodOptional<z.ZodString>;
        testResultsDirectory: z.ZodOptional<z.ZodString>;
        cronScheduleDisplayName: z.ZodOptional<z.ZodString>;
        pipelineWorkspace: z.ZodOptional<z.ZodString>;
        stageRequestedBy: z.ZodOptional<z.ZodString>;
        stageRequestedForId: z.ZodOptional<z.ZodString>;
        sourceTfvcShelveset: z.ZodOptional<z.ZodString>;
        triggeredByBuildId: z.ZodOptional<z.ZodString>;
        triggeredByDefinitionId: z.ZodOptional<z.ZodString>;
        triggeredByDefinitionName: z.ZodOptional<z.ZodString>;
        triggeredByBuildNumber: z.ZodOptional<z.ZodString>;
        triggeredByProjectId: z.ZodOptional<z.ZodString>;
        teamProjectId: z.ZodOptional<z.ZodString>;
        teamProject: z.ZodOptional<z.ZodString>;
        buildUri: z.ZodOptional<z.ZodString>;
        buildNumber: z.ZodOptional<z.ZodString>;
        environmentId: z.ZodOptional<z.ZodString>;
        environmentResourceName: z.ZodOptional<z.ZodString>;
        environmentResourceId: z.ZodOptional<z.ZodString>;
        strategyName: z.ZodOptional<z.ZodString>;
        strategyCycleName: z.ZodOptional<z.ZodString>;
        checksStageAttempt: z.ZodOptional<z.ZodString>;
        systemWorkFolder: z.ZodOptional<z.ZodString>;
        systemCollectionId: z.ZodOptional<z.ZodString>;
        systemCollectionUri: z.ZodOptional<z.ZodString>;
        systemTeamFoundationCollectionUri: z.ZodOptional<z.ZodString>;
        systemDebug: z.ZodOptional<z.ZodString>;
        systemDefaultWorkingDirectory: z.ZodOptional<z.ZodString>;
        systemHostType: z.ZodOptional<z.ZodString>;
        systemJobDisplayName: z.ZodOptional<z.ZodString>;
        systemJobId: z.ZodOptional<z.ZodString>;
        systemJobName: z.ZodOptional<z.ZodString>;
        systemPhaseAttempt: z.ZodOptional<z.ZodString>;
        systemPhaseDisplayName: z.ZodOptional<z.ZodString>;
        systemPhaseName: z.ZodOptional<z.ZodString>;
        systemPlanId: z.ZodOptional<z.ZodString>;
        systemStageAttempt: z.ZodOptional<z.ZodString>;
        systemStageDisplayName: z.ZodOptional<z.ZodString>;
        systemStageName: z.ZodOptional<z.ZodString>;
        systemTimelineId: z.ZodOptional<z.ZodString>;
        tfBuild: z.ZodOptional<z.ZodString>;
        prIsFork: z.ZodOptional<z.ZodString>;
        prId: z.ZodOptional<z.ZodString>;
        prNumber: z.ZodOptional<z.ZodString>;
        prTargetBranchName: z.ZodOptional<z.ZodString>;
        prSourceBranch: z.ZodOptional<z.ZodString>;
        prSourceCommitId: z.ZodOptional<z.ZodString>;
        prSourceRepoUri: z.ZodOptional<z.ZodString>;
        prTargetBranch: z.ZodOptional<z.ZodString>;
        releaseDeploymentRequestedFor: z.ZodOptional<z.ZodString>;
        releaseDeploymentRequestedForEmail: z.ZodOptional<z.ZodString>;
        releaseDeploymentId: z.ZodOptional<z.ZodString>;
        releaseDefinitionEnvironmentId: z.ZodOptional<z.ZodString>;
        releaseDefinitionId: z.ZodOptional<z.ZodString>;
        releaseDefinitionName: z.ZodOptional<z.ZodString>;
        releaseEnvironmentId: z.ZodOptional<z.ZodString>;
        releaseEnvironmentName: z.ZodOptional<z.ZodString>;
        releasePrimaryArtifactSourceAlias: z.ZodOptional<z.ZodString>;
        releaseDescription: z.ZodOptional<z.ZodString>;
        releaseId: z.ZodOptional<z.ZodString>;
        requestedFor: z.ZodOptional<z.ZodString>;
        requestedForEmail: z.ZodOptional<z.ZodString>;
        requestedForId: z.ZodOptional<z.ZodString>;
        queuedBy: z.ZodOptional<z.ZodString>;
        queuedById: z.ZodOptional<z.ZodString>;
        sourceBranchName: z.ZodOptional<z.ZodString>;
        fullSourceBranch: z.ZodOptional<z.ZodString>;
        sourceVersionMessage: z.ZodOptional<z.ZodString>;
        repositoryId: z.ZodOptional<z.ZodString>;
        repositoryProvider: z.ZodOptional<z.ZodString>;
        repositoryUri: z.ZodOptional<z.ZodString>;
        releaseName: z.ZodOptional<z.ZodString>;
        releaseUri: z.ZodOptional<z.ZodString>;
        releaseArtifacts: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        triggerId: z.ZodOptional<z.ZodString>;
        triggerName: z.ZodOptional<z.ZodString>;
        action: z.ZodOptional<z.ZodString>;
        actionPath: z.ZodOptional<z.ZodString>;
        actionRepository: z.ZodOptional<z.ZodString>;
        baseRef: z.ZodOptional<z.ZodString>;
        headRef: z.ZodOptional<z.ZodString>;
        runnerTemp: z.ZodOptional<z.ZodString>;
        runnerToolCache: z.ZodOptional<z.ZodString>;
        runnerWorkspace: z.ZodOptional<z.ZodString>;
        workspace: z.ZodOptional<z.ZodString>;
        jobStatus: z.ZodOptional<z.ZodString>;
        jobContainer: z.ZodOptional<z.ZodString>;
        jobServices: z.ZodOptional<z.ZodString>;
        strategyJobIndex: z.ZodOptional<z.ZodNumber>;
        strategyJobTotal: z.ZodOptional<z.ZodNumber>;
        actionRef: z.ZodOptional<z.ZodString>;
        actionStatus: z.ZodOptional<z.ZodString>;
        repositoryGitUrl: z.ZodOptional<z.ZodString>;
        repositoryClean: z.ZodOptional<z.ZodString>;
        repositoryGitSubmoduleCheckout: z.ZodOptional<z.ZodString>;
        secretSource: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        url: string;
        runId: string;
        requestedForId?: string | undefined;
        queuedById?: string | undefined;
        runUrl?: string | undefined;
        runNumber?: number | undefined;
        stage?: string | undefined;
        job?: string | undefined;
        step?: string | undefined;
        task?: string | undefined;
        runnerType?: string | undefined;
        runnerOs?: string | undefined;
        runnerArch?: string | undefined;
        agentPool?: string | undefined;
        runnerName?: string | undefined;
        agentMachineName?: string | undefined;
        retryCount?: number | undefined;
        runAttempt?: number | undefined;
        jobName?: string | undefined;
        definitionVersion?: string | undefined;
        definitionId?: string | undefined;
        reason?: string | undefined;
        sourcesDirectory?: string | undefined;
        binariesDirectory?: string | undefined;
        artifactStagingDirectory?: string | undefined;
        containerId?: string | undefined;
        repositoryLocalPath?: string | undefined;
        workflowRef?: string | undefined;
        workflowSha?: string | undefined;
        runnerEnvironment?: string | undefined;
        runnerDebug?: boolean | undefined;
        retentionDays?: number | undefined;
        actorId?: string | undefined;
        triggeringActor?: string | undefined;
        triggeringActorId?: string | undefined;
        refType?: string | undefined;
        refProtected?: boolean | undefined;
        agentId?: string | undefined;
        agentJobStatus?: string | undefined;
        agentBuildDirectory?: string | undefined;
        agentHomeDirectory?: string | undefined;
        agentTempDirectory?: string | undefined;
        agentToolsDirectory?: string | undefined;
        agentWorkFolder?: string | undefined;
        agentContainerMapping?: string | undefined;
        agentReleaseDirectory?: string | undefined;
        agentRootDirectory?: string | undefined;
        stagingDirectory?: string | undefined;
        testResultsDirectory?: string | undefined;
        cronScheduleDisplayName?: string | undefined;
        pipelineWorkspace?: string | undefined;
        stageRequestedBy?: string | undefined;
        stageRequestedForId?: string | undefined;
        sourceTfvcShelveset?: string | undefined;
        triggeredByBuildId?: string | undefined;
        triggeredByDefinitionId?: string | undefined;
        triggeredByDefinitionName?: string | undefined;
        triggeredByBuildNumber?: string | undefined;
        triggeredByProjectId?: string | undefined;
        teamProjectId?: string | undefined;
        teamProject?: string | undefined;
        buildUri?: string | undefined;
        buildNumber?: string | undefined;
        environmentId?: string | undefined;
        environmentResourceName?: string | undefined;
        environmentResourceId?: string | undefined;
        strategyName?: string | undefined;
        strategyCycleName?: string | undefined;
        checksStageAttempt?: string | undefined;
        systemWorkFolder?: string | undefined;
        systemCollectionId?: string | undefined;
        systemCollectionUri?: string | undefined;
        systemTeamFoundationCollectionUri?: string | undefined;
        systemDebug?: string | undefined;
        systemDefaultWorkingDirectory?: string | undefined;
        systemHostType?: string | undefined;
        systemJobDisplayName?: string | undefined;
        systemJobId?: string | undefined;
        systemJobName?: string | undefined;
        systemPhaseAttempt?: string | undefined;
        systemPhaseDisplayName?: string | undefined;
        systemPhaseName?: string | undefined;
        systemPlanId?: string | undefined;
        systemStageAttempt?: string | undefined;
        systemStageDisplayName?: string | undefined;
        systemStageName?: string | undefined;
        systemTimelineId?: string | undefined;
        tfBuild?: string | undefined;
        prIsFork?: string | undefined;
        prId?: string | undefined;
        prNumber?: string | undefined;
        prTargetBranchName?: string | undefined;
        prSourceBranch?: string | undefined;
        prSourceCommitId?: string | undefined;
        prSourceRepoUri?: string | undefined;
        prTargetBranch?: string | undefined;
        releaseDeploymentRequestedFor?: string | undefined;
        releaseDeploymentRequestedForEmail?: string | undefined;
        releaseDeploymentId?: string | undefined;
        releaseDefinitionEnvironmentId?: string | undefined;
        releaseDefinitionId?: string | undefined;
        releaseDefinitionName?: string | undefined;
        releaseEnvironmentId?: string | undefined;
        releaseEnvironmentName?: string | undefined;
        releasePrimaryArtifactSourceAlias?: string | undefined;
        releaseDescription?: string | undefined;
        releaseId?: string | undefined;
        requestedFor?: string | undefined;
        requestedForEmail?: string | undefined;
        queuedBy?: string | undefined;
        sourceBranchName?: string | undefined;
        fullSourceBranch?: string | undefined;
        sourceVersionMessage?: string | undefined;
        repositoryId?: string | undefined;
        repositoryProvider?: string | undefined;
        repositoryUri?: string | undefined;
        releaseName?: string | undefined;
        releaseUri?: string | undefined;
        releaseArtifacts?: Record<string, any> | undefined;
        triggerId?: string | undefined;
        triggerName?: string | undefined;
        action?: string | undefined;
        actionPath?: string | undefined;
        actionRepository?: string | undefined;
        baseRef?: string | undefined;
        headRef?: string | undefined;
        runnerTemp?: string | undefined;
        runnerToolCache?: string | undefined;
        runnerWorkspace?: string | undefined;
        workspace?: string | undefined;
        jobStatus?: string | undefined;
        jobContainer?: string | undefined;
        jobServices?: string | undefined;
        strategyJobIndex?: number | undefined;
        strategyJobTotal?: number | undefined;
        actionRef?: string | undefined;
        actionStatus?: string | undefined;
        repositoryGitUrl?: string | undefined;
        repositoryClean?: string | undefined;
        repositoryGitSubmoduleCheckout?: string | undefined;
        secretSource?: string | undefined;
    }, {
        name: string;
        url: string;
        runId: string;
        requestedForId?: string | undefined;
        queuedById?: string | undefined;
        runUrl?: string | undefined;
        runNumber?: number | undefined;
        stage?: string | undefined;
        job?: string | undefined;
        step?: string | undefined;
        task?: string | undefined;
        runnerType?: string | undefined;
        runnerOs?: string | undefined;
        runnerArch?: string | undefined;
        agentPool?: string | undefined;
        runnerName?: string | undefined;
        agentMachineName?: string | undefined;
        retryCount?: number | undefined;
        runAttempt?: number | undefined;
        jobName?: string | undefined;
        definitionVersion?: string | undefined;
        definitionId?: string | undefined;
        reason?: string | undefined;
        sourcesDirectory?: string | undefined;
        binariesDirectory?: string | undefined;
        artifactStagingDirectory?: string | undefined;
        containerId?: string | undefined;
        repositoryLocalPath?: string | undefined;
        workflowRef?: string | undefined;
        workflowSha?: string | undefined;
        runnerEnvironment?: string | undefined;
        runnerDebug?: boolean | undefined;
        retentionDays?: number | undefined;
        actorId?: string | undefined;
        triggeringActor?: string | undefined;
        triggeringActorId?: string | undefined;
        refType?: string | undefined;
        refProtected?: boolean | undefined;
        agentId?: string | undefined;
        agentJobStatus?: string | undefined;
        agentBuildDirectory?: string | undefined;
        agentHomeDirectory?: string | undefined;
        agentTempDirectory?: string | undefined;
        agentToolsDirectory?: string | undefined;
        agentWorkFolder?: string | undefined;
        agentContainerMapping?: string | undefined;
        agentReleaseDirectory?: string | undefined;
        agentRootDirectory?: string | undefined;
        stagingDirectory?: string | undefined;
        testResultsDirectory?: string | undefined;
        cronScheduleDisplayName?: string | undefined;
        pipelineWorkspace?: string | undefined;
        stageRequestedBy?: string | undefined;
        stageRequestedForId?: string | undefined;
        sourceTfvcShelveset?: string | undefined;
        triggeredByBuildId?: string | undefined;
        triggeredByDefinitionId?: string | undefined;
        triggeredByDefinitionName?: string | undefined;
        triggeredByBuildNumber?: string | undefined;
        triggeredByProjectId?: string | undefined;
        teamProjectId?: string | undefined;
        teamProject?: string | undefined;
        buildUri?: string | undefined;
        buildNumber?: string | undefined;
        environmentId?: string | undefined;
        environmentResourceName?: string | undefined;
        environmentResourceId?: string | undefined;
        strategyName?: string | undefined;
        strategyCycleName?: string | undefined;
        checksStageAttempt?: string | undefined;
        systemWorkFolder?: string | undefined;
        systemCollectionId?: string | undefined;
        systemCollectionUri?: string | undefined;
        systemTeamFoundationCollectionUri?: string | undefined;
        systemDebug?: string | undefined;
        systemDefaultWorkingDirectory?: string | undefined;
        systemHostType?: string | undefined;
        systemJobDisplayName?: string | undefined;
        systemJobId?: string | undefined;
        systemJobName?: string | undefined;
        systemPhaseAttempt?: string | undefined;
        systemPhaseDisplayName?: string | undefined;
        systemPhaseName?: string | undefined;
        systemPlanId?: string | undefined;
        systemStageAttempt?: string | undefined;
        systemStageDisplayName?: string | undefined;
        systemStageName?: string | undefined;
        systemTimelineId?: string | undefined;
        tfBuild?: string | undefined;
        prIsFork?: string | undefined;
        prId?: string | undefined;
        prNumber?: string | undefined;
        prTargetBranchName?: string | undefined;
        prSourceBranch?: string | undefined;
        prSourceCommitId?: string | undefined;
        prSourceRepoUri?: string | undefined;
        prTargetBranch?: string | undefined;
        releaseDeploymentRequestedFor?: string | undefined;
        releaseDeploymentRequestedForEmail?: string | undefined;
        releaseDeploymentId?: string | undefined;
        releaseDefinitionEnvironmentId?: string | undefined;
        releaseDefinitionId?: string | undefined;
        releaseDefinitionName?: string | undefined;
        releaseEnvironmentId?: string | undefined;
        releaseEnvironmentName?: string | undefined;
        releasePrimaryArtifactSourceAlias?: string | undefined;
        releaseDescription?: string | undefined;
        releaseId?: string | undefined;
        requestedFor?: string | undefined;
        requestedForEmail?: string | undefined;
        queuedBy?: string | undefined;
        sourceBranchName?: string | undefined;
        fullSourceBranch?: string | undefined;
        sourceVersionMessage?: string | undefined;
        repositoryId?: string | undefined;
        repositoryProvider?: string | undefined;
        repositoryUri?: string | undefined;
        releaseName?: string | undefined;
        releaseUri?: string | undefined;
        releaseArtifacts?: Record<string, any> | undefined;
        triggerId?: string | undefined;
        triggerName?: string | undefined;
        action?: string | undefined;
        actionPath?: string | undefined;
        actionRepository?: string | undefined;
        baseRef?: string | undefined;
        headRef?: string | undefined;
        runnerTemp?: string | undefined;
        runnerToolCache?: string | undefined;
        runnerWorkspace?: string | undefined;
        workspace?: string | undefined;
        jobStatus?: string | undefined;
        jobContainer?: string | undefined;
        jobServices?: string | undefined;
        strategyJobIndex?: number | undefined;
        strategyJobTotal?: number | undefined;
        actionRef?: string | undefined;
        actionStatus?: string | undefined;
        repositoryGitUrl?: string | undefined;
        repositoryClean?: string | undefined;
        repositoryGitSubmoduleCheckout?: string | undefined;
        secretSource?: string | undefined;
    }>;
    repository: z.ZodObject<{
        owner: z.ZodString;
        name: z.ZodString;
        url: z.ZodString;
        defaultBranch: z.ZodOptional<z.ZodString>;
        id: z.ZodOptional<z.ZodString>;
        ownerId: z.ZodOptional<z.ZodString>;
        provider: z.ZodOptional<z.ZodString>;
        visibility: z.ZodOptional<z.ZodString>;
        clean: z.ZodOptional<z.ZodString>;
        tfvcWorkspace: z.ZodOptional<z.ZodString>;
        gitSubmoduleCheckout: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        owner: string;
        name: string;
        url: string;
        defaultBranch?: string | undefined;
        id?: string | undefined;
        ownerId?: string | undefined;
        provider?: string | undefined;
        visibility?: string | undefined;
        clean?: string | undefined;
        tfvcWorkspace?: string | undefined;
        gitSubmoduleCheckout?: string | undefined;
    }, {
        owner: string;
        name: string;
        url: string;
        defaultBranch?: string | undefined;
        id?: string | undefined;
        ownerId?: string | undefined;
        provider?: string | undefined;
        visibility?: string | undefined;
        clean?: string | undefined;
        tfvcWorkspace?: string | undefined;
        gitSubmoduleCheckout?: string | undefined;
    }>;
    commit: z.ZodObject<{
        sha: z.ZodString;
        url: z.ZodString;
        message: z.ZodOptional<z.ZodString>;
        author: z.ZodOptional<z.ZodString>;
        authorEmail: z.ZodOptional<z.ZodString>;
        requestedForId: z.ZodOptional<z.ZodString>;
        queuedById: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        url: string;
        sha: string;
        message?: string | undefined;
        author?: string | undefined;
        authorEmail?: string | undefined;
        requestedForId?: string | undefined;
        queuedById?: string | undefined;
    }, {
        url: string;
        sha: string;
        message?: string | undefined;
        author?: string | undefined;
        authorEmail?: string | undefined;
        requestedForId?: string | undefined;
        queuedById?: string | undefined;
    }>;
    branch: z.ZodString;
    pullRequest: z.ZodOptional<z.ZodObject<{
        number: z.ZodNumber;
        url: z.ZodString;
        title: z.ZodString;
        author: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        number: number;
        url: string;
        author: string;
        title: string;
    }, {
        number: number;
        url: string;
        author: string;
        title: string;
    }>>;
    environment: z.ZodOptional<z.ZodString>;
    triggeredBy: z.ZodOptional<z.ZodString>;
    eventName: z.ZodOptional<z.ZodString>;
    apiUrl: z.ZodOptional<z.ZodString>;
    graphqlUrl: z.ZodOptional<z.ZodString>;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
    explicitFields: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    failure: z.ZodObject<{
        exitCode: z.ZodOptional<z.ZodNumber>;
        errorMessage: z.ZodOptional<z.ZodString>;
        failedStep: z.ZodOptional<z.ZodString>;
        failedCommand: z.ZodOptional<z.ZodString>;
        stackTrace: z.ZodOptional<z.ZodString>;
        logs: z.ZodDefault<z.ZodString>;
        logsTruncated: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        logs: string;
        logsTruncated: boolean;
        exitCode?: number | undefined;
        errorMessage?: string | undefined;
        failedStep?: string | undefined;
        failedCommand?: string | undefined;
        stackTrace?: string | undefined;
    }, {
        exitCode?: number | undefined;
        errorMessage?: string | undefined;
        failedStep?: string | undefined;
        failedCommand?: string | undefined;
        stackTrace?: string | undefined;
        logs?: string | undefined;
        logsTruncated?: boolean | undefined;
    }>;
    eventPayload: z.ZodOptional<z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    source: "github" | "azure-devops";
    startedAt: string;
    failedAt: string;
    pipeline: {
        name: string;
        url: string;
        runId: string;
        requestedForId?: string | undefined;
        queuedById?: string | undefined;
        runUrl?: string | undefined;
        runNumber?: number | undefined;
        stage?: string | undefined;
        job?: string | undefined;
        step?: string | undefined;
        task?: string | undefined;
        runnerType?: string | undefined;
        runnerOs?: string | undefined;
        runnerArch?: string | undefined;
        agentPool?: string | undefined;
        runnerName?: string | undefined;
        agentMachineName?: string | undefined;
        retryCount?: number | undefined;
        runAttempt?: number | undefined;
        jobName?: string | undefined;
        definitionVersion?: string | undefined;
        definitionId?: string | undefined;
        reason?: string | undefined;
        sourcesDirectory?: string | undefined;
        binariesDirectory?: string | undefined;
        artifactStagingDirectory?: string | undefined;
        containerId?: string | undefined;
        repositoryLocalPath?: string | undefined;
        workflowRef?: string | undefined;
        workflowSha?: string | undefined;
        runnerEnvironment?: string | undefined;
        runnerDebug?: boolean | undefined;
        retentionDays?: number | undefined;
        actorId?: string | undefined;
        triggeringActor?: string | undefined;
        triggeringActorId?: string | undefined;
        refType?: string | undefined;
        refProtected?: boolean | undefined;
        agentId?: string | undefined;
        agentJobStatus?: string | undefined;
        agentBuildDirectory?: string | undefined;
        agentHomeDirectory?: string | undefined;
        agentTempDirectory?: string | undefined;
        agentToolsDirectory?: string | undefined;
        agentWorkFolder?: string | undefined;
        agentContainerMapping?: string | undefined;
        agentReleaseDirectory?: string | undefined;
        agentRootDirectory?: string | undefined;
        stagingDirectory?: string | undefined;
        testResultsDirectory?: string | undefined;
        cronScheduleDisplayName?: string | undefined;
        pipelineWorkspace?: string | undefined;
        stageRequestedBy?: string | undefined;
        stageRequestedForId?: string | undefined;
        sourceTfvcShelveset?: string | undefined;
        triggeredByBuildId?: string | undefined;
        triggeredByDefinitionId?: string | undefined;
        triggeredByDefinitionName?: string | undefined;
        triggeredByBuildNumber?: string | undefined;
        triggeredByProjectId?: string | undefined;
        teamProjectId?: string | undefined;
        teamProject?: string | undefined;
        buildUri?: string | undefined;
        buildNumber?: string | undefined;
        environmentId?: string | undefined;
        environmentResourceName?: string | undefined;
        environmentResourceId?: string | undefined;
        strategyName?: string | undefined;
        strategyCycleName?: string | undefined;
        checksStageAttempt?: string | undefined;
        systemWorkFolder?: string | undefined;
        systemCollectionId?: string | undefined;
        systemCollectionUri?: string | undefined;
        systemTeamFoundationCollectionUri?: string | undefined;
        systemDebug?: string | undefined;
        systemDefaultWorkingDirectory?: string | undefined;
        systemHostType?: string | undefined;
        systemJobDisplayName?: string | undefined;
        systemJobId?: string | undefined;
        systemJobName?: string | undefined;
        systemPhaseAttempt?: string | undefined;
        systemPhaseDisplayName?: string | undefined;
        systemPhaseName?: string | undefined;
        systemPlanId?: string | undefined;
        systemStageAttempt?: string | undefined;
        systemStageDisplayName?: string | undefined;
        systemStageName?: string | undefined;
        systemTimelineId?: string | undefined;
        tfBuild?: string | undefined;
        prIsFork?: string | undefined;
        prId?: string | undefined;
        prNumber?: string | undefined;
        prTargetBranchName?: string | undefined;
        prSourceBranch?: string | undefined;
        prSourceCommitId?: string | undefined;
        prSourceRepoUri?: string | undefined;
        prTargetBranch?: string | undefined;
        releaseDeploymentRequestedFor?: string | undefined;
        releaseDeploymentRequestedForEmail?: string | undefined;
        releaseDeploymentId?: string | undefined;
        releaseDefinitionEnvironmentId?: string | undefined;
        releaseDefinitionId?: string | undefined;
        releaseDefinitionName?: string | undefined;
        releaseEnvironmentId?: string | undefined;
        releaseEnvironmentName?: string | undefined;
        releasePrimaryArtifactSourceAlias?: string | undefined;
        releaseDescription?: string | undefined;
        releaseId?: string | undefined;
        requestedFor?: string | undefined;
        requestedForEmail?: string | undefined;
        queuedBy?: string | undefined;
        sourceBranchName?: string | undefined;
        fullSourceBranch?: string | undefined;
        sourceVersionMessage?: string | undefined;
        repositoryId?: string | undefined;
        repositoryProvider?: string | undefined;
        repositoryUri?: string | undefined;
        releaseName?: string | undefined;
        releaseUri?: string | undefined;
        releaseArtifacts?: Record<string, any> | undefined;
        triggerId?: string | undefined;
        triggerName?: string | undefined;
        action?: string | undefined;
        actionPath?: string | undefined;
        actionRepository?: string | undefined;
        baseRef?: string | undefined;
        headRef?: string | undefined;
        runnerTemp?: string | undefined;
        runnerToolCache?: string | undefined;
        runnerWorkspace?: string | undefined;
        workspace?: string | undefined;
        jobStatus?: string | undefined;
        jobContainer?: string | undefined;
        jobServices?: string | undefined;
        strategyJobIndex?: number | undefined;
        strategyJobTotal?: number | undefined;
        actionRef?: string | undefined;
        actionStatus?: string | undefined;
        repositoryGitUrl?: string | undefined;
        repositoryClean?: string | undefined;
        repositoryGitSubmoduleCheckout?: string | undefined;
        secretSource?: string | undefined;
    };
    repository: {
        owner: string;
        name: string;
        url: string;
        defaultBranch?: string | undefined;
        id?: string | undefined;
        ownerId?: string | undefined;
        provider?: string | undefined;
        visibility?: string | undefined;
        clean?: string | undefined;
        tfvcWorkspace?: string | undefined;
        gitSubmoduleCheckout?: string | undefined;
    };
    commit: {
        url: string;
        sha: string;
        message?: string | undefined;
        author?: string | undefined;
        authorEmail?: string | undefined;
        requestedForId?: string | undefined;
        queuedById?: string | undefined;
    };
    branch: string;
    metadata: Record<string, string>;
    explicitFields: string[];
    failure: {
        logs: string;
        logsTruncated: boolean;
        exitCode?: number | undefined;
        errorMessage?: string | undefined;
        failedStep?: string | undefined;
        failedCommand?: string | undefined;
        stackTrace?: string | undefined;
    };
    durationMs?: number | undefined;
    queueTimeMs?: number | undefined;
    pullRequest?: {
        number: number;
        url: string;
        author: string;
        title: string;
    } | undefined;
    environment?: string | undefined;
    triggeredBy?: string | undefined;
    eventName?: string | undefined;
    apiUrl?: string | undefined;
    graphqlUrl?: string | undefined;
    eventPayload?: any;
}, {
    source: "github" | "azure-devops";
    startedAt: string;
    failedAt: string;
    pipeline: {
        name: string;
        url: string;
        runId: string;
        requestedForId?: string | undefined;
        queuedById?: string | undefined;
        runUrl?: string | undefined;
        runNumber?: number | undefined;
        stage?: string | undefined;
        job?: string | undefined;
        step?: string | undefined;
        task?: string | undefined;
        runnerType?: string | undefined;
        runnerOs?: string | undefined;
        runnerArch?: string | undefined;
        agentPool?: string | undefined;
        runnerName?: string | undefined;
        agentMachineName?: string | undefined;
        retryCount?: number | undefined;
        runAttempt?: number | undefined;
        jobName?: string | undefined;
        definitionVersion?: string | undefined;
        definitionId?: string | undefined;
        reason?: string | undefined;
        sourcesDirectory?: string | undefined;
        binariesDirectory?: string | undefined;
        artifactStagingDirectory?: string | undefined;
        containerId?: string | undefined;
        repositoryLocalPath?: string | undefined;
        workflowRef?: string | undefined;
        workflowSha?: string | undefined;
        runnerEnvironment?: string | undefined;
        runnerDebug?: boolean | undefined;
        retentionDays?: number | undefined;
        actorId?: string | undefined;
        triggeringActor?: string | undefined;
        triggeringActorId?: string | undefined;
        refType?: string | undefined;
        refProtected?: boolean | undefined;
        agentId?: string | undefined;
        agentJobStatus?: string | undefined;
        agentBuildDirectory?: string | undefined;
        agentHomeDirectory?: string | undefined;
        agentTempDirectory?: string | undefined;
        agentToolsDirectory?: string | undefined;
        agentWorkFolder?: string | undefined;
        agentContainerMapping?: string | undefined;
        agentReleaseDirectory?: string | undefined;
        agentRootDirectory?: string | undefined;
        stagingDirectory?: string | undefined;
        testResultsDirectory?: string | undefined;
        cronScheduleDisplayName?: string | undefined;
        pipelineWorkspace?: string | undefined;
        stageRequestedBy?: string | undefined;
        stageRequestedForId?: string | undefined;
        sourceTfvcShelveset?: string | undefined;
        triggeredByBuildId?: string | undefined;
        triggeredByDefinitionId?: string | undefined;
        triggeredByDefinitionName?: string | undefined;
        triggeredByBuildNumber?: string | undefined;
        triggeredByProjectId?: string | undefined;
        teamProjectId?: string | undefined;
        teamProject?: string | undefined;
        buildUri?: string | undefined;
        buildNumber?: string | undefined;
        environmentId?: string | undefined;
        environmentResourceName?: string | undefined;
        environmentResourceId?: string | undefined;
        strategyName?: string | undefined;
        strategyCycleName?: string | undefined;
        checksStageAttempt?: string | undefined;
        systemWorkFolder?: string | undefined;
        systemCollectionId?: string | undefined;
        systemCollectionUri?: string | undefined;
        systemTeamFoundationCollectionUri?: string | undefined;
        systemDebug?: string | undefined;
        systemDefaultWorkingDirectory?: string | undefined;
        systemHostType?: string | undefined;
        systemJobDisplayName?: string | undefined;
        systemJobId?: string | undefined;
        systemJobName?: string | undefined;
        systemPhaseAttempt?: string | undefined;
        systemPhaseDisplayName?: string | undefined;
        systemPhaseName?: string | undefined;
        systemPlanId?: string | undefined;
        systemStageAttempt?: string | undefined;
        systemStageDisplayName?: string | undefined;
        systemStageName?: string | undefined;
        systemTimelineId?: string | undefined;
        tfBuild?: string | undefined;
        prIsFork?: string | undefined;
        prId?: string | undefined;
        prNumber?: string | undefined;
        prTargetBranchName?: string | undefined;
        prSourceBranch?: string | undefined;
        prSourceCommitId?: string | undefined;
        prSourceRepoUri?: string | undefined;
        prTargetBranch?: string | undefined;
        releaseDeploymentRequestedFor?: string | undefined;
        releaseDeploymentRequestedForEmail?: string | undefined;
        releaseDeploymentId?: string | undefined;
        releaseDefinitionEnvironmentId?: string | undefined;
        releaseDefinitionId?: string | undefined;
        releaseDefinitionName?: string | undefined;
        releaseEnvironmentId?: string | undefined;
        releaseEnvironmentName?: string | undefined;
        releasePrimaryArtifactSourceAlias?: string | undefined;
        releaseDescription?: string | undefined;
        releaseId?: string | undefined;
        requestedFor?: string | undefined;
        requestedForEmail?: string | undefined;
        queuedBy?: string | undefined;
        sourceBranchName?: string | undefined;
        fullSourceBranch?: string | undefined;
        sourceVersionMessage?: string | undefined;
        repositoryId?: string | undefined;
        repositoryProvider?: string | undefined;
        repositoryUri?: string | undefined;
        releaseName?: string | undefined;
        releaseUri?: string | undefined;
        releaseArtifacts?: Record<string, any> | undefined;
        triggerId?: string | undefined;
        triggerName?: string | undefined;
        action?: string | undefined;
        actionPath?: string | undefined;
        actionRepository?: string | undefined;
        baseRef?: string | undefined;
        headRef?: string | undefined;
        runnerTemp?: string | undefined;
        runnerToolCache?: string | undefined;
        runnerWorkspace?: string | undefined;
        workspace?: string | undefined;
        jobStatus?: string | undefined;
        jobContainer?: string | undefined;
        jobServices?: string | undefined;
        strategyJobIndex?: number | undefined;
        strategyJobTotal?: number | undefined;
        actionRef?: string | undefined;
        actionStatus?: string | undefined;
        repositoryGitUrl?: string | undefined;
        repositoryClean?: string | undefined;
        repositoryGitSubmoduleCheckout?: string | undefined;
        secretSource?: string | undefined;
    };
    repository: {
        owner: string;
        name: string;
        url: string;
        defaultBranch?: string | undefined;
        id?: string | undefined;
        ownerId?: string | undefined;
        provider?: string | undefined;
        visibility?: string | undefined;
        clean?: string | undefined;
        tfvcWorkspace?: string | undefined;
        gitSubmoduleCheckout?: string | undefined;
    };
    commit: {
        url: string;
        sha: string;
        message?: string | undefined;
        author?: string | undefined;
        authorEmail?: string | undefined;
        requestedForId?: string | undefined;
        queuedById?: string | undefined;
    };
    branch: string;
    failure: {
        exitCode?: number | undefined;
        errorMessage?: string | undefined;
        failedStep?: string | undefined;
        failedCommand?: string | undefined;
        stackTrace?: string | undefined;
        logs?: string | undefined;
        logsTruncated?: boolean | undefined;
    };
    durationMs?: number | undefined;
    queueTimeMs?: number | undefined;
    pullRequest?: {
        number: number;
        url: string;
        author: string;
        title: string;
    } | undefined;
    environment?: string | undefined;
    triggeredBy?: string | undefined;
    eventName?: string | undefined;
    apiUrl?: string | undefined;
    graphqlUrl?: string | undefined;
    metadata?: Record<string, string> | undefined;
    explicitFields?: string[] | undefined;
    eventPayload?: any;
}>;
type FailureEvent = z.infer<typeof FailureEventSchema>;

declare const OperationalMetricsSchema: z.ZodObject<{
    mttrEstimate: z.ZodOptional<z.ZodNumber>;
    incidentFrequency: z.ZodOptional<z.ZodNumber>;
    failureTrend: z.ZodOptional<z.ZodEnum<["increasing", "decreasing", "stable"]>>;
    teamReliabilityScore: z.ZodOptional<z.ZodNumber>;
    pipelineReliabilityScore: z.ZodOptional<z.ZodNumber>;
    failureDuration: z.ZodOptional<z.ZodNumber>;
    slaImpact: z.ZodOptional<z.ZodBoolean>;
    sloImpact: z.ZodOptional<z.ZodBoolean>;
    downtimeEstimate: z.ZodOptional<z.ZodNumber>;
    deploymentRiskScore: z.ZodOptional<z.ZodNumber>;
    blastRadius: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    flakyDetection: z.ZodOptional<z.ZodBoolean>;
    similarFailuresCount: z.ZodOptional<z.ZodNumber>;
    previousIncidentLinks: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    mttrEstimate?: number | undefined;
    incidentFrequency?: number | undefined;
    failureTrend?: "increasing" | "decreasing" | "stable" | undefined;
    teamReliabilityScore?: number | undefined;
    pipelineReliabilityScore?: number | undefined;
    failureDuration?: number | undefined;
    slaImpact?: boolean | undefined;
    sloImpact?: boolean | undefined;
    downtimeEstimate?: number | undefined;
    deploymentRiskScore?: number | undefined;
    blastRadius?: string[] | undefined;
    flakyDetection?: boolean | undefined;
    similarFailuresCount?: number | undefined;
    previousIncidentLinks?: string[] | undefined;
}, {
    mttrEstimate?: number | undefined;
    incidentFrequency?: number | undefined;
    failureTrend?: "increasing" | "decreasing" | "stable" | undefined;
    teamReliabilityScore?: number | undefined;
    pipelineReliabilityScore?: number | undefined;
    failureDuration?: number | undefined;
    slaImpact?: boolean | undefined;
    sloImpact?: boolean | undefined;
    downtimeEstimate?: number | undefined;
    deploymentRiskScore?: number | undefined;
    blastRadius?: string[] | undefined;
    flakyDetection?: boolean | undefined;
    similarFailuresCount?: number | undefined;
    previousIncidentLinks?: string[] | undefined;
}>;
type OperationalMetrics = z.infer<typeof OperationalMetricsSchema>;
declare const OwnershipRoutingSchema: z.ZodObject<{
    suggestedTeam: z.ZodOptional<z.ZodString>;
    suggestedAssignee: z.ZodOptional<z.ZodString>;
    escalationPolicy: z.ZodOptional<z.ZodString>;
    onCallEngineer: z.ZodOptional<z.ZodString>;
    serviceOwner: z.ZodOptional<z.ZodString>;
    teamSlackChannel: z.ZodOptional<z.ZodString>;
    teamsChannel: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    suggestedTeam?: string | undefined;
    suggestedAssignee?: string | undefined;
    escalationPolicy?: string | undefined;
    onCallEngineer?: string | undefined;
    serviceOwner?: string | undefined;
    teamSlackChannel?: string | undefined;
    teamsChannel?: string | undefined;
}, {
    suggestedTeam?: string | undefined;
    suggestedAssignee?: string | undefined;
    escalationPolicy?: string | undefined;
    onCallEngineer?: string | undefined;
    serviceOwner?: string | undefined;
    teamSlackChannel?: string | undefined;
    teamsChannel?: string | undefined;
}>;
type OwnershipRouting = z.infer<typeof OwnershipRoutingSchema>;
declare const NotificationFieldsSchema: z.ZodObject<{
    slackNotificationUrl: z.ZodOptional<z.ZodString>;
    teamsNotificationUrl: z.ZodOptional<z.ZodString>;
    incidentChannel: z.ZodOptional<z.ZodString>;
    stakeholders: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    notificationStatus: z.ZodOptional<z.ZodEnum<["pending", "sent", "delivered", "failed"]>>;
    pagerReference: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    slackNotificationUrl?: string | undefined;
    teamsNotificationUrl?: string | undefined;
    incidentChannel?: string | undefined;
    stakeholders?: string[] | undefined;
    notificationStatus?: "pending" | "sent" | "delivered" | "failed" | undefined;
    pagerReference?: string | undefined;
}, {
    slackNotificationUrl?: string | undefined;
    teamsNotificationUrl?: string | undefined;
    incidentChannel?: string | undefined;
    stakeholders?: string[] | undefined;
    notificationStatus?: "pending" | "sent" | "delivered" | "failed" | undefined;
    pagerReference?: string | undefined;
}>;
type NotificationFields = z.infer<typeof NotificationFieldsSchema>;
type ComputedMetrics = {
    mttrHours?: number;
    blastRadius?: number;
    sampleSize: number;
};

declare const SeveritySchema: z.ZodEnum<["Critical", "High", "Medium", "Low"]>;
type Severity = z.infer<typeof SeveritySchema>;
declare const PrioritySchema: z.ZodEnum<["Highest", "High", "Medium", "Low", "Lowest"]>;
type Priority = z.infer<typeof PrioritySchema>;
declare const FailureCategorySchema: z.ZodEnum<["Infrastructure", "Build", "Deployment", "Test", "Dependency", "Security", "Authentication", "Timeout", "Network", "CloudProvider", "Unknown"]>;
type FailureCategory = z.infer<typeof FailureCategorySchema>;
declare const ExternalLinkSchema: z.ZodObject<{
    url: z.ZodString;
    title: z.ZodString;
}, "strip", z.ZodTypeAny, {
    url: string;
    title: string;
}, {
    url: string;
    title: string;
}>;
type ExternalLink = z.infer<typeof ExternalLinkSchema>;
declare const FieldProvenanceSchema: z.ZodEnum<["deterministic", "computed", "ai", "fallback", "history"]>;
type FieldProvenance = z.infer<typeof FieldProvenanceSchema>;
declare const JiraTicketSpecSchema: z.ZodObject<{
    projectKey: z.ZodString;
    issueType: z.ZodDefault<z.ZodString>;
    summary: z.ZodString;
    description: z.ZodString;
    priority: z.ZodOptional<z.ZodEnum<["Highest", "High", "Medium", "Low", "Lowest"]>>;
    severity: z.ZodOptional<z.ZodEnum<["Critical", "High", "Medium", "Low"]>>;
    category: z.ZodDefault<z.ZodEnum<["Infrastructure", "Build", "Deployment", "Test", "Dependency", "Security", "Authentication", "Timeout", "Network", "CloudProvider", "Unknown"]>>;
    labels: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    components: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    environment: z.ZodOptional<z.ZodString>;
    assignee: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    rca: z.ZodOptional<z.ZodString>;
    remediationSteps: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    customFields: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    dedupSignature: z.ZodString;
    externalLinks: z.ZodDefault<z.ZodArray<z.ZodObject<{
        url: z.ZodString;
        title: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        url: string;
        title: string;
    }, {
        url: string;
        title: string;
    }>, "many">>;
    provenance: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodEnum<["deterministic", "computed", "ai", "fallback", "history"]>>>;
    metrics: z.ZodOptional<z.ZodType<ComputedMetrics, z.ZodTypeDef, ComputedMetrics>>;
}, "strip", z.ZodTypeAny, {
    projectKey: string;
    issueType: string;
    summary: string;
    description: string;
    category: "Infrastructure" | "Build" | "Deployment" | "Test" | "Dependency" | "Security" | "Authentication" | "Timeout" | "Network" | "CloudProvider" | "Unknown";
    labels: string[];
    components: string[];
    customFields: Record<string, unknown>;
    dedupSignature: string;
    externalLinks: {
        url: string;
        title: string;
    }[];
    provenance: Record<string, "deterministic" | "computed" | "ai" | "fallback" | "history">;
    environment?: string | undefined;
    priority?: "High" | "Medium" | "Low" | "Highest" | "Lowest" | undefined;
    severity?: "Critical" | "High" | "Medium" | "Low" | undefined;
    assignee?: string | null | undefined;
    rca?: string | undefined;
    remediationSteps?: string[] | undefined;
    metrics?: ComputedMetrics | undefined;
}, {
    projectKey: string;
    summary: string;
    description: string;
    dedupSignature: string;
    environment?: string | undefined;
    issueType?: string | undefined;
    priority?: "High" | "Medium" | "Low" | "Highest" | "Lowest" | undefined;
    severity?: "Critical" | "High" | "Medium" | "Low" | undefined;
    category?: "Infrastructure" | "Build" | "Deployment" | "Test" | "Dependency" | "Security" | "Authentication" | "Timeout" | "Network" | "CloudProvider" | "Unknown" | undefined;
    labels?: string[] | undefined;
    components?: string[] | undefined;
    assignee?: string | null | undefined;
    rca?: string | undefined;
    remediationSteps?: string[] | undefined;
    customFields?: Record<string, unknown> | undefined;
    externalLinks?: {
        url: string;
        title: string;
    }[] | undefined;
    provenance?: Record<string, "deterministic" | "computed" | "ai" | "fallback" | "history"> | undefined;
    metrics?: ComputedMetrics | undefined;
}>;
type JiraTicketSpec = z.infer<typeof JiraTicketSpecSchema>;

declare const AIModeSchema: z.ZodEnum<["disabled", "assist", "full"]>;
type AIMode = z.infer<typeof AIModeSchema>;
declare const JiraAuthSchema: z.ZodObject<{
    baseUrl: z.ZodString;
    type: z.ZodDefault<z.ZodEnum<["cloud", "server"]>>;
    email: z.ZodOptional<z.ZodString>;
    apiToken: z.ZodOptional<z.ZodString>;
    username: z.ZodOptional<z.ZodString>;
    password: z.ZodOptional<z.ZodString>;
    accessToken: z.ZodOptional<z.ZodString>;
    strictGDPR: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    type: "cloud" | "server";
    baseUrl: string;
    email?: string | undefined;
    apiToken?: string | undefined;
    username?: string | undefined;
    password?: string | undefined;
    accessToken?: string | undefined;
    strictGDPR?: boolean | undefined;
}, {
    baseUrl: string;
    type?: "cloud" | "server" | undefined;
    email?: string | undefined;
    apiToken?: string | undefined;
    username?: string | undefined;
    password?: string | undefined;
    accessToken?: string | undefined;
    strictGDPR?: boolean | undefined;
}>;
type JiraAuth = z.infer<typeof JiraAuthSchema>;
declare const DedupConfigSchema: z.ZodObject<{
    enabled: z.ZodDefault<z.ZodBoolean>;
    windowHours: z.ZodDefault<z.ZodNumber>;
    minSimilarity: z.ZodDefault<z.ZodNumber>;
    onClosedHit: z.ZodDefault<z.ZodEnum<["reopen", "create-new", "skip"]>>;
    reopenTransition: z.ZodDefault<z.ZodString>;
    closedStatuses: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    enabled: boolean;
    windowHours: number;
    minSimilarity: number;
    onClosedHit: "reopen" | "create-new" | "skip";
    reopenTransition: string;
    closedStatuses: string[];
}, {
    enabled?: boolean | undefined;
    windowHours?: number | undefined;
    minSimilarity?: number | undefined;
    onClosedHit?: "reopen" | "create-new" | "skip" | undefined;
    reopenTransition?: string | undefined;
    closedStatuses?: string[] | undefined;
}>;
type DedupConfig = z.infer<typeof DedupConfigSchema>;
declare const AIConfigSchema: z.ZodObject<{
    mode: z.ZodDefault<z.ZodEnum<["disabled", "assist", "full"]>>;
    provider: z.ZodOptional<z.ZodEnum<["openai", "anthropic", "azure-openai", "gemini", "local"]>>;
    apiKey: z.ZodOptional<z.ZodString>;
    model: z.ZodOptional<z.ZodString>;
    endpoint: z.ZodOptional<z.ZodString>;
    temperature: z.ZodOptional<z.ZodNumber>;
    minConfidence: z.ZodDefault<z.ZodNumber>;
    maxLogTokens: z.ZodDefault<z.ZodNumber>;
    enableThinking: z.ZodDefault<z.ZodBoolean>;
    thinkingBudget: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    minConfidence: number;
    mode: "disabled" | "assist" | "full";
    maxLogTokens: number;
    enableThinking: boolean;
    thinkingBudget: number;
    provider?: "openai" | "anthropic" | "azure-openai" | "gemini" | "local" | undefined;
    apiKey?: string | undefined;
    model?: string | undefined;
    endpoint?: string | undefined;
    temperature?: number | undefined;
}, {
    provider?: "openai" | "anthropic" | "azure-openai" | "gemini" | "local" | undefined;
    minConfidence?: number | undefined;
    mode?: "disabled" | "assist" | "full" | undefined;
    apiKey?: string | undefined;
    model?: string | undefined;
    endpoint?: string | undefined;
    temperature?: number | undefined;
    maxLogTokens?: number | undefined;
    enableThinking?: boolean | undefined;
    thinkingBudget?: number | undefined;
}>;
type AIConfig = z.infer<typeof AIConfigSchema>;
declare const SlackConfigSchema: z.ZodObject<{
    webhookUrl: z.ZodString;
    channel: z.ZodOptional<z.ZodString>;
    notifyOn: z.ZodOptional<z.ZodArray<z.ZodEnum<["Critical", "High", "Medium", "Low"]>, "many">>;
    includeMetrics: z.ZodOptional<z.ZodBoolean>;
    username: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    webhookUrl: string;
    username?: string | undefined;
    channel?: string | undefined;
    notifyOn?: ("Critical" | "High" | "Medium" | "Low")[] | undefined;
    includeMetrics?: boolean | undefined;
}, {
    webhookUrl: string;
    username?: string | undefined;
    channel?: string | undefined;
    notifyOn?: ("Critical" | "High" | "Medium" | "Low")[] | undefined;
    includeMetrics?: boolean | undefined;
}>;
type SlackConfig = z.infer<typeof SlackConfigSchema>;
declare const TeamsConfigSchema: z.ZodObject<{
    webhookUrl: z.ZodString;
    notifyOn: z.ZodOptional<z.ZodArray<z.ZodEnum<["Critical", "High", "Medium", "Low"]>, "many">>;
    includeMetrics: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    webhookUrl: string;
    notifyOn?: ("Critical" | "High" | "Medium" | "Low")[] | undefined;
    includeMetrics?: boolean | undefined;
}, {
    webhookUrl: string;
    notifyOn?: ("Critical" | "High" | "Medium" | "Low")[] | undefined;
    includeMetrics?: boolean | undefined;
}>;
type TeamsConfig = z.infer<typeof TeamsConfigSchema>;
declare const NotificationsConfigSchema: z.ZodObject<{
    enabled: z.ZodOptional<z.ZodBoolean>;
    slack: z.ZodOptional<z.ZodObject<{
        webhookUrl: z.ZodString;
        channel: z.ZodOptional<z.ZodString>;
        notifyOn: z.ZodOptional<z.ZodArray<z.ZodEnum<["Critical", "High", "Medium", "Low"]>, "many">>;
        includeMetrics: z.ZodOptional<z.ZodBoolean>;
        username: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        webhookUrl: string;
        username?: string | undefined;
        channel?: string | undefined;
        notifyOn?: ("Critical" | "High" | "Medium" | "Low")[] | undefined;
        includeMetrics?: boolean | undefined;
    }, {
        webhookUrl: string;
        username?: string | undefined;
        channel?: string | undefined;
        notifyOn?: ("Critical" | "High" | "Medium" | "Low")[] | undefined;
        includeMetrics?: boolean | undefined;
    }>>;
    teams: z.ZodOptional<z.ZodObject<{
        webhookUrl: z.ZodString;
        notifyOn: z.ZodOptional<z.ZodArray<z.ZodEnum<["Critical", "High", "Medium", "Low"]>, "many">>;
        includeMetrics: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        webhookUrl: string;
        notifyOn?: ("Critical" | "High" | "Medium" | "Low")[] | undefined;
        includeMetrics?: boolean | undefined;
    }, {
        webhookUrl: string;
        notifyOn?: ("Critical" | "High" | "Medium" | "Low")[] | undefined;
        includeMetrics?: boolean | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    enabled?: boolean | undefined;
    slack?: {
        webhookUrl: string;
        username?: string | undefined;
        channel?: string | undefined;
        notifyOn?: ("Critical" | "High" | "Medium" | "Low")[] | undefined;
        includeMetrics?: boolean | undefined;
    } | undefined;
    teams?: {
        webhookUrl: string;
        notifyOn?: ("Critical" | "High" | "Medium" | "Low")[] | undefined;
        includeMetrics?: boolean | undefined;
    } | undefined;
}, {
    enabled?: boolean | undefined;
    slack?: {
        webhookUrl: string;
        username?: string | undefined;
        channel?: string | undefined;
        notifyOn?: ("Critical" | "High" | "Medium" | "Low")[] | undefined;
        includeMetrics?: boolean | undefined;
    } | undefined;
    teams?: {
        webhookUrl: string;
        notifyOn?: ("Critical" | "High" | "Medium" | "Low")[] | undefined;
        includeMetrics?: boolean | undefined;
    } | undefined;
}>;
type NotificationsConfig = z.infer<typeof NotificationsConfigSchema>;
declare const JiraCustomFieldMappingSchema: z.ZodObject<{
    externalLinks: z.ZodOptional<z.ZodString>;
    provenance: z.ZodOptional<z.ZodString>;
    dedupSignature: z.ZodOptional<z.ZodString>;
    metrics: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    dedupSignature?: string | undefined;
    externalLinks?: string | undefined;
    provenance?: string | undefined;
    metrics?: string | undefined;
}, {
    dedupSignature?: string | undefined;
    externalLinks?: string | undefined;
    provenance?: string | undefined;
    metrics?: string | undefined;
}>;
type JiraCustomFieldMapping = z.infer<typeof JiraCustomFieldMappingSchema>;
declare const PipelineIQConfigSchema: z.ZodObject<{
    jira: z.ZodObject<{
        baseUrl: z.ZodString;
        type: z.ZodDefault<z.ZodEnum<["cloud", "server"]>>;
        email: z.ZodOptional<z.ZodString>;
        apiToken: z.ZodOptional<z.ZodString>;
        username: z.ZodOptional<z.ZodString>;
        password: z.ZodOptional<z.ZodString>;
        accessToken: z.ZodOptional<z.ZodString>;
        strictGDPR: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        type: "cloud" | "server";
        baseUrl: string;
        email?: string | undefined;
        apiToken?: string | undefined;
        username?: string | undefined;
        password?: string | undefined;
        accessToken?: string | undefined;
        strictGDPR?: boolean | undefined;
    }, {
        baseUrl: string;
        type?: "cloud" | "server" | undefined;
        email?: string | undefined;
        apiToken?: string | undefined;
        username?: string | undefined;
        password?: string | undefined;
        accessToken?: string | undefined;
        strictGDPR?: boolean | undefined;
    }>;
    jiraProject: z.ZodString;
    issueType: z.ZodDefault<z.ZodString>;
    jiraCustomFields: z.ZodOptional<z.ZodObject<{
        externalLinks: z.ZodOptional<z.ZodString>;
        provenance: z.ZodOptional<z.ZodString>;
        dedupSignature: z.ZodOptional<z.ZodString>;
        metrics: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        dedupSignature?: string | undefined;
        externalLinks?: string | undefined;
        provenance?: string | undefined;
        metrics?: string | undefined;
    }, {
        dedupSignature?: string | undefined;
        externalLinks?: string | undefined;
        provenance?: string | undefined;
        metrics?: string | undefined;
    }>>;
    defaultAssignee: z.ZodOptional<z.ZodString>;
    defaultLabels: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    ai: z.ZodDefault<z.ZodObject<{
        mode: z.ZodDefault<z.ZodEnum<["disabled", "assist", "full"]>>;
        provider: z.ZodOptional<z.ZodEnum<["openai", "anthropic", "azure-openai", "gemini", "local"]>>;
        apiKey: z.ZodOptional<z.ZodString>;
        model: z.ZodOptional<z.ZodString>;
        endpoint: z.ZodOptional<z.ZodString>;
        temperature: z.ZodOptional<z.ZodNumber>;
        minConfidence: z.ZodDefault<z.ZodNumber>;
        maxLogTokens: z.ZodDefault<z.ZodNumber>;
        enableThinking: z.ZodDefault<z.ZodBoolean>;
        thinkingBudget: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        minConfidence: number;
        mode: "disabled" | "assist" | "full";
        maxLogTokens: number;
        enableThinking: boolean;
        thinkingBudget: number;
        provider?: "openai" | "anthropic" | "azure-openai" | "gemini" | "local" | undefined;
        apiKey?: string | undefined;
        model?: string | undefined;
        endpoint?: string | undefined;
        temperature?: number | undefined;
    }, {
        provider?: "openai" | "anthropic" | "azure-openai" | "gemini" | "local" | undefined;
        minConfidence?: number | undefined;
        mode?: "disabled" | "assist" | "full" | undefined;
        apiKey?: string | undefined;
        model?: string | undefined;
        endpoint?: string | undefined;
        temperature?: number | undefined;
        maxLogTokens?: number | undefined;
        enableThinking?: boolean | undefined;
        thinkingBudget?: number | undefined;
    }>>;
    dedup: z.ZodDefault<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        windowHours: z.ZodDefault<z.ZodNumber>;
        minSimilarity: z.ZodDefault<z.ZodNumber>;
        onClosedHit: z.ZodDefault<z.ZodEnum<["reopen", "create-new", "skip"]>>;
        reopenTransition: z.ZodDefault<z.ZodString>;
        closedStatuses: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        windowHours: number;
        minSimilarity: number;
        onClosedHit: "reopen" | "create-new" | "skip";
        reopenTransition: string;
        closedStatuses: string[];
    }, {
        enabled?: boolean | undefined;
        windowHours?: number | undefined;
        minSimilarity?: number | undefined;
        onClosedHit?: "reopen" | "create-new" | "skip" | undefined;
        reopenTransition?: string | undefined;
        closedStatuses?: string[] | undefined;
    }>>;
    maskSecrets: z.ZodDefault<z.ZodBoolean>;
    logExcerptLines: z.ZodDefault<z.ZodNumber>;
    displayMetadata: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    autoWorklog: z.ZodDefault<z.ZodBoolean>;
    notifications: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodOptional<z.ZodBoolean>;
        slack: z.ZodOptional<z.ZodObject<{
            webhookUrl: z.ZodString;
            channel: z.ZodOptional<z.ZodString>;
            notifyOn: z.ZodOptional<z.ZodArray<z.ZodEnum<["Critical", "High", "Medium", "Low"]>, "many">>;
            includeMetrics: z.ZodOptional<z.ZodBoolean>;
            username: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            webhookUrl: string;
            username?: string | undefined;
            channel?: string | undefined;
            notifyOn?: ("Critical" | "High" | "Medium" | "Low")[] | undefined;
            includeMetrics?: boolean | undefined;
        }, {
            webhookUrl: string;
            username?: string | undefined;
            channel?: string | undefined;
            notifyOn?: ("Critical" | "High" | "Medium" | "Low")[] | undefined;
            includeMetrics?: boolean | undefined;
        }>>;
        teams: z.ZodOptional<z.ZodObject<{
            webhookUrl: z.ZodString;
            notifyOn: z.ZodOptional<z.ZodArray<z.ZodEnum<["Critical", "High", "Medium", "Low"]>, "many">>;
            includeMetrics: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            webhookUrl: string;
            notifyOn?: ("Critical" | "High" | "Medium" | "Low")[] | undefined;
            includeMetrics?: boolean | undefined;
        }, {
            webhookUrl: string;
            notifyOn?: ("Critical" | "High" | "Medium" | "Low")[] | undefined;
            includeMetrics?: boolean | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        enabled?: boolean | undefined;
        slack?: {
            webhookUrl: string;
            username?: string | undefined;
            channel?: string | undefined;
            notifyOn?: ("Critical" | "High" | "Medium" | "Low")[] | undefined;
            includeMetrics?: boolean | undefined;
        } | undefined;
        teams?: {
            webhookUrl: string;
            notifyOn?: ("Critical" | "High" | "Medium" | "Low")[] | undefined;
            includeMetrics?: boolean | undefined;
        } | undefined;
    }, {
        enabled?: boolean | undefined;
        slack?: {
            webhookUrl: string;
            username?: string | undefined;
            channel?: string | undefined;
            notifyOn?: ("Critical" | "High" | "Medium" | "Low")[] | undefined;
            includeMetrics?: boolean | undefined;
        } | undefined;
        teams?: {
            webhookUrl: string;
            notifyOn?: ("Critical" | "High" | "Medium" | "Low")[] | undefined;
            includeMetrics?: boolean | undefined;
        } | undefined;
    }>>;
    selfHealing: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        enableGuardrails: z.ZodDefault<z.ZodBoolean>;
        dryRun: z.ZodDefault<z.ZodBoolean>;
        minConfidence: z.ZodDefault<z.ZodNumber>;
        maxFilesChanged: z.ZodDefault<z.ZodNumber>;
        maxLinesChanged: z.ZodDefault<z.ZodNumber>;
        allowedCategories: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        blockedPaths: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        branchPrefix: z.ZodDefault<z.ZodString>;
        platform: z.ZodOptional<z.ZodEnum<["github", "azure-devops"]>>;
        githubToken: z.ZodOptional<z.ZodString>;
        azureToken: z.ZodOptional<z.ZodString>;
        draftPr: z.ZodDefault<z.ZodBoolean>;
        reviewers: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        prLabels: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        enableVerification: z.ZodDefault<z.ZodBoolean>;
        verificationCommands: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        autoRegenerateLockfile: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        enableGuardrails: boolean;
        dryRun: boolean;
        minConfidence: number;
        maxFilesChanged: number;
        maxLinesChanged: number;
        allowedCategories: string[];
        blockedPaths: string[];
        branchPrefix: string;
        draftPr: boolean;
        reviewers: string[];
        prLabels: string[];
        enableVerification: boolean;
        verificationCommands: string[];
        autoRegenerateLockfile: boolean;
        platform?: "github" | "azure-devops" | undefined;
        githubToken?: string | undefined;
        azureToken?: string | undefined;
    }, {
        enabled?: boolean | undefined;
        enableGuardrails?: boolean | undefined;
        dryRun?: boolean | undefined;
        minConfidence?: number | undefined;
        maxFilesChanged?: number | undefined;
        maxLinesChanged?: number | undefined;
        allowedCategories?: string[] | undefined;
        blockedPaths?: string[] | undefined;
        branchPrefix?: string | undefined;
        platform?: "github" | "azure-devops" | undefined;
        githubToken?: string | undefined;
        azureToken?: string | undefined;
        draftPr?: boolean | undefined;
        reviewers?: string[] | undefined;
        prLabels?: string[] | undefined;
        enableVerification?: boolean | undefined;
        verificationCommands?: string[] | undefined;
        autoRegenerateLockfile?: boolean | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    ai: {
        minConfidence: number;
        mode: "disabled" | "assist" | "full";
        maxLogTokens: number;
        enableThinking: boolean;
        thinkingBudget: number;
        provider?: "openai" | "anthropic" | "azure-openai" | "gemini" | "local" | undefined;
        apiKey?: string | undefined;
        model?: string | undefined;
        endpoint?: string | undefined;
        temperature?: number | undefined;
    };
    issueType: string;
    jira: {
        type: "cloud" | "server";
        baseUrl: string;
        email?: string | undefined;
        apiToken?: string | undefined;
        username?: string | undefined;
        password?: string | undefined;
        accessToken?: string | undefined;
        strictGDPR?: boolean | undefined;
    };
    jiraProject: string;
    defaultLabels: string[];
    dedup: {
        enabled: boolean;
        windowHours: number;
        minSimilarity: number;
        onClosedHit: "reopen" | "create-new" | "skip";
        reopenTransition: string;
        closedStatuses: string[];
    };
    maskSecrets: boolean;
    logExcerptLines: number;
    autoWorklog: boolean;
    jiraCustomFields?: {
        dedupSignature?: string | undefined;
        externalLinks?: string | undefined;
        provenance?: string | undefined;
        metrics?: string | undefined;
    } | undefined;
    defaultAssignee?: string | undefined;
    displayMetadata?: string[] | undefined;
    notifications?: {
        enabled?: boolean | undefined;
        slack?: {
            webhookUrl: string;
            username?: string | undefined;
            channel?: string | undefined;
            notifyOn?: ("Critical" | "High" | "Medium" | "Low")[] | undefined;
            includeMetrics?: boolean | undefined;
        } | undefined;
        teams?: {
            webhookUrl: string;
            notifyOn?: ("Critical" | "High" | "Medium" | "Low")[] | undefined;
            includeMetrics?: boolean | undefined;
        } | undefined;
    } | undefined;
    selfHealing?: {
        enabled: boolean;
        enableGuardrails: boolean;
        dryRun: boolean;
        minConfidence: number;
        maxFilesChanged: number;
        maxLinesChanged: number;
        allowedCategories: string[];
        blockedPaths: string[];
        branchPrefix: string;
        draftPr: boolean;
        reviewers: string[];
        prLabels: string[];
        enableVerification: boolean;
        verificationCommands: string[];
        autoRegenerateLockfile: boolean;
        platform?: "github" | "azure-devops" | undefined;
        githubToken?: string | undefined;
        azureToken?: string | undefined;
    } | undefined;
}, {
    jira: {
        baseUrl: string;
        type?: "cloud" | "server" | undefined;
        email?: string | undefined;
        apiToken?: string | undefined;
        username?: string | undefined;
        password?: string | undefined;
        accessToken?: string | undefined;
        strictGDPR?: boolean | undefined;
    };
    jiraProject: string;
    ai?: {
        provider?: "openai" | "anthropic" | "azure-openai" | "gemini" | "local" | undefined;
        minConfidence?: number | undefined;
        mode?: "disabled" | "assist" | "full" | undefined;
        apiKey?: string | undefined;
        model?: string | undefined;
        endpoint?: string | undefined;
        temperature?: number | undefined;
        maxLogTokens?: number | undefined;
        enableThinking?: boolean | undefined;
        thinkingBudget?: number | undefined;
    } | undefined;
    issueType?: string | undefined;
    jiraCustomFields?: {
        dedupSignature?: string | undefined;
        externalLinks?: string | undefined;
        provenance?: string | undefined;
        metrics?: string | undefined;
    } | undefined;
    defaultAssignee?: string | undefined;
    defaultLabels?: string[] | undefined;
    dedup?: {
        enabled?: boolean | undefined;
        windowHours?: number | undefined;
        minSimilarity?: number | undefined;
        onClosedHit?: "reopen" | "create-new" | "skip" | undefined;
        reopenTransition?: string | undefined;
        closedStatuses?: string[] | undefined;
    } | undefined;
    maskSecrets?: boolean | undefined;
    logExcerptLines?: number | undefined;
    displayMetadata?: string[] | undefined;
    autoWorklog?: boolean | undefined;
    notifications?: {
        enabled?: boolean | undefined;
        slack?: {
            webhookUrl: string;
            username?: string | undefined;
            channel?: string | undefined;
            notifyOn?: ("Critical" | "High" | "Medium" | "Low")[] | undefined;
            includeMetrics?: boolean | undefined;
        } | undefined;
        teams?: {
            webhookUrl: string;
            notifyOn?: ("Critical" | "High" | "Medium" | "Low")[] | undefined;
            includeMetrics?: boolean | undefined;
        } | undefined;
    } | undefined;
    selfHealing?: {
        enabled?: boolean | undefined;
        enableGuardrails?: boolean | undefined;
        dryRun?: boolean | undefined;
        minConfidence?: number | undefined;
        maxFilesChanged?: number | undefined;
        maxLinesChanged?: number | undefined;
        allowedCategories?: string[] | undefined;
        blockedPaths?: string[] | undefined;
        branchPrefix?: string | undefined;
        platform?: "github" | "azure-devops" | undefined;
        githubToken?: string | undefined;
        azureToken?: string | undefined;
        draftPr?: boolean | undefined;
        reviewers?: string[] | undefined;
        prLabels?: string[] | undefined;
        enableVerification?: boolean | undefined;
        verificationCommands?: string[] | undefined;
        autoRegenerateLockfile?: boolean | undefined;
    } | undefined;
}>;
type PipelineIQConfig = z.infer<typeof PipelineIQConfigSchema>;

declare const AIEnrichmentSchema: z.ZodObject<{
    summary: z.ZodOptional<z.ZodString>;
    rootCause: z.ZodOptional<z.ZodString>;
    remediation: z.ZodOptional<z.ZodString>;
    severity: z.ZodOptional<z.ZodEnum<["Critical", "High", "Medium", "Low"]>>;
    assignee: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    confidence: z.ZodOptional<z.ZodNumber>;
    postmortem: z.ZodOptional<z.ZodString>;
    timeline: z.ZodOptional<z.ZodString>;
    riskAssessment: z.ZodOptional<z.ZodString>;
    classification: z.ZodOptional<z.ZodEnum<["Infrastructure", "Build", "Deployment", "Test", "Dependency", "Security", "Authentication", "Timeout", "Network", "CloudProvider", "Unknown"]>>;
}, "strip", z.ZodTypeAny, {
    summary?: string | undefined;
    severity?: "Critical" | "High" | "Medium" | "Low" | undefined;
    assignee?: string | null | undefined;
    confidence?: number | undefined;
    rootCause?: string | undefined;
    remediation?: string | undefined;
    tags?: string[] | undefined;
    postmortem?: string | undefined;
    timeline?: string | undefined;
    riskAssessment?: string | undefined;
    classification?: "Infrastructure" | "Build" | "Deployment" | "Test" | "Dependency" | "Security" | "Authentication" | "Timeout" | "Network" | "CloudProvider" | "Unknown" | undefined;
}, {
    summary?: string | undefined;
    severity?: "Critical" | "High" | "Medium" | "Low" | undefined;
    assignee?: string | null | undefined;
    confidence?: number | undefined;
    rootCause?: string | undefined;
    remediation?: string | undefined;
    tags?: string[] | undefined;
    postmortem?: string | undefined;
    timeline?: string | undefined;
    riskAssessment?: string | undefined;
    classification?: "Infrastructure" | "Build" | "Deployment" | "Test" | "Dependency" | "Security" | "Authentication" | "Timeout" | "Network" | "CloudProvider" | "Unknown" | undefined;
}>;
type AIEnrichment = z.infer<typeof AIEnrichmentSchema>;
declare const DeterministicFallbackSchema: z.ZodObject<{
    summary: z.ZodOptional<z.ZodString>;
    rootCause: z.ZodOptional<z.ZodString>;
    remediation: z.ZodOptional<z.ZodString>;
    severity: z.ZodOptional<z.ZodEnum<["Critical", "High", "Medium", "Low"]>>;
    assignee: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    classification: z.ZodOptional<z.ZodEnum<["Infrastructure", "Build", "Deployment", "Test", "Dependency", "Security", "Authentication", "Timeout", "Network", "CloudProvider", "Unknown"]>>;
}, "strip", z.ZodTypeAny, {
    summary?: string | undefined;
    severity?: "Critical" | "High" | "Medium" | "Low" | undefined;
    assignee?: string | null | undefined;
    rootCause?: string | undefined;
    remediation?: string | undefined;
    tags?: string[] | undefined;
    classification?: "Infrastructure" | "Build" | "Deployment" | "Test" | "Dependency" | "Security" | "Authentication" | "Timeout" | "Network" | "CloudProvider" | "Unknown" | undefined;
}, {
    summary?: string | undefined;
    severity?: "Critical" | "High" | "Medium" | "Low" | undefined;
    assignee?: string | null | undefined;
    rootCause?: string | undefined;
    remediation?: string | undefined;
    tags?: string[] | undefined;
    classification?: "Infrastructure" | "Build" | "Deployment" | "Test" | "Dependency" | "Security" | "Authentication" | "Timeout" | "Network" | "CloudProvider" | "Unknown" | undefined;
}>;
type DeterministicFallback = z.infer<typeof DeterministicFallbackSchema>;
declare const EnrichmentResultSchema: z.ZodObject<{
    field: z.ZodString;
    value: z.ZodUnknown;
    provenance: z.ZodEnum<["deterministic", "computed", "ai", "fallback"]>;
    aiUsed: z.ZodDefault<z.ZodBoolean>;
    confidence: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    provenance: "deterministic" | "computed" | "ai" | "fallback";
    field: string;
    aiUsed: boolean;
    value?: unknown;
    confidence?: number | undefined;
}, {
    provenance: "deterministic" | "computed" | "ai" | "fallback";
    field: string;
    value?: unknown;
    confidence?: number | undefined;
    aiUsed?: boolean | undefined;
}>;
type EnrichmentResult = z.infer<typeof EnrichmentResultSchema>;

declare const DeduplicationResultSchema: z.ZodObject<{
    isDuplicate: z.ZodBoolean;
    existingIssueId: z.ZodOptional<z.ZodString>;
    existingIssueKey: z.ZodOptional<z.ZodString>;
    similarity: z.ZodOptional<z.ZodNumber>;
    signature: z.ZodString;
    clusterId: z.ZodOptional<z.ZodString>;
    relatedIncidents: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    isDuplicate: boolean;
    signature: string;
    existingIssueId?: string | undefined;
    existingIssueKey?: string | undefined;
    similarity?: number | undefined;
    clusterId?: string | undefined;
    relatedIncidents?: string[] | undefined;
}, {
    isDuplicate: boolean;
    signature: string;
    existingIssueId?: string | undefined;
    existingIssueKey?: string | undefined;
    similarity?: number | undefined;
    clusterId?: string | undefined;
    relatedIncidents?: string[] | undefined;
}>;
type DeduplicationResult = z.infer<typeof DeduplicationResultSchema>;
declare const FailureSignatureSchema: z.ZodObject<{
    repo: z.ZodString;
    workflow: z.ZodString;
    step: z.ZodString;
    errorPattern: z.ZodString;
    category: z.ZodString;
    environment: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    step: string;
    category: string;
    repo: string;
    workflow: string;
    errorPattern: string;
    environment?: string | undefined;
}, {
    step: string;
    category: string;
    repo: string;
    workflow: string;
    errorPattern: string;
    environment?: string | undefined;
}>;
type FailureSignature = z.infer<typeof FailureSignatureSchema>;
declare const IncidentClusterSchema: z.ZodObject<{
    clusterId: z.ZodString;
    signature: z.ZodObject<{
        repo: z.ZodString;
        workflow: z.ZodString;
        step: z.ZodString;
        errorPattern: z.ZodString;
        category: z.ZodString;
        environment: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        step: string;
        category: string;
        repo: string;
        workflow: string;
        errorPattern: string;
        environment?: string | undefined;
    }, {
        step: string;
        category: string;
        repo: string;
        workflow: string;
        errorPattern: string;
        environment?: string | undefined;
    }>;
    count: z.ZodNumber;
    firstSeen: z.ZodString;
    lastSeen: z.ZodString;
    issueIds: z.ZodArray<z.ZodString, "many">;
    isActive: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    signature: {
        step: string;
        category: string;
        repo: string;
        workflow: string;
        errorPattern: string;
        environment?: string | undefined;
    };
    clusterId: string;
    count: number;
    firstSeen: string;
    lastSeen: string;
    issueIds: string[];
    isActive: boolean;
}, {
    signature: {
        step: string;
        category: string;
        repo: string;
        workflow: string;
        errorPattern: string;
        environment?: string | undefined;
    };
    clusterId: string;
    count: number;
    firstSeen: string;
    lastSeen: string;
    issueIds: string[];
    isActive?: boolean | undefined;
}>;
type IncidentCluster = z.infer<typeof IncidentClusterSchema>;

declare const FileChangeSchema: z.ZodObject<{
    /** Relative path from repo root (e.g. "package.json", "src/utils.ts") */
    filePath: z.ZodString;
    /** The action to take on this file */
    action: z.ZodEnum<["modify", "create", "delete"]>;
    /** Original file content (for modify/delete — used for PR diff context) */
    originalContent: z.ZodOptional<z.ZodString>;
    /** New file content after the fix */
    newContent: z.ZodOptional<z.ZodString>;
    /** Human-readable explanation of what this specific change does */
    changeDescription: z.ZodString;
}, "strip", z.ZodTypeAny, {
    action: "modify" | "create" | "delete";
    filePath: string;
    changeDescription: string;
    originalContent?: string | undefined;
    newContent?: string | undefined;
}, {
    action: "modify" | "create" | "delete";
    filePath: string;
    changeDescription: string;
    originalContent?: string | undefined;
    newContent?: string | undefined;
}>;
type FileChange = z.infer<typeof FileChangeSchema>;
declare const CodeFixSchema: z.ZodObject<{
    /** Unique identifier for traceability */
    id: z.ZodString;
    /** Human-readable title for the fix (used as PR title) */
    title: z.ZodString;
    /** Detailed explanation of what the fix does and why */
    description: z.ZodString;
    /** List of file-level changes */
    changes: z.ZodArray<z.ZodObject<{
        /** Relative path from repo root (e.g. "package.json", "src/utils.ts") */
        filePath: z.ZodString;
        /** The action to take on this file */
        action: z.ZodEnum<["modify", "create", "delete"]>;
        /** Original file content (for modify/delete — used for PR diff context) */
        originalContent: z.ZodOptional<z.ZodString>;
        /** New file content after the fix */
        newContent: z.ZodOptional<z.ZodString>;
        /** Human-readable explanation of what this specific change does */
        changeDescription: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        action: "modify" | "create" | "delete";
        filePath: string;
        changeDescription: string;
        originalContent?: string | undefined;
        newContent?: string | undefined;
    }, {
        action: "modify" | "create" | "delete";
        filePath: string;
        changeDescription: string;
        originalContent?: string | undefined;
        newContent?: string | undefined;
    }>, "many">;
    /** AI confidence in this fix (0–1) */
    confidence: z.ZodNumber;
    /** Failure category this fix addresses */
    category: z.ZodString;
    /** Risk assessment of applying this fix */
    riskLevel: z.ZodEnum<["low", "medium", "high"]>;
    /** Estimated time saved by this fix (in minutes) */
    estimatedTimeSavedMinutes: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    id: string;
    title: string;
    description: string;
    category: string;
    changes: {
        action: "modify" | "create" | "delete";
        filePath: string;
        changeDescription: string;
        originalContent?: string | undefined;
        newContent?: string | undefined;
    }[];
    confidence: number;
    riskLevel: "low" | "medium" | "high";
    estimatedTimeSavedMinutes?: number | undefined;
}, {
    id: string;
    title: string;
    description: string;
    category: string;
    changes: {
        action: "modify" | "create" | "delete";
        filePath: string;
        changeDescription: string;
        originalContent?: string | undefined;
        newContent?: string | undefined;
    }[];
    confidence: number;
    riskLevel: "low" | "medium" | "high";
    estimatedTimeSavedMinutes?: number | undefined;
}>;
type CodeFix = z.infer<typeof CodeFixSchema>;
declare const SelfHealingConfigSchema: z.ZodObject<{
    /** Master switch for self-healing */
    enabled: z.ZodDefault<z.ZodBoolean>;
    /** Master switch for safety guardrails. Defaults to ON — enforces the confidence
     *  gate, file/line scope limits, category allow-list, and blocked-path protection.
     *  Set to false to let the AI attempt fixes on a wider range of failures. */
    enableGuardrails: z.ZodDefault<z.ZodBoolean>;
    /** Generate the fix but don't push/create PR */
    dryRun: z.ZodDefault<z.ZodBoolean>;
    /** Minimum AI confidence required to attempt a fix (0–1) */
    minConfidence: z.ZodDefault<z.ZodNumber>;
    /** Maximum number of files a single fix can touch */
    maxFilesChanged: z.ZodDefault<z.ZodNumber>;
    /** Maximum total lines changed across all files */
    maxLinesChanged: z.ZodDefault<z.ZodNumber>;
    /** Failure categories eligible for self-healing */
    allowedCategories: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    /** Glob patterns for files that must never be auto-fixed */
    blockedPaths: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    /** Branch name prefix for fix branches */
    branchPrefix: z.ZodDefault<z.ZodString>;
    /** Git provider platform ("github" | "azure-devops") — auto-detected from event.source */
    platform: z.ZodOptional<z.ZodEnum<["github", "azure-devops"]>>;
    /** GitHub token for PR creation (falls back to GITHUB_TOKEN env) */
    githubToken: z.ZodOptional<z.ZodString>;
    /** Azure DevOps PAT for PR creation (falls back to SYSTEM_ACCESSTOKEN env) */
    azureToken: z.ZodOptional<z.ZodString>;
    /** Add draft PR instead of ready-for-review */
    draftPr: z.ZodDefault<z.ZodBoolean>;
    /** Auto-assign PR reviewers (GitHub usernames or ADO identities) */
    reviewers: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    /** PR labels to apply */
    prLabels: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    /** Enable local verification commands (compilation/testing/regeneration) */
    enableVerification: z.ZodDefault<z.ZodBoolean>;
    /** Commands to run in sequence to verify the code fix.
     *  Empty array (default) = auto-detected from package.json scripts + failure category. */
    verificationCommands: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    /** Automatically regenerate auto-generated lockfiles (package-lock.json, yarn.lock, etc.) when desynchronization is detected */
    autoRegenerateLockfile: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    enabled: boolean;
    enableGuardrails: boolean;
    dryRun: boolean;
    minConfidence: number;
    maxFilesChanged: number;
    maxLinesChanged: number;
    allowedCategories: string[];
    blockedPaths: string[];
    branchPrefix: string;
    draftPr: boolean;
    reviewers: string[];
    prLabels: string[];
    enableVerification: boolean;
    verificationCommands: string[];
    autoRegenerateLockfile: boolean;
    platform?: "github" | "azure-devops" | undefined;
    githubToken?: string | undefined;
    azureToken?: string | undefined;
}, {
    enabled?: boolean | undefined;
    enableGuardrails?: boolean | undefined;
    dryRun?: boolean | undefined;
    minConfidence?: number | undefined;
    maxFilesChanged?: number | undefined;
    maxLinesChanged?: number | undefined;
    allowedCategories?: string[] | undefined;
    blockedPaths?: string[] | undefined;
    branchPrefix?: string | undefined;
    platform?: "github" | "azure-devops" | undefined;
    githubToken?: string | undefined;
    azureToken?: string | undefined;
    draftPr?: boolean | undefined;
    reviewers?: string[] | undefined;
    prLabels?: string[] | undefined;
    enableVerification?: boolean | undefined;
    verificationCommands?: string[] | undefined;
    autoRegenerateLockfile?: boolean | undefined;
}>;
type SelfHealingConfig = z.infer<typeof SelfHealingConfigSchema>;
declare const SelfHealingResultSchema: z.ZodObject<{
    /** Whether a fix was attempted */
    attempted: z.ZodBoolean;
    /** Whether the fix was successfully applied */
    success: z.ZodBoolean;
    /** The generated code fix (present even in dry-run) */
    fix: z.ZodOptional<z.ZodObject<{
        /** Unique identifier for traceability */
        id: z.ZodString;
        /** Human-readable title for the fix (used as PR title) */
        title: z.ZodString;
        /** Detailed explanation of what the fix does and why */
        description: z.ZodString;
        /** List of file-level changes */
        changes: z.ZodArray<z.ZodObject<{
            /** Relative path from repo root (e.g. "package.json", "src/utils.ts") */
            filePath: z.ZodString;
            /** The action to take on this file */
            action: z.ZodEnum<["modify", "create", "delete"]>;
            /** Original file content (for modify/delete — used for PR diff context) */
            originalContent: z.ZodOptional<z.ZodString>;
            /** New file content after the fix */
            newContent: z.ZodOptional<z.ZodString>;
            /** Human-readable explanation of what this specific change does */
            changeDescription: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            action: "modify" | "create" | "delete";
            filePath: string;
            changeDescription: string;
            originalContent?: string | undefined;
            newContent?: string | undefined;
        }, {
            action: "modify" | "create" | "delete";
            filePath: string;
            changeDescription: string;
            originalContent?: string | undefined;
            newContent?: string | undefined;
        }>, "many">;
        /** AI confidence in this fix (0–1) */
        confidence: z.ZodNumber;
        /** Failure category this fix addresses */
        category: z.ZodString;
        /** Risk assessment of applying this fix */
        riskLevel: z.ZodEnum<["low", "medium", "high"]>;
        /** Estimated time saved by this fix (in minutes) */
        estimatedTimeSavedMinutes: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        title: string;
        description: string;
        category: string;
        changes: {
            action: "modify" | "create" | "delete";
            filePath: string;
            changeDescription: string;
            originalContent?: string | undefined;
            newContent?: string | undefined;
        }[];
        confidence: number;
        riskLevel: "low" | "medium" | "high";
        estimatedTimeSavedMinutes?: number | undefined;
    }, {
        id: string;
        title: string;
        description: string;
        category: string;
        changes: {
            action: "modify" | "create" | "delete";
            filePath: string;
            changeDescription: string;
            originalContent?: string | undefined;
            newContent?: string | undefined;
        }[];
        confidence: number;
        riskLevel: "low" | "medium" | "high";
        estimatedTimeSavedMinutes?: number | undefined;
    }>>;
    /** URL of the created Pull Request */
    prUrl: z.ZodOptional<z.ZodString>;
    /** PR number */
    prNumber: z.ZodOptional<z.ZodNumber>;
    /** Branch name used for the fix */
    branchName: z.ZodOptional<z.ZodString>;
    /** Reason if self-healing was skipped or failed */
    reason: z.ZodOptional<z.ZodString>;
    /** Whether this was a dry run */
    dryRun: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    dryRun: boolean;
    attempted: boolean;
    success: boolean;
    reason?: string | undefined;
    prNumber?: number | undefined;
    fix?: {
        id: string;
        title: string;
        description: string;
        category: string;
        changes: {
            action: "modify" | "create" | "delete";
            filePath: string;
            changeDescription: string;
            originalContent?: string | undefined;
            newContent?: string | undefined;
        }[];
        confidence: number;
        riskLevel: "low" | "medium" | "high";
        estimatedTimeSavedMinutes?: number | undefined;
    } | undefined;
    prUrl?: string | undefined;
    branchName?: string | undefined;
}, {
    attempted: boolean;
    success: boolean;
    reason?: string | undefined;
    prNumber?: number | undefined;
    dryRun?: boolean | undefined;
    fix?: {
        id: string;
        title: string;
        description: string;
        category: string;
        changes: {
            action: "modify" | "create" | "delete";
            filePath: string;
            changeDescription: string;
            originalContent?: string | undefined;
            newContent?: string | undefined;
        }[];
        confidence: number;
        riskLevel: "low" | "medium" | "high";
        estimatedTimeSavedMinutes?: number | undefined;
    } | undefined;
    prUrl?: string | undefined;
    branchName?: string | undefined;
}>;
type SelfHealingResult = z.infer<typeof SelfHealingResultSchema>;

type CreateIssueResult = {
    id: string;
    key: string;
    self: string;
};
type FoundIssue = {
    id: string;
    key: string;
    self: string;
    summary: string;
    status: string;
};
interface JiraClient {
    createIssue(spec: JiraTicketSpec): Promise<CreateIssueResult>;
    updateIssue(issueKey: string, spec: JiraTicketSpec): Promise<void>;
    addComment(issueKey: string, body: string): Promise<void>;
    findBySignature(projectKey: string, signature: string, windowHours: number): Promise<FoundIssue | null>;
    attachFile(issueKey: string, filename: string, content: string | Buffer): Promise<void>;
    createRemoteLink(issueKey: string, title: string, url: string, globalId?: string): Promise<void>;
    fetchAll<T>(fetcher: (startAt: number) => Promise<{
        values: T[];
        isLast: boolean;
    }>): Promise<T[]>;
    request<T>(method: string, url: string, data?: any, params?: any): Promise<T>;
    requestFull<T>(method: string, url: string, data?: any, params?: any): Promise<any>;
    checkConnection(): Promise<boolean>;
    getServerInfo(): Promise<any>;
    doTransition(issueKey: string, transitionId: string): Promise<void>;
    getTransitions(issueKey: string): Promise<any[]>;
    assignIssue(issueKey: string, assigneeId: string | null): Promise<void>;
    getIssue(issueKey: string): Promise<any>;
    deleteIssue(issueKey: string): Promise<void>;
    bulkFetchIssues(issueKeys: string[]): Promise<any[]>;
    bulkCreateIssues(specs: JiraTicketSpec[]): Promise<CreateIssueResult[]>;
    getCreateIssueMeta(projectKeys?: string[], issueTypeNames?: string[]): Promise<any>;
    getEditIssueMeta(issueKey: string): Promise<any>;
    getApiPath(path: string): string;
    formatDescription(text: string): any;
    formatAssignee(assigneeId: string): any;
}
/**
 * Factory for platform-specific Jira Clients
 */
declare function createJiraClient(auth: JiraAuth): JiraClient;

/**
 * The mutable context that flows through the enrichment pipeline.
 * Each enricher reads from `event` and writes into `fields`, recording its
 * source in `provenance` so we can audit which stage produced what.
 */
type EnrichmentContext = {
    event: FailureEvent;
    config: PipelineIQConfig;
    fields: Partial<JiraTicketSpec>;
    provenance: Record<string, FieldProvenance>;
    history?: {
        similarCount: number;
        isFlaky: boolean;
        previousIncidentKeys: string[];
        trend?: "improving" | "worsening" | "stable" | undefined;
        relatedKeys: string[];
    };
    metrics?: ComputedMetrics;
};
interface Enricher {
    readonly name: string;
    readonly source: FieldProvenance;
    enrich(ctx: EnrichmentContext): Promise<void> | void;
}
/**
 * Set a field on the spec and record its provenance in one step.
 * If the field is already populated by an earlier enricher, this is a no-op
 * unless `override` is set — letting AI override deterministic values, but
 * preventing accidental clobbers between same-stage enrichers.
 */
declare function setField<K extends keyof JiraTicketSpec>(ctx: EnrichmentContext, key: K, value: JiraTicketSpec[K], source: FieldProvenance, override?: boolean): void;

type ChannelResult = {
    success: boolean;
    error?: string;
};
type NotificationResult = {
    slack?: ChannelResult;
    teams?: ChannelResult;
};
type NotificationMetrics = {
    mttrHours?: number;
    blastRadius?: number;
};
type NotificationPayload = {
    title: string;
    summary?: string;
    severity: string;
    priority: string;
    jiraKey: string;
    jiraUrl: string;
    repo: string;
    pipeline: string;
    branch: string;
    isNewTicket: boolean;
    dedupCount?: number;
    metrics?: NotificationMetrics;
};

declare class NotificationService {
    private config;
    constructor(config: NotificationsConfig);
    send(payload: NotificationPayload): Promise<NotificationResult>;
}

type ProcessResultBase = {
    spec: JiraTicketSpec;
    metrics?: ComputedMetrics;
    notifications?: NotificationResult;
    selfHealing?: SelfHealingResult;
};
type ProcessResult = ({
    action: "created";
    issueKey: string;
} & ProcessResultBase) | ({
    action: "updated";
    issueKey: string;
} & ProcessResultBase) | ({
    action: "skipped";
    reason: string;
} & ProcessResultBase);
type ProcessOptions = {
    /** Inject extra enrichers (e.g., AI enricher) between computed and rendering. */
    extraEnrichers?: Enricher[];
    /** Pre-built Jira client (mainly for tests). */
    jiraClient?: JiraClient;
    /** Pino logger (defaults to silent in production-like envs). */
    logger?: Logger;
};
/**
 * The spine of PipelineIQ.
 *
 * Pipeline (in order):
 *   1. DeterministicEnricher  — always runs, pulls fields from event payload.
 *   2. ComputedEnricher       — heuristics: signature match, dedup hash, severity.
 *   3. extraEnrichers         — optional (typically AI). Can override prior values.
 *   4. renderDescription      — builds the final markdown ticket description.
 *   5. JiraClient.findBySignature → updateIssue OR createIssue.
 */
declare function processFailureEvent(event: FailureEvent, config: PipelineIQConfig, options?: ProcessOptions): Promise<ProcessResult>;

/**
 * DeterministicEnricher — populates every field that's derivable directly
 * from the FailureEvent without computation, history, or AI.
 *
 * This always runs first, always succeeds, never makes network calls.
 */
declare const deterministicEnricher: Enricher;

/**
 * ComputedEnricher — derives fields via heuristics, pattern matching, and
 * (eventually) history queries. Runs after Deterministic, before AI.
 *
 * This is where the signature library lights up the RCA + remediation fallback,
 * the dedup signature is computed, and the severity rules are applied.
 */
declare const computedEnricher: Enricher;

/**
 * AIEnricher — uses the AIEngine to provide high-fidelity diagnostics.
 * This should run after deterministic and computed enrichers.
 */
declare const aiEnricher: Enricher;

/**
 * Build the markdown ticket description from the event + already-populated fields.
 * Called late in the pipeline, after all enrichers have run.
 */
declare function renderDescription(event: FailureEvent, fields: Partial<JiraTicketSpec>, logExcerptLines: number, maskLogs: boolean, displayMetadata?: string[], history?: {
    similarCount: number;
    isFlaky: boolean;
    previousIncidentKeys: string[];
    trend?: "improving" | "worsening" | "stable" | undefined;
    relatedKeys: string[];
}, metrics?: ComputedMetrics): string;

/**
 * Deterministic dedup signature.
 *
 * Two failures collide on the same signature when they share:
 *   repo + pipeline + failed step + failure category + error-shape fingerprint
 *
 * The "error-shape fingerprint" normalizes the error message — strips numbers,
 * UUIDs, paths, and timestamps — so that "Lock ID: 8d7a6" and "Lock ID: 9e8b7"
 * dedupe to the same incident.
 */
declare function computeDedupSignature(event: FailureEvent, category: FailureCategory): string;
/**
 * Repo-independent failure fingerprint.
 *
 * Unlike the dedup signature — which is scoped to a single repo + pipeline + step —
 * this hashes only the failure *shape* (category + normalized error text). The same
 * underlying failure (e.g. a bad shared dependency) surfacing in DIFFERENT repositories
 * therefore collides on the same fingerprint. Emitted as a `piq-fp:` label and used by
 * HistoryService.getMetrics() to compute blast radius (how many repos a failure touches).
 */
declare function computeFailureFingerprint(event: FailureEvent, category: FailureCategory): string;

/**
 * Failure signature library — pattern-matches log content and error messages
 * to a known failure category. Drives both deterministic classification and
 * (when AI is disabled) the RCA/remediation fallback.
 *
 * Add new patterns here as you learn them. Order matters: first match wins,
 * so put narrower / higher-confidence patterns above broader ones.
 */
type SignaturePattern = {
    id: string;
    category: FailureCategory;
    pattern: RegExp;
    cause: string;
    remediation: string[];
};
declare const SIGNATURES: readonly SignaturePattern[];
type SignatureMatch = SignaturePattern & {
    matchedText: string;
    confidence: number;
};
/**
 * Enhanced signature matching logic.
 *
 * Performant: Uses pre-grouped patterns.
 * Granular: Supports category hints to narrow the search space.
 */
declare function matchSignature(input: string, options?: {
    categoryHint?: FailureCategory | undefined;
}): SignatureMatch | null;

declare function maskSecrets(input: string): string;

declare const AIProviderSchema: z.ZodEnum<["openai", "anthropic", "azure-openai", "local", "gemini"]>;
type AIProvider = z.infer<typeof AIProviderSchema>;
declare const AIRequestSchema: z.ZodObject<{
    logs: z.ZodString;
    errorMessage: z.ZodOptional<z.ZodString>;
    stackTrace: z.ZodOptional<z.ZodString>;
    failedCommand: z.ZodOptional<z.ZodString>;
    exitCode: z.ZodOptional<z.ZodNumber>;
    pipelineName: z.ZodString;
    repositoryName: z.ZodString;
    branch: z.ZodString;
    environment: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    historicalContext: z.ZodOptional<z.ZodString>;
    isRawPrompt: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    logs: string;
    branch: string;
    pipelineName: string;
    repositoryName: string;
    exitCode?: number | undefined;
    errorMessage?: string | undefined;
    failedCommand?: string | undefined;
    stackTrace?: string | undefined;
    environment?: string | undefined;
    category?: string | undefined;
    historicalContext?: string | undefined;
    isRawPrompt?: boolean | undefined;
}, {
    logs: string;
    branch: string;
    pipelineName: string;
    repositoryName: string;
    exitCode?: number | undefined;
    errorMessage?: string | undefined;
    failedCommand?: string | undefined;
    stackTrace?: string | undefined;
    environment?: string | undefined;
    category?: string | undefined;
    historicalContext?: string | undefined;
    isRawPrompt?: boolean | undefined;
}>;
type AIRequest = z.infer<typeof AIRequestSchema>;
declare const AIResponseSchema: z.ZodObject<{
    summary: z.ZodOptional<z.ZodString>;
    rootCause: z.ZodOptional<z.ZodString>;
    remediation: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    severity: z.ZodOptional<z.ZodEnum<["Critical", "High", "Medium", "Low"]>>;
    assignee: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    confidence: z.ZodOptional<z.ZodNumber>;
    postmortem: z.ZodOptional<z.ZodString>;
    timeline: z.ZodOptional<z.ZodString>;
    riskAssessment: z.ZodOptional<z.ZodString>;
    classification: z.ZodOptional<z.ZodEnum<["Infrastructure", "Build", "Deployment", "Test", "Dependency", "Security", "Authentication", "Timeout", "Network", "CloudProvider", "Unknown"]>>;
}, "strip", z.ZodTypeAny, {
    summary?: string | undefined;
    severity?: "Critical" | "High" | "Medium" | "Low" | undefined;
    assignee?: string | null | undefined;
    confidence?: number | undefined;
    rootCause?: string | undefined;
    remediation?: string[] | undefined;
    tags?: string[] | undefined;
    postmortem?: string | undefined;
    timeline?: string | undefined;
    riskAssessment?: string | undefined;
    classification?: "Infrastructure" | "Build" | "Deployment" | "Test" | "Dependency" | "Security" | "Authentication" | "Timeout" | "Network" | "CloudProvider" | "Unknown" | undefined;
}, {
    summary?: string | undefined;
    severity?: "Critical" | "High" | "Medium" | "Low" | undefined;
    assignee?: string | null | undefined;
    confidence?: number | undefined;
    rootCause?: string | undefined;
    remediation?: string[] | undefined;
    tags?: string[] | undefined;
    postmortem?: string | undefined;
    timeline?: string | undefined;
    riskAssessment?: string | undefined;
    classification?: "Infrastructure" | "Build" | "Deployment" | "Test" | "Dependency" | "Security" | "Authentication" | "Timeout" | "Network" | "CloudProvider" | "Unknown" | undefined;
}>;
type AIResponse = z.infer<typeof AIResponseSchema>;
declare const AIEngineConfigSchema: z.ZodObject<{
    provider: z.ZodOptional<z.ZodEnum<["openai", "anthropic", "azure-openai", "local", "gemini"]>>;
    apiKey: z.ZodOptional<z.ZodString>;
    model: z.ZodOptional<z.ZodString>;
    endpoint: z.ZodOptional<z.ZodString>;
    deployment: z.ZodOptional<z.ZodString>;
    apiVersion: z.ZodOptional<z.ZodString>;
    modelPath: z.ZodOptional<z.ZodString>;
    maxTokens: z.ZodDefault<z.ZodNumber>;
    temperature: z.ZodDefault<z.ZodNumber>;
    timeout: z.ZodDefault<z.ZodNumber>;
    retryAttempts: z.ZodDefault<z.ZodNumber>;
    minConfidence: z.ZodDefault<z.ZodNumber>;
    /** Enable extended thinking / reasoning for models that support it.
     *  Gemini 2.5+: uses thinkingConfig with thinkingBudget tokens.
     *  Anthropic: uses extended_thinking with budget_tokens. */
    enableThinking: z.ZodDefault<z.ZodBoolean>;
    /** Token budget for thinking (Gemini: thinkingBudget, Anthropic: budget_tokens).
     *  -1 = dynamic (model decides). Only used when enableThinking is true. */
    thinkingBudget: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    minConfidence: number;
    temperature: number;
    enableThinking: boolean;
    thinkingBudget: number;
    timeout: number;
    maxTokens: number;
    retryAttempts: number;
    provider?: "openai" | "anthropic" | "azure-openai" | "gemini" | "local" | undefined;
    apiKey?: string | undefined;
    model?: string | undefined;
    endpoint?: string | undefined;
    deployment?: string | undefined;
    apiVersion?: string | undefined;
    modelPath?: string | undefined;
}, {
    provider?: "openai" | "anthropic" | "azure-openai" | "gemini" | "local" | undefined;
    minConfidence?: number | undefined;
    apiKey?: string | undefined;
    model?: string | undefined;
    endpoint?: string | undefined;
    temperature?: number | undefined;
    enableThinking?: boolean | undefined;
    thinkingBudget?: number | undefined;
    timeout?: number | undefined;
    deployment?: string | undefined;
    apiVersion?: string | undefined;
    modelPath?: string | undefined;
    maxTokens?: number | undefined;
    retryAttempts?: number | undefined;
}>;
type AIEngineConfig = z.infer<typeof AIEngineConfigSchema>;
interface AIProviderInterface {
    name: string;
    isAvailable(): boolean;
    generateInsights(request: AIRequest): Promise<AIResponse>;
}
interface IAIEngine {
    enrich(event: FailureEvent, config: AIEngineConfig): Promise<EnrichmentResult[]>;
    isAvailable(): boolean;
    getProvider(): string;
}

/**
 * Main AI Engine implementation with deterministic fallbacks
 * Follows PRD Section 14: AI is OPTIONAL with deterministic fallbacks
 */
declare class AIEngine implements IAIEngine {
    private provider;
    private config;
    private isInitialized;
    constructor(config: AIEngineConfig);
    /**
     * Initialize AI provider based on configuration
     */
    private initializeProvider;
    /**
     * Check if AI engine is available and ready
     */
    isAvailable(): boolean;
    /**
     * Get the name of the current provider
     */
    getProvider(): string;
    /**
     * Main enrichment method - follows PRD architectural contract
     *
     * Pipeline:
     * field value = AI producer (if enabled & succeeds & confidence ≥ threshold)
     *            → deterministic producer (always)
     *            → null / omitted (only for advanced AI-only fields)
     */
    enrich(event: FailureEvent, config: AIEngineConfig, history?: EnrichmentContext["history"]): Promise<EnrichmentResult[]>;
    /**
     * Add deterministic fallback results to enrichment results
     */
    private addDeterministicResults;
    /**
     * Build AI request from failure event and deterministic fallback
     */
    private buildAIRequest;
    /**
     * Create AI engine instance with mode-based configuration
     */
    static create(mode: "disabled" | "assist" | "full", config?: Partial<AIEngineConfig>): AIEngine;
    private severityToPriority;
}

/**
 * OpenAI provider implementation
 */
declare class OpenAIProvider implements AIProviderInterface {
    name: string;
    private apiKey;
    private model;
    private maxTokens;
    private temperature;
    private endpoint;
    private apiVersion;
    private enableThinking;
    private thinkingBudget;
    constructor(config: AIEngineConfig);
    isAvailable(): boolean;
    /** o1 / o3 / o4 series use Chat Completions with reasoning_effort */
    private isReasoningModel;
    /** gpt-5.x models use the new Responses API */
    private isResponsesApiModel;
    /**
     * Map thinkingBudget → reasoning effort for o-series Chat Completions.
     * Accepts "low" | "medium" | "high".
     */
    private reasoningEffort;
    /**
     * Map thinkingBudget → reasoning effort for gpt-5.x Responses API.
     * Accepts "none" | "minimal" | "low" | "medium" | "high" | "xhigh".
     */
    private responsesApiReasoningEffort;
    generateInsights(request: AIRequest): Promise<AIResponse>;
    private buildPrompt;
    private parseResponse;
    private extractField;
    private extractArrayField;
}
/**
 * Anthropic provider implementation
 */
declare class AnthropicProvider implements AIProviderInterface {
    name: string;
    private apiKey;
    private model;
    private maxTokens;
    private temperature;
    private endpoint;
    private apiVersion;
    private enableThinking;
    private thinkingBudget;
    constructor(config: AIEngineConfig);
    isAvailable(): boolean;
    generateInsights(request: AIRequest): Promise<AIResponse>;
    private buildPrompt;
    private parseResponse;
    private extractField;
    private extractArrayField;
}
/**
 * Azure OpenAI provider implementation
 */
declare class AzureOpenAIProvider implements AIProviderInterface {
    name: string;
    private apiKey;
    private endpoint;
    private deployment;
    private apiVersion;
    private model;
    private maxTokens;
    private temperature;
    private enableThinking;
    private thinkingBudget;
    constructor(config: AIEngineConfig);
    isAvailable(): boolean;
    private isReasoningModel;
    private isResponsesApiModel;
    private reasoningEffort;
    private responsesApiReasoningEffort;
    generateInsights(request: AIRequest): Promise<AIResponse>;
    private buildPrompt;
    private parseResponse;
    private extractField;
    private extractArrayField;
}
/**
 * Local AI provider implementation for OpenAI-compatible local endpoints
 * (e.g. Ollama, Llama.cpp, LM Studio)
 *
 * Supports reasoning models that emit <think>…</think> blocks
 * (DeepSeek-R1, QwQ, Phi-4-reasoning, etc.).  When enableThinking is true
 * a chain-of-thought instruction is prepended so non-native reasoning models
 * also reason step-by-step.
 */
declare class LocalAIProvider implements AIProviderInterface {
    name: string;
    private baseURL;
    private model;
    private maxTokens;
    private temperature;
    private apiKey;
    private enableThinking;
    constructor(config: AIEngineConfig);
    isAvailable(): boolean;
    generateInsights(request: AIRequest): Promise<AIResponse>;
    private buildPrompt;
    private parseResponse;
}

/**
 * Deterministic fallback implementation as specified in PRD Section 14
 * Provides fallback values when AI is disabled or fails
 */
declare class DeterministicFallbackEngine {
    /**
     * Generate deterministic summary using template
     * Template: "{workflow} failed at {step} on {branch} (exit {code})"
     */
    static generateSummary(event: FailureEvent): string;
    /**
     * Generate RCA using signature library lookup
     */
    static generateRootCause(event: FailureEvent, category: FailureCategory): string;
    /**
     * Generate remediation using signature library or category-based default
     */
    static generateRemediation(category: FailureCategory, event: FailureEvent): string[];
    /**
     * Generate classification using core signature library
     */
    static generateClassification(event: FailureEvent): FailureCategory;
    /**
     * Generate severity using rule-based approach
     */
    static generateSeverity(event: FailureEvent, category: FailureCategory): Severity;
    /**
     * Generate tags using {category, branch, repo, env} auto-labels
     */
    static generateTags(event: FailureEvent, category: FailureCategory): string[];
    /**
     * Generate risk assessment using heuristic: branch + env + recent failure rate
     */
    static generateRiskAssessment(event: FailureEvent, failureRate?: number): string;
    /**
     * Generate complete deterministic fallback response
     */
    static generateFallback(event: FailureEvent): DeterministicFallback;
    private static severityToPriority;
}

declare const LogEntrySchema: z.ZodObject<{
    timestamp: z.ZodOptional<z.ZodString>;
    level: z.ZodOptional<z.ZodEnum<["debug", "info", "warn", "error", "fatal"]>>;
    message: z.ZodString;
    source: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    message: string;
    source?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
    level?: "error" | "fatal" | "warn" | "info" | "debug" | undefined;
    timestamp?: string | undefined;
}, {
    message: string;
    source?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
    level?: "error" | "fatal" | "warn" | "info" | "debug" | undefined;
    timestamp?: string | undefined;
}>;
type LogEntry = z.infer<typeof LogEntrySchema>;
declare const ParsedLogSchema: z.ZodObject<{
    entries: z.ZodArray<z.ZodObject<{
        timestamp: z.ZodOptional<z.ZodString>;
        level: z.ZodOptional<z.ZodEnum<["debug", "info", "warn", "error", "fatal"]>>;
        message: z.ZodString;
        source: z.ZodOptional<z.ZodString>;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        message: string;
        source?: string | undefined;
        metadata?: Record<string, unknown> | undefined;
        level?: "error" | "fatal" | "warn" | "info" | "debug" | undefined;
        timestamp?: string | undefined;
    }, {
        message: string;
        source?: string | undefined;
        metadata?: Record<string, unknown> | undefined;
        level?: "error" | "fatal" | "warn" | "info" | "debug" | undefined;
        timestamp?: string | undefined;
    }>, "many">;
    errorMessages: z.ZodArray<z.ZodString, "many">;
    stackTraces: z.ZodArray<z.ZodString, "many">;
    exitCodes: z.ZodArray<z.ZodNumber, "many">;
    failedCommands: z.ZodArray<z.ZodString, "many">;
    relevantEntries: z.ZodArray<z.ZodObject<{
        timestamp: z.ZodOptional<z.ZodString>;
        level: z.ZodOptional<z.ZodEnum<["debug", "info", "warn", "error", "fatal"]>>;
        message: z.ZodString;
        source: z.ZodOptional<z.ZodString>;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        message: string;
        source?: string | undefined;
        metadata?: Record<string, unknown> | undefined;
        level?: "error" | "fatal" | "warn" | "info" | "debug" | undefined;
        timestamp?: string | undefined;
    }, {
        message: string;
        source?: string | undefined;
        metadata?: Record<string, unknown> | undefined;
        level?: "error" | "fatal" | "warn" | "info" | "debug" | undefined;
        timestamp?: string | undefined;
    }>, "many">;
    summary: z.ZodOptional<z.ZodString>;
    truncated: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    entries: {
        message: string;
        source?: string | undefined;
        metadata?: Record<string, unknown> | undefined;
        level?: "error" | "fatal" | "warn" | "info" | "debug" | undefined;
        timestamp?: string | undefined;
    }[];
    errorMessages: string[];
    stackTraces: string[];
    exitCodes: number[];
    failedCommands: string[];
    relevantEntries: {
        message: string;
        source?: string | undefined;
        metadata?: Record<string, unknown> | undefined;
        level?: "error" | "fatal" | "warn" | "info" | "debug" | undefined;
        timestamp?: string | undefined;
    }[];
    truncated: boolean;
    summary?: string | undefined;
}, {
    entries: {
        message: string;
        source?: string | undefined;
        metadata?: Record<string, unknown> | undefined;
        level?: "error" | "fatal" | "warn" | "info" | "debug" | undefined;
        timestamp?: string | undefined;
    }[];
    errorMessages: string[];
    stackTraces: string[];
    exitCodes: number[];
    failedCommands: string[];
    relevantEntries: {
        message: string;
        source?: string | undefined;
        metadata?: Record<string, unknown> | undefined;
        level?: "error" | "fatal" | "warn" | "info" | "debug" | undefined;
        timestamp?: string | undefined;
    }[];
    summary?: string | undefined;
    truncated?: boolean | undefined;
}>;
type ParsedLog = z.infer<typeof ParsedLogSchema>;
declare const LogFormatSchema: z.ZodEnum<["github-actions", "azure-devops", "terraform", "kubernetes", "docker", "junit", "generic"]>;
type LogFormat = z.infer<typeof LogFormatSchema>;
declare const ParseOptionsSchema: z.ZodObject<{
    format: z.ZodDefault<z.ZodEnum<["github-actions", "azure-devops", "terraform", "kubernetes", "docker", "junit", "generic"]>>;
    maxEntries: z.ZodDefault<z.ZodNumber>;
    extractStackTraces: z.ZodDefault<z.ZodBoolean>;
    extractErrorMessages: z.ZodDefault<z.ZodBoolean>;
    extractExitCodes: z.ZodDefault<z.ZodBoolean>;
    extractCommands: z.ZodDefault<z.ZodBoolean>;
    relevantKeywords: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    format: "azure-devops" | "terraform" | "docker" | "github-actions" | "kubernetes" | "junit" | "generic";
    maxEntries: number;
    extractStackTraces: boolean;
    extractErrorMessages: boolean;
    extractExitCodes: boolean;
    extractCommands: boolean;
    relevantKeywords: string[];
}, {
    format?: "azure-devops" | "terraform" | "docker" | "github-actions" | "kubernetes" | "junit" | "generic" | undefined;
    maxEntries?: number | undefined;
    extractStackTraces?: boolean | undefined;
    extractErrorMessages?: boolean | undefined;
    extractExitCodes?: boolean | undefined;
    extractCommands?: boolean | undefined;
    relevantKeywords?: string[] | undefined;
}>;
type ParseOptions = z.infer<typeof ParseOptionsSchema>;

/**
 * Main log parsing function that delegates to format-specific parsers
 */
declare function parseLogs(rawLogs: string, options?: Partial<ParseOptions>): ParsedLog;

/**
 * Extractors for specific patterns from log content
 */
/**
 * Extract error messages from logs
 */
declare function extractErrorMessages(logs: string): string[];
/**
 * Extract stack traces from logs
 */
declare function extractStackTraces(logs: string): string[];
/**
 * Extract exit codes from logs
 */
declare function extractExitCodes(logs: string): number[];
/**
 * Extract failed commands from logs
 */
declare function extractFailedCommands(logs: string): string[];
/**
 * Extract deployment targets from logs
 */
declare function extractDeploymentTargets(logs: string): string[];
/**
 * Extract security issues from logs
 */
declare function extractSecurityIssues(logs: string): string[];
/**
 * Extract performance issues from logs
 */
declare function extractPerformanceIssues(logs: string): string[];

/**
 * Smart log excerpt — step-structure-aware log excerpt for Jira ticket descriptions.
 *
 * Strategy chain (highest to lowest fidelity):
 *   1. step-aware    — GitHub Actions (##[group]) or Azure DevOps (##[section]) markers found
 *   2. error-anchored — any log: find first ERROR/FATAL line + context window
 *   3. tail-fallback  — no errors found: last maxLines lines (original behaviour)
 */
type StepStatus = "passed" | "failed" | "skipped";
type StepInfo = {
    name: string;
    status: StepStatus;
    startLine: number;
    endLine: number;
};
type ExcerptStrategy = "step-aware" | "error-anchored" | "tail-fallback";
type SmartExcerptResult = {
    text: string;
    strategy: ExcerptStrategy;
    failingStep?: string;
};
/**
 * Parse step boundaries from log lines.
 * Returns [] for sources without step markers (fallback handled by caller).
 */
declare function parseSteps(lines: string[], source: string): StepInfo[];
/**
 * Return indices of all lines that match an error anchor pattern.
 */
declare function findErrorAnchors(lines: string[]): number[];
/**
 * Render a compact one-line breadcrumb from the step list.
 * Truncated at 120 chars with "…" if needed.
 */
declare function renderBreadcrumb(steps: StepInfo[]): string;
/**
 * Render the output of a single step within the line budget.
 * Trims from the top when over budget. Highlights error anchors with ▶.
 * Returns "[Step produced no output]" for empty steps.
 */
declare function renderStepOutput(allLines: string[], step: StepInfo, budget: number): string;
/**
 * Build a smart log excerpt. Called by the renderer instead of tailLines().
 *
 * Strategy chain:
 *   1. step-aware     — GitHub Actions or Azure DevOps markers detected
 *   2. error-anchored — generic log with detectable error lines
 *   3. tail-fallback  — last maxLines lines (original behaviour)
 */
declare function buildSmartExcerpt(log: string, source: string, maxLines: number): SmartExcerptResult;

/**
 * Enhanced Jira client with additional PRD features
 * Wraps base client with custom fields, bulk operations, and advanced search
 */
declare class EnhancedJiraClient implements JiraClient {
    private client;
    private customFieldMapping;
    private isCloud;
    constructor(auth: JiraAuth, customFieldMapping?: JiraCustomFieldMapping);
    createIssue(spec: JiraTicketSpec): Promise<any>;
    updateIssue(issueKey: string, spec: JiraTicketSpec): Promise<void>;
    addComment(issueKey: string, body: string): Promise<void>;
    findBySignature(projectKey: string, signature: string, windowHours: number): Promise<any>;
    attachFile(issueKey: string, filename: string, content: string | Buffer): Promise<void>;
    createRemoteLink(issueKey: string, title: string, url: string, globalId?: string): Promise<void>;
    fetchAll<T>(fetcher: (startAt: number) => Promise<{
        values: T[];
        isLast: boolean;
    }>): Promise<T[]>;
    request<T>(method: string, url: string, data?: any, params?: any): Promise<T>;
    requestFull<T>(method: string, url: string, data?: any, params?: any): Promise<any>;
    checkConnection(): Promise<boolean>;
    getServerInfo(): Promise<any>;
    doTransition(issueKey: string, transitionId: string): Promise<void>;
    getTransitions(issueKey: string): Promise<any[]>;
    assignIssue(issueKey: string, assigneeId: string | null): Promise<void>;
    getIssue(issueKey: string): Promise<any>;
    deleteIssue(issueKey: string): Promise<void>;
    bulkFetchIssues(issueKeys: string[]): Promise<any[]>;
    bulkCreateIssues(specs: JiraTicketSpec[]): Promise<any[]>;
    getCreateIssueMeta(projectKeys?: string[], issueTypeNames?: string[]): Promise<any>;
    getEditIssueMeta(issueKey: string): Promise<any>;
    getApiPath(path: string): string;
    formatDescription(text: string): any;
    formatAssignee(assigneeId: string): any;
    /**
     * Create issue with enhanced metadata from PRD
     * Supports all 80-120 operational fields
     */
    createEnhancedIssue(spec: JiraTicketSpec): Promise<any>;
    /**
     * Update issue with enhanced metadata
     */
    updateEnhancedIssue(issueKey: string, spec: JiraTicketSpec): Promise<void>;
    /**
     * Add multiple comments in bulk
     */
    addBulkComments(issueKey: string, comments: string[]): Promise<void>;
    /**
     * Add external links to issue
     */
    addExternalLinks(issueKey: string, links: ExternalLink[]): Promise<void>;
    /**
     * Search issues with advanced JQL
     */
    advancedSearch(jql: string, options?: {
        maxResults?: number;
        startAt?: number;
        fields?: string[];
        expand?: string[];
    }): Promise<{
        issues: any[];
        total: number;
        startAt: number;
        maxResults: number;
    }>;
    /**
     * Find issues by multiple criteria
     */
    findSimilarIssues(projectKey: string, criteria: {
        signature?: string;
        category?: string;
        repository?: string;
        branch?: string;
        timeWindow?: number;
    }): Promise<any[]>;
    /**
     * Get issue with all fields including custom fields
     */
    getFullIssue(issueKey: string): Promise<any>;
    /**
     * Add worklog entry
     */
    addWorklog(issueKey: string, timeSpentSeconds: number, comment?: string): Promise<void>;
    /**
     * Transition issue to new status
     */
    transitionIssue(issueKey: string, transitionName: string, comment?: string): Promise<void>;
    /**
     * Add watchers to issue
     */
    addWatchers(issueKey: string, watchers: string[]): Promise<void>;
    /**
     * Link issues together
     */
    linkIssues(fromIssueKey: string, toIssueKey: string, linkType?: string): Promise<void>;
    /**
     * Get project metadata
     */
    getProject(projectKey: string): Promise<any>;
    /**
     * Get issue types for project
     */
    getIssueTypes(projectKey: string): Promise<any[]>;
    /**
     * Build enhanced payload with all PRD fields
     */
    private buildEnhancedPayload;
    /**
     * Build enhanced fields object with all operational metadata
     */
    private buildEnhancedFields;
}

declare class JiraApiError extends Error {
    readonly status: number;
    readonly body?: unknown | undefined;
    readonly name = "JiraApiError";
    constructor(message: string, status: number, body?: unknown | undefined);
    toString(): string;
    static from(error: any): JiraApiError;
}
declare class JiraConfigError extends Error {
    readonly name = "JiraConfigError";
    constructor(message?: string);
}

/**
 * Minimal converter: Markdown → Atlassian Document Format (ADF).
 * Jira Cloud's REST v3 API requires ADF, not plain markdown, for issue descriptions.
 * Supports headings, paragraphs, code blocks, tables, and links — enough for our renderer.
 */
type AdfNode = {
    type: string;
    attrs?: Record<string, unknown>;
    content?: AdfNode[];
    text?: string;
    marks?: Array<{
        type: string;
        attrs?: Record<string, unknown>;
    }>;
};
type AdfDoc = {
    version: 1;
    type: "doc";
    content: AdfNode[];
};
declare function markdownToAdf(md: string): AdfDoc;

/**
 * Factory for the enhanced Jira client (supports historical search)
 */
declare function createEnhancedJiraClient(auth: JiraAuth, customFields?: JiraCustomFieldMapping): EnhancedJiraClient;

/**
 * SelfHealingEngine — the orchestrator for autonomous remediation.
 *
 * Flow:
 *   1. Check eligibility (category, config, AI availability)
 *   2. Generate a code fix via AI
 *   3. Validate the fix against safety guardrails
 *   4. Create branch → commit → PR via the appropriate GitProvider
 *   5. Return a SelfHealingResult for Jira linking and notifications
 */
declare class SelfHealingEngine {
    private config;
    private fixGenerator;
    constructor(config: SelfHealingConfig, aiConfig: AIEngineConfig);
    /**
     * Attempt to self-heal a pipeline failure.
     *
     * @param event       The failure event
     * @param rootCause   AI-generated root cause (from enrichment pipeline)
     * @param remediation AI-generated remediation steps
     * @param category    Failure classification
     * @param issueKey    The Jira issue key (for cross-linking in the PR)
     * @returns           SelfHealingResult with fix details and PR URL
     */
    attemptFix(event: FailureEvent, rootCause: string, remediation: string[], category: string, issueKey: string): Promise<SelfHealingResult>;
    /**
     * Validate a fix against all configured safety guardrails.
     * Returns an error message if the fix is rejected, or null if it passes.
     */
    private validateGuardrails;
    private isCategoryAllowed;
    private resolveProvider;
    private detectPlatform;
    private buildBranchName;
    private getWorkspaceRoot;
    private isLockfileDesync;
    /**
     * Auto-detect the verification commands to run after applying a fix.
     *
     * Priority:
     *   1. If the user explicitly provided commands via config, use those.
     *   2. Detect the language/ecosystem from files in the workspace.
     *   3. Pick install + build/test/lint commands for that ecosystem based on
     *      the failure category.
     *   4. If the ecosystem is unrecognised, return [] (skip verification rather
     *      than running a wrong command and getting a false failure).
     */
    private resolveVerificationCommands;
}

/**
 * AI-powered code fix generator.
 *
 * Takes a FailureEvent with its diagnostic context (root cause, remediation steps)
 * and asks the AI to produce a structured code patch that can be committed as a fix.
 *
 * The generator uses a specialized prompt that constrains the AI to produce
 * surgical, low-risk fixes — never sweeping refactors.
 */
declare class FixGenerator {
    private provider;
    constructor(config: AIEngineConfig);
    private initializeProvider;
    isAvailable(): boolean;
    /**
     * Generate a structured code fix from the failure context.
     *
     * @param event       The full failure event with logs, errors, etc.
     * @param rootCause   AI-generated root cause analysis
     * @param remediation AI-generated remediation steps
     * @param category    Failure classification
     * @returns           A CodeFix if the AI can produce one, or null
     */
    generateFix(event: FailureEvent, rootCause: string, remediation: string[], category: string, retryContext?: {
        previousError: string;
    }): Promise<CodeFix | null>;
    /**
     * Determine the root workspace path (GitHub, ADO, or local fallback)
     */
    private getWorkspaceRoot;
    private extractFilePaths;
    /**
     * Read files from the local workspace to give the AI context.
     */
    private getWorkspaceContext;
    /**
     * Build the specialized prompt for code fix generation.
     * This is the core of the self-healing intelligence.
     */
    private buildFixPrompt;
    /**
     * Parse the AI response into a structured CodeFix.
     */
    private parseFix;
}

/**
 * Result of creating a Pull Request via a GitProvider
 */
type PRCreationResult = {
    /** URL of the created PR */
    prUrl: string;
    /** PR number/ID */
    prNumber: number;
    /** Branch name used */
    branchName: string;
};
/**
 * Platform-agnostic interface for Git operations required by Self-Healing.
 *
 * Implementations create a branch → commit changes → open a PR.
 * The PR is always created as draft (when supported) and requires human review.
 */
interface GitProvider {
    /** Human-readable name (e.g. "github", "azure-devops") */
    readonly name: string;
    /**
     * Create a branch, commit the fix, and open a Pull Request.
     *
     * @param fix        The CodeFix containing file changes
     * @param repoOwner  Repository owner / organization
     * @param repoName   Repository name
     * @param baseBranch The branch to target (the branch that failed)
     * @param baseSha    The commit SHA that failed (branch head)
     * @param issueKey   Jira issue key for cross-linking
     * @param options    Additional options (draft, reviewers, labels)
     */
    createFixPR(fix: CodeFix, repoOwner: string, repoName: string, baseBranch: string, baseSha: string, issueKey: string, options: PROptions): Promise<PRCreationResult>;
}
type PROptions = {
    /** Use a draft PR (default: true) */
    draft: boolean;
    /** Reviewers to request */
    reviewers: string[];
    /** Labels to apply to the PR */
    labels: string[];
    /** Branch name to use for the fix */
    branchName: string;
};

export { type AIConfig, AIConfigSchema, AIEngine, type AIEngineConfig, AIEngineConfigSchema, type AIEnrichment, AIEnrichmentSchema, type AIMode, AIModeSchema, type AIProvider, type AIProviderInterface, AIProviderSchema, type AIRequest, AIRequestSchema, type AIResponse, AIResponseSchema, type AdfDoc, type AdfNode, AnthropicProvider, AzureOpenAIProvider, type CodeFix, CodeFixSchema, type Commit, CommitSchema, type ComputedMetrics, type CreateIssueResult, type DedupConfig, DedupConfigSchema, type DeduplicationResult, DeduplicationResultSchema, type DeterministicFallback, DeterministicFallbackEngine, DeterministicFallbackSchema, EnhancedJiraClient, type Enricher, type EnrichmentContext, type EnrichmentResult, EnrichmentResultSchema, type ExcerptStrategy, type ExternalLink, ExternalLinkSchema, type FailureCategory, FailureCategorySchema, type FailureDetails, FailureDetailsSchema, type FailureEvent, FailureEventSchema, type FailureSignature, FailureSignatureSchema, type FailureSource, FailureSourceSchema, type FieldProvenance, FieldProvenanceSchema, type FileChange, FileChangeSchema, FixGenerator, type FoundIssue, type GitProvider, type IAIEngine, type IncidentCluster, IncidentClusterSchema, JiraApiError, type JiraAuth, JiraAuthSchema, type JiraClient, JiraConfigError, type JiraCustomFieldMapping, JiraCustomFieldMappingSchema, type JiraTicketSpec, JiraTicketSpecSchema, LocalAIProvider, type LogEntry, LogEntrySchema, type LogFormat, LogFormatSchema, type NotificationFields, NotificationFieldsSchema, type NotificationPayload, type NotificationResult, NotificationService, type NotificationsConfig, NotificationsConfigSchema, OpenAIProvider, type OperationalMetrics, OperationalMetricsSchema, type OwnershipRouting, OwnershipRoutingSchema, type PRCreationResult, type ParseOptions, ParseOptionsSchema, type ParsedLog, ParsedLogSchema, type Pipeline, type PipelineIQConfig, PipelineIQConfigSchema, PipelineSchema, type Priority, PrioritySchema, type ProcessOptions, type ProcessResult, type PullRequest, PullRequestSchema, type Repository, RepositorySchema, SIGNATURES, type SelfHealingConfig, SelfHealingConfigSchema, SelfHealingEngine, type SelfHealingResult, SelfHealingResultSchema, type Severity, SeveritySchema, type SignatureMatch, type SignaturePattern, type SlackConfig, SlackConfigSchema, type SmartExcerptResult, type StepInfo, type StepStatus, type TeamsConfig, TeamsConfigSchema, aiEnricher, buildSmartExcerpt, computeDedupSignature, computeFailureFingerprint, computedEnricher, createEnhancedJiraClient, createJiraClient, deterministicEnricher, extractDeploymentTargets, extractErrorMessages, extractExitCodes, extractFailedCommands, extractPerformanceIssues, extractSecurityIssues, extractStackTraces, findErrorAnchors, markdownToAdf, maskSecrets, matchSignature, parseLogs, parseSteps, processFailureEvent, renderBreadcrumb, renderDescription, renderStepOutput, setField };
