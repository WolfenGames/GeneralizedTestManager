import RunnerType from "./runner_type";

class Monitor {
  path: string;

  runners: RunnerType[];

  evidence_collector?: string[];

  constructor(data: Partial<Monitor> = {}) {
    this.path = data.path ?? "";
    this.runners = data.runners ?? [];
    this.evidence_collector = data.evidence_collector ?? [];
  }
}

export default Monitor;
