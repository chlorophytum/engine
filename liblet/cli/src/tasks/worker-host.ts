export interface IWorkerHostMain {
	startWorkerJob(type: string, argRep: any): Promise<any>;
}
