interface WorkspaceUser {
  username: string;
  inUse: boolean;
  lastUsed?: Date;
}

const WORKSPACE_USERS: WorkspaceUser[] = [
  { username: 'vpnuser1', inUse: false },
  { username: 'vpnuser2', inUse: false },
  { username: 'vpnuser3', inUse: false },
  { username: 'vpnuser4', inUse: false },
  { username: 'vpnuser5', inUse: false }
];

export class WorkspaceManager {
  private static instance: WorkspaceManager;

  private constructor() {}

  public static getInstance(): WorkspaceManager {
    if (!WorkspaceManager.instance) {
      WorkspaceManager.instance = new WorkspaceManager();
    }
    return WorkspaceManager.instance;
  }

  async getAvailableWorkspace(): Promise<WorkspaceUser | null> {
    // Find first available workspace user
    const availableUser = WORKSPACE_USERS.find(user => !user.inUse);
    
    if (!availableUser) {
      return null;
    }

    // Mark as in use
    availableUser.inUse = true;
    availableUser.lastUsed = new Date();

    return availableUser;
  }

  async releaseWorkspace(username: string): Promise<void> {
    const user = WORKSPACE_USERS.find(u => u.username === username);
    if (user) {
      user.inUse = false;
    }
  }

  async getConnectionDetails(username: string) {
    return {
      rdpHost: '10.24.1.10',
      rdpUsername: username,
      rdpPassword: 'Roof$7663', // In production, this should be securely stored
      vpnServer: '128.177.144.197',
      vpnPort: 1194,
      vpnProtocol: 'udp'
    };
  }
} 
