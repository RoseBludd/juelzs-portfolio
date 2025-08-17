import { promises as fs } from 'fs';
import path from 'path';

import { WorkspaceManagementService } from '../WorkspaceManagementService';

jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn(),
    writeFile: jest.fn(),
  },
}));

describe('WorkspaceManagementService', () => {
  const mockConfig = {
    baseServerPath: '/server',
    maxDevelopersPerServer: 10,
    servers: [
      {
        id: 'server1',
        name: 'Development Server 1',
        ipAddress: '192.168.1.100',
        availableSlots: 5,
        status: 'active' as const,
      },
    ],
    workspaceStructure: {
      componentsDir: 'components-needed',
      testUsersFile: 'test-users.json',
      authKeysDir: 'authentication-keys',
      readmeFile: 'README-task-details.txt',
      runEnvironmentScript: 'run-environment.ps1',
      logsDir: 'logs',
    },
  };

  let service: WorkspaceManagementService;

  beforeEach(() => {
    service = new WorkspaceManagementService(mockConfig);
    jest.clearAllMocks();
  });

  describe('createWorkspace', () => {
    it('should create a workspace with the correct structure', async () => {
      const developerId = 'dev123';
      const taskId = 'task456';

      const workspaceId = await service.createWorkspace(developerId, taskId);

      // Check workspace ID format
      expect(workspaceId).toBe(`task-${taskId}-${developerId}`);

      // Check if directories were created
      expect(fs.mkdir).toHaveBeenCalledWith(
        expect.stringContaining('server1/workspaces/task-task456-dev123'),
        expect.any(Object)
      );

      // Check if test users file was created
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('test-users.json'),
        expect.any(String)
      );

      // Check if README was created
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('README-task-details.txt'),
        expect.any(String)
      );

      // Check if environment script was created
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('run-environment.ps1'),
        expect.stringMatching(/\$SERVER_IP = "192\.168\.1\.100"/)
      );
    });

    it('should throw an error when no servers are available', async () => {
      const serviceWithNoServers = new WorkspaceManagementService({
        ...mockConfig,
        servers: [],
      });

      await expect(
        serviceWithNoServers.createWorkspace('dev123', 'task456')
      ).rejects.toThrow('No available servers found');
    });

    it('should throw an error when all servers are full', async () => {
      const serviceWithFullServers = new WorkspaceManagementService({
        ...mockConfig,
        servers: [{
          ...mockConfig.servers[0],
          status: 'full' as const,
        }],
      });

      await expect(
        serviceWithFullServers.createWorkspace('dev123', 'task456')
      ).rejects.toThrow('No available servers found');
    });
  });
}); 
