/* eslint-disable @typescript-eslint/no-explicit-any */
export interface IWorkerHostMain {
	startWorkerJob(type: string, argRep: any): Promise<any>;
}
