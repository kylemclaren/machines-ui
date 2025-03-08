export interface App {
  id: string;
  name: string;
  organization: {
    id: string;
    slug: string;
  };
  status: string;
}

export interface ListAppsResponse {
  apps: App[];
}

export interface Machine {
  id: string;
  name: string;
  state: "created" | "started" | "stopped" | "suspended";
  region: string;
  instance_id: string;
  private_ip: string;
  config: MachineConfig;
  image_ref: {
    registry: string;
    repository: string;
    tag: string;
    digest: string;
  };
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  events?: MachineEvent[];
  app_id: string;
}

export interface MachineConfig {
  env: Record<string, string>;
  init: {
    exec?: string[];
    entrypoint?: string[];
    cmd?: string[];
    tty?: boolean;
  };
  image: string;
  services: Service[];
  guest: {
    cpu_kind: string;
    cpus: number;
    memory_mb: number;
  };
  metadata?: Record<string, string>;
  restart: {
    policy: string;
  };
}

export interface Service {
  protocol: string;
  internal_port: number;
  ports: {
    port: number;
    handlers: string[];
  }[];
}

export interface MachineEvent {
  id: string;
  type: string;
  status: string;
  source: string;
  timestamp: string;
  request?: Record<string, any>;
  data?: Record<string, any>;
}

export interface MachineMetadata {
  [key: string]: string | number | boolean | null | Record<string, any>;
}

export interface Volume {
  id: string;
  name: string;
  size_gb: number;
  region: string;
  zone: string;
  encrypted: boolean;
  attached_machine_id?: string;
  attached_app_id?: string;
  created_at: string;
  snapshot_retention: number;
}

export interface CreateAppRequest {
  app_name: string;
  org_slug: string;
  network?: string;
  enable_subdomains?: boolean;
}

export interface CreateMachineRequest {
  name?: string;
  config: MachineConfig;
  region?: string;
}

export interface UpdateMachineRequest {
  config?: Partial<MachineConfig>;
  current_version?: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
} 