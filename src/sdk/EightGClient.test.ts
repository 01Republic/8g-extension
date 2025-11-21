/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EightGClient, WorkspaceItemSchema, WorkspaceDetailItemSchema } from './EightGClient';
import {
  ExecutionContext,
  CollectWorkflowRequest,
  CollectWorkflowResult,
} from './types';
import { EightGError } from './errors';

describe('EightGClient Context Helper Functions', () => {
  describe('getFromContext', () => {
    it('should get step result data by path', () => {
      const context: ExecutionContext = {
        steps: {
          getProducts: {
            result: {
              data: [
                { id: 1, name: 'Apple' },
                { id: 2, name: 'Banana' },
              ],
            },
            success: true,
            skipped: false,
          },
        },
        vars: {},
      };

      const data = EightGClient.getFromContext(context, 'steps.getProducts.result.data');
      expect(data).toEqual([
        { id: 1, name: 'Apple' },
        { id: 2, name: 'Banana' },
      ]);
    });

    it('should get var by path', () => {
      const context: ExecutionContext = {
        steps: {},
        vars: {
          userId: '12345',
          apiKey: 'sk-test',
        },
      };

      const userId = EightGClient.getFromContext(context, 'vars.userId');
      expect(userId).toBe('12345');
    });

    it('should get forEach item by path', () => {
      const context: ExecutionContext = {
        steps: {},
        vars: {},
        forEach: {
          item: { id: 1, name: 'Apple' },
          index: 0,
          total: 5,
        },
      };

      const item = EightGClient.getFromContext(context, 'forEach.item');
      expect(item).toEqual({ id: 1, name: 'Apple' });

      const index = EightGClient.getFromContext(context, 'forEach.index');
      expect(index).toBe(0);
    });

    it('should get loop context by path', () => {
      const context: ExecutionContext = {
        steps: {},
        vars: {},
        loop: {
          index: 3,
          count: 10,
        },
      };

      const index = EightGClient.getFromContext(context, 'loop.index');
      expect(index).toBe(3);

      const count = EightGClient.getFromContext(context, 'loop.count');
      expect(count).toBe(10);
    });

    it('should return undefined for non-existent path', () => {
      const context: ExecutionContext = {
        steps: {},
        vars: {},
      };

      const result = EightGClient.getFromContext(context, 'steps.nonExistent.result.data');
      expect(result).toBeUndefined();
    });

    it('should handle nested object access', () => {
      const context: ExecutionContext = {
        steps: {
          fetchUser: {
            result: {
              data: {
                user: {
                  profile: {
                    name: 'John Doe',
                    age: 30,
                  },
                },
              },
            },
            success: true,
            skipped: false,
          },
        },
        vars: {},
      };

      const name = EightGClient.getFromContext(
        context,
        'steps.fetchUser.result.data.user.profile.name'
      );
      expect(name).toBe('John Doe');
    });
  });

  describe('getStepResult', () => {
    it('should get step result by stepId', () => {
      const context: ExecutionContext = {
        steps: {
          getProducts: {
            result: { data: [{ id: 1, name: 'Apple' }] },
            success: true,
            skipped: false,
          },
        },
        vars: {},
      };

      const stepResult = EightGClient.getStepResult(context, 'getProducts');
      expect(stepResult).toEqual({
        result: { data: [{ id: 1, name: 'Apple' }] },
        success: true,
        skipped: false,
      });
    });

    it('should return undefined for non-existent step', () => {
      const context: ExecutionContext = {
        steps: {},
        vars: {},
      };

      const stepResult = EightGClient.getStepResult(context, 'nonExistent');
      expect(stepResult).toBeUndefined();
    });

    it('should access step properties', () => {
      const context: ExecutionContext = {
        steps: {
          checkStatus: {
            result: { data: 'OK' },
            success: true,
            skipped: false,
          },
        },
        vars: {},
      };

      const stepResult = EightGClient.getStepResult(context, 'checkStatus');
      expect(stepResult.success).toBe(true);
      expect(stepResult.skipped).toBe(false);
      expect(stepResult.result.data).toBe('OK');
    });
  });

  describe('getStepData', () => {
    it('should get step data directly', () => {
      const context: ExecutionContext = {
        steps: {
          getProducts: {
            result: {
              data: [
                { id: 1, name: 'Apple' },
                { id: 2, name: 'Banana' },
              ],
            },
            success: true,
            skipped: false,
          },
        },
        vars: {},
      };

      const data = EightGClient.getStepData(context, 'getProducts');
      expect(data).toEqual([
        { id: 1, name: 'Apple' },
        { id: 2, name: 'Banana' },
      ]);
    });

    it('should return undefined for non-existent step', () => {
      const context: ExecutionContext = {
        steps: {},
        vars: {},
      };

      const data = EightGClient.getStepData(context, 'nonExistent');
      expect(data).toBeUndefined();
    });

    it('should handle various data types', () => {
      const context: ExecutionContext = {
        steps: {
          getString: {
            result: { data: 'Hello World' },
            success: true,
            skipped: false,
          },
          getNumber: {
            result: { data: 42 },
            success: true,
            skipped: false,
          },
          getBoolean: {
            result: { data: true },
            success: true,
            skipped: false,
          },
          getNull: {
            result: { data: null },
            success: true,
            skipped: false,
          },
        },
        vars: {},
      };

      expect(EightGClient.getStepData(context, 'getString')).toBe('Hello World');
      expect(EightGClient.getStepData(context, 'getNumber')).toBe(42);
      expect(EightGClient.getStepData(context, 'getBoolean')).toBe(true);
      expect(EightGClient.getStepData(context, 'getNull')).toBeNull();
    });
  });

  describe('getVar', () => {
    it('should get variable by key', () => {
      const context: ExecutionContext = {
        steps: {},
        vars: {
          userId: '12345',
          apiKey: 'sk-test',
          baseUrl: 'https://api.example.com',
        },
      };

      expect(EightGClient.getVar(context, 'userId')).toBe('12345');
      expect(EightGClient.getVar(context, 'apiKey')).toBe('sk-test');
      expect(EightGClient.getVar(context, 'baseUrl')).toBe('https://api.example.com');
    });

    it('should return undefined for non-existent variable', () => {
      const context: ExecutionContext = {
        steps: {},
        vars: {},
      };

      const value = EightGClient.getVar(context, 'nonExistent');
      expect(value).toBeUndefined();
    });

    it('should handle various variable types', () => {
      const context: ExecutionContext = {
        steps: {},
        vars: {
          stringVar: 'hello',
          numberVar: 123,
          booleanVar: true,
          objectVar: { key: 'value' },
          arrayVar: [1, 2, 3],
          nullVar: null,
        },
      };

      expect(EightGClient.getVar(context, 'stringVar')).toBe('hello');
      expect(EightGClient.getVar(context, 'numberVar')).toBe(123);
      expect(EightGClient.getVar(context, 'booleanVar')).toBe(true);
      expect(EightGClient.getVar(context, 'objectVar')).toEqual({ key: 'value' });
      expect(EightGClient.getVar(context, 'arrayVar')).toEqual([1, 2, 3]);
      expect(EightGClient.getVar(context, 'nullVar')).toBeNull();
    });
  });

  describe('Integration scenarios', () => {
    it('should work with realistic workflow result', () => {
      const context: ExecutionContext = {
        steps: {
          getProducts: {
            result: {
              data: [
                { id: 1, name: 'Apple', price: 150 },
                { id: 2, name: 'Banana', price: 50 },
              ],
            },
            success: true,
            skipped: false,
          },
          filterExpensive: {
            result: {
              data: [{ id: 1, name: 'Apple', price: 150 }],
            },
            success: true,
            skipped: false,
          },
          calculateTotal: {
            result: { data: 150 },
            success: true,
            skipped: false,
          },
        },
        vars: {
          minPrice: 100,
          userId: 'user123',
        },
      };

      // Get original products
      const products = EightGClient.getStepData(context, 'getProducts');
      expect(products).toHaveLength(2);

      // Get filtered products
      const expensive = EightGClient.getStepData(context, 'filterExpensive');
      expect(expensive).toHaveLength(1);
      expect(expensive[0].name).toBe('Apple');

      // Get total
      const total = EightGClient.getStepData(context, 'calculateTotal');
      expect(total).toBe(150);

      // Get vars
      const minPrice = EightGClient.getVar(context, 'minPrice');
      expect(minPrice).toBe(100);

      // Use getFromContext for deep access
      const firstProductName = EightGClient.getFromContext(
        context,
        'steps.getProducts.result.data.0.name'
      );
      expect(firstProductName).toBe('Apple');
    });
  });
});

describe('EightGClient - executeWorkflowAndValidate', () => {
  let client: EightGClient;
  let mockRequest: CollectWorkflowRequest;

  beforeEach(() => {
    client = new EightGClient();
    mockRequest = {
      targetUrl: 'https://test.com',
      workflow: {
        version: '1.0',
        start: 'step1',
        steps: [
          {
            id: 'step1',
            block: {
              name: 'get-text',
              selector: '.test',
              findBy: 'cssSelector',
              option: {},
            },
          },
        ],
      },
    };
  });

  describe('Array data validation', () => {
    it('should extract and validate workspace array data correctly', async () => {
      // Mock collectWorkflow to return valid workspace data
      const mockWorkflowResult: CollectWorkflowResult = {
        success: true,
        data: {
          success: true,
          message: undefined,
          data: [
            {
              id: 'ws-1',
              slug: 'test-workspace',
              name: 'Test Workspace',
              image: 'https://example.com/image.png',
              memberCount: 5,
              isAdmin: true,
            },
            {
              id: 'ws-2',
              slug: 'another-workspace',
              name: 'Another Workspace',
              image: 'https://example.com/image2.png',
              memberCount: 3,
              isAdmin: false,
            },
          ],
        },
        steps: [
          {
            stepId: 'step1',
            skipped: false,
            success: true,
            result: {
              data: [
                {
                  id: 'ws-1',
                  slug: 'test-workspace',
                  name: 'Test Workspace',
                  image: 'https://example.com/image.png',
                  memberCount: 5,
                  isAdmin: true,
                },
                {
                  id: 'ws-2',
                  slug: 'another-workspace',
                  name: 'Another Workspace',
                  image: 'https://example.com/image2.png',
                  memberCount: 3,
                  isAdmin: false,
                },
              ],
            },
            startedAt: '2023-01-01T00:00:00Z',
            finishedAt: '2023-01-01T00:00:01Z',
            attempts: 1,
          },
        ],
        context: { steps: {}, vars: {} },
        targetUrl: 'https://test.com',
        timestamp: '2023-01-01T00:00:00Z',
      };

      vi.spyOn(client, 'collectWorkflow').mockResolvedValue(mockWorkflowResult);

      const result = await client.getWorkspaces(mockRequest);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('success', true);
      expect(result.data).toHaveProperty('data');
      expect((result.data as any).data).toHaveLength(2);
      expect((result.data as any).data[0]).toEqual({
        id: 'ws-1',
        slug: 'test-workspace',
        name: 'Test Workspace',
        image: 'https://example.com/image.png',
        memberCount: 5,
        isAdmin: true,
      });
    });

    it('should filter out invalid items in array data', async () => {
      const mockWorkflowResult: CollectWorkflowResult = {
        success: true,
        data: {
          success: true,
          message: undefined,
          data: [
            {
              id: 'ws-1',
              slug: 'test-workspace',
              name: 'Test Workspace',
              image: 'https://example.com/image.png',
              memberCount: 5,
              isAdmin: true,
            },
            {
              // Invalid data - missing required fields
              id: 'ws-2',
              slug: 'invalid-workspace',
              // missing name, image, memberCount
            },
          ],
        },
        steps: [
          {
            stepId: 'step1',
            skipped: false,
            success: true,
            result: {
              data: [
                {
                  id: 'ws-1',
                  slug: 'test-workspace',
                  name: 'Test Workspace',
                  image: 'https://example.com/image.png',
                  memberCount: 5,
                  isAdmin: true,
                },
                {
                  // Invalid data - missing required fields
                  id: 'ws-2',
                  slug: 'invalid-workspace',
                  // missing name, image, memberCount
                },
              ],
            },
            startedAt: '2023-01-01T00:00:00Z',
            finishedAt: '2023-01-01T00:00:01Z',
            attempts: 1,
          },
        ],
        context: { steps: {}, vars: {} },
        targetUrl: 'https://test.com',
        timestamp: '2023-01-01T00:00:00Z',
      };

      vi.spyOn(client, 'collectWorkflow').mockResolvedValue(mockWorkflowResult);
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await client.getWorkspaces(mockRequest);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('success', true);
      expect(result.data).toHaveProperty('data');
      expect((result.data as any).data).toHaveLength(1); // Invalid items are filtered out, not set to undefined
      expect((result.data as any).data[0]).toEqual({
        id: 'ws-1',
        slug: 'test-workspace',
        name: 'Test Workspace',
        image: 'https://example.com/image.png',
        memberCount: 5,
        isAdmin: true,
      });
      expect(consoleSpy).toHaveBeenCalledWith(
        'Invalid data:',
        expect.any(Object),
        expect.any(Object)
      );

      consoleSpy.mockRestore();
    });

    it('should handle ResDataContainer format correctly', async () => {
      // Mock workflow result with ResDataContainer structure like your real data
      const mockWorkflowResult: CollectWorkflowResult = {
        success: true,
        data: {
          data: [
            {
              id: 'w1690183656-zyq378249',
              slug: 'w1690183656-zyq378249',
              name: '오구오구',
              image: 'https://a.slack-edge.com/80588/img/avatars-teams/ava_0017-88.png',
              memberCount: 6,
              isAdmin: true,
            },
            {
              id: 'slack-qwo8340',
              slug: 'slack-qwo8340',
              name: 'Slack',
              image: 'https://a.slack-edge.com/80588/img/avatars-teams/ava_0021-88.png',
              memberCount: 1,
              isAdmin: false,
            },
          ],
          success: true,
          message: undefined,
        },
        steps: [],
        context: { steps: {}, vars: {} },
        targetUrl: 'https://test.com',
        timestamp: '2023-01-01T00:00:00Z',
      };

      vi.spyOn(client, 'collectWorkflow').mockResolvedValue(mockWorkflowResult);

      const result = await client.getWorkspaces(mockRequest);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('success', true);
      expect(result.data).toHaveProperty('data');
      expect((result.data as any).data).toHaveLength(2);
      expect((result.data as any).data[0]).toEqual({
        id: 'w1690183656-zyq378249',
        slug: 'w1690183656-zyq378249',
        name: '오구오구',
        image: 'https://a.slack-edge.com/80588/img/avatars-teams/ava_0017-88.png',
        memberCount: 6,
        isAdmin: true,
      });
      expect((result.data as any).data[1]).toEqual({
        id: 'slack-qwo8340',
        slug: 'slack-qwo8340',
        name: 'Slack',
        image: 'https://a.slack-edge.com/80588/img/avatars-teams/ava_0021-88.png',
        memberCount: 1,
        isAdmin: false,
      });
    });

    it('should return empty array when no array data is provided', async () => {
      const mockWorkflowResult: CollectWorkflowResult = {
        success: true,
        data: [],
        steps: [
          {
            stepId: 'step1',
            skipped: false,
            success: true,
            result: {
              data: null,
            },
            startedAt: '2023-01-01T00:00:00Z',
            finishedAt: '2023-01-01T00:00:01Z',
            attempts: 1,
          },
        ],
        context: { steps: {}, vars: {} },
        targetUrl: 'https://test.com',
        timestamp: '2023-01-01T00:00:00Z',
      };

      vi.spyOn(client, 'collectWorkflow').mockResolvedValue(mockWorkflowResult);

      const result = await client.getWorkspaces(mockRequest);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });

  describe('Single object validation', () => {
    it('should extract and validate single object data correctly', async () => {
      const mockWorkflowResult: CollectWorkflowResult = {
        success: true,
        data: {
          success: true,
          message: undefined,
          data: {
            slug: 'test-workspace',
            displayName: 'Test Workspace',
            profileImageUrl: 'https://example.com/image.png',
            description: 'A test workspace',
            publicEmail: 'public@test.com',
            billingEmail: 'billing@test.com',
            orgPageUrl: 'https://test.com',
            roles: ['admin', 'member'],
          },
        },
        steps: [
          {
            stepId: 'step1',
            skipped: false,
            success: true,
            result: {
              data: {
                slug: 'test-workspace',
                displayName: 'Test Workspace',
                profileImageUrl: 'https://example.com/image.png',
                description: 'A test workspace',
                publicEmail: 'public@test.com',
                billingEmail: 'billing@test.com',
                orgPageUrl: 'https://test.com',
                roles: ['admin', 'member'],
              },
            },
            startedAt: '2023-01-01T00:00:00Z',
            finishedAt: '2023-01-01T00:00:01Z',
            attempts: 1,
          },
        ],
        context: { steps: {}, vars: {} },
        targetUrl: 'https://test.com',
        timestamp: '2023-01-01T00:00:00Z',
      };

      vi.spyOn(client, 'collectWorkflow').mockResolvedValue(mockWorkflowResult);

      const result = await client.getWorkspaceDetail('test-key', 'test-slug', mockRequest);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('success', true);
      expect(result.data).toHaveProperty('data');
      expect((result.data as any).data).toEqual({
        slug: 'test-workspace',
        displayName: 'Test Workspace',
        profileImageUrl: 'https://example.com/image.png',
        description: 'A test workspace',
        publicEmail: 'public@test.com',
        billingEmail: 'billing@test.com',
        orgPageUrl: 'https://test.com',
        roles: ['admin', 'member'],
      });
    });

    it('should return undefined data when validation fails for single object', async () => {
      const mockWorkflowResult: CollectWorkflowResult = {
        success: true,
        data: {
          success: true,
          message: undefined,
          data: {
            // Invalid data - missing required fields
            slug: 'test-workspace',
            // missing other required fields
          },
        },
        steps: [
          {
            stepId: 'step1',
            skipped: false,
            success: true,
            result: {
              data: {
                // Invalid data - missing required fields
                slug: 'test-workspace',
                // missing other required fields
              },
            },
            startedAt: '2023-01-01T00:00:00Z',
            finishedAt: '2023-01-01T00:00:01Z',
            attempts: 1,
          },
        ],
        context: { steps: {}, vars: {} },
        targetUrl: 'https://test.com',
        timestamp: '2023-01-01T00:00:00Z',
      };

      vi.spyOn(client, 'collectWorkflow').mockResolvedValue(mockWorkflowResult);
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await client.getWorkspaceDetail('test-key', 'test-slug', mockRequest);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('success', true);
      expect(result.data).toHaveProperty('data', undefined);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Invalid data:',
        expect.any(Object),
        expect.any(Object)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Error handling', () => {
    it('should throw EightGError when workflow fails', async () => {
      const mockWorkflowResult: CollectWorkflowResult = {
        success: false,
        data: [],
        steps: [],
        context: { steps: {}, vars: {} },
        targetUrl: 'https://test.com',
        timestamp: '2023-01-01T00:00:00Z',
        error: 'Workflow failed',
      };

      vi.spyOn(client, 'collectWorkflow').mockResolvedValue(mockWorkflowResult);

      await expect(client.getWorkspaces(mockRequest)).rejects.toThrow(EightGError);
      await expect(client.getWorkspaces(mockRequest)).rejects.toThrow('Failed to get workspaces');
    });
  });

  describe('Data extraction from workflow result', () => {
    it('should extract data from result.data directly', async () => {
      const mockWorkflowResult: CollectWorkflowResult = {
        success: true,
        data: {
          success: true,
          message: undefined,
          data: [
            {
              id: 'ws-1',
              slug: 'test-workspace',
              name: 'Test Workspace',
              image: 'https://example.com/image.png',
              memberCount: 5,
              isAdmin: true,
            },
          ],
        },
        steps: [
          {
            stepId: 'step1',
            skipped: false,
            success: true,
            result: {
              data: 'not-the-final-data',
            },
            startedAt: '2023-01-01T00:00:00Z',
            finishedAt: '2023-01-01T00:00:01Z',
            attempts: 1,
          },
          {
            stepId: 'step2',
            skipped: false,
            success: true,
            result: {
              data: [
                {
                  id: 'ws-1',
                  slug: 'test-workspace',
                  name: 'Test Workspace',
                  image: 'https://example.com/image.png',
                  memberCount: 5,
                  isAdmin: true,
                },
              ],
            },
            startedAt: '2023-01-01T00:00:01Z',
            finishedAt: '2023-01-01T00:00:02Z',
            attempts: 1,
          },
        ],
        context: { steps: {}, vars: {} },
        targetUrl: 'https://test.com',
        timestamp: '2023-01-01T00:00:00Z',
      };

      vi.spyOn(client, 'collectWorkflow').mockResolvedValue(mockWorkflowResult);

      const result = await client.getWorkspaces(mockRequest);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('success', true);
      expect(result.data).toHaveProperty('data');
      expect((result.data as any).data).toHaveLength(1);
      expect((result.data as any).data[0]).toEqual({
        id: 'ws-1',
        slug: 'test-workspace',
        name: 'Test Workspace',
        image: 'https://example.com/image.png',
        memberCount: 5,
        isAdmin: true,
      });
    });
  });

  describe('DTO structure match tests', () => {
    it('should match WorkspaceItemDto structure exactly', async () => {
      const testData = {
        id: 'ws-1',
        slug: 'test-workspace',
        name: 'Test Workspace',
        image: 'https://example.com/image.png',
        memberCount: 5,
        isAdmin: true,
      };

      const mockWorkflowResult: CollectWorkflowResult = {
        success: true,
        data: {
          success: true,
          message: undefined,
          data: [testData],
        },
        steps: [
          {
            stepId: 'step1',
            skipped: false,
            success: true,
            result: { data: [testData] },
            startedAt: '2023-01-01T00:00:00Z',
            finishedAt: '2023-01-01T00:00:01Z',
            attempts: 1,
          },
        ],
        context: { steps: {}, vars: {} },
        targetUrl: 'https://test.com',
        timestamp: '2023-01-01T00:00:00Z',
      };

      vi.spyOn(client, 'collectWorkflow').mockResolvedValue(mockWorkflowResult);

      const result = await client.getWorkspaces(mockRequest);

      // Check that the extracted data matches the DTO structure
      expect(result.data).toHaveProperty('success', true);
      expect(result.data).toHaveProperty('data');
      expect((result.data as any).data[0]).toEqual(testData);

      // Validate schema consistency
      const validation = WorkspaceItemSchema.safeParse((result.data as any).data[0]);
      expect(validation.success).toBe(true);
      expect(validation.data).toEqual(testData);
    });

    it('should match WorkspaceDetailItemDto structure exactly', async () => {
      const testData = {
        slug: 'test-workspace',
        displayName: 'Test Workspace',
        profileImageUrl: 'https://example.com/image.png',
        description: 'A test workspace',
        publicEmail: 'public@test.com',
        billingEmail: 'billing@test.com',
        orgPageUrl: 'https://test.com',
        roles: ['admin', 'member'],
      };

      const mockWorkflowResult: CollectWorkflowResult = {
        success: true,
        data: {
          success: true,
          message: undefined,
          data: testData,
        },
        steps: [
          {
            stepId: 'step1',
            skipped: false,
            success: true,
            result: { data: testData },
            startedAt: '2023-01-01T00:00:00Z',
            finishedAt: '2023-01-01T00:00:01Z',
            attempts: 1,
          },
        ],
        context: { steps: {}, vars: {} },
        targetUrl: 'https://test.com',
        timestamp: '2023-01-01T00:00:00Z',
      };

      vi.spyOn(client, 'collectWorkflow').mockResolvedValue(mockWorkflowResult);

      const result = await client.getWorkspaceDetail('test-key', 'test-slug', mockRequest);

      // Check that the extracted data matches the DTO structure
      expect(result.data).toHaveProperty('success', true);
      expect(result.data).toHaveProperty('data');
      expect((result.data as any).data).toEqual(testData);

      // Validate schema consistency
      const validation = WorkspaceDetailItemSchema.safeParse((result.data as any).data);
      expect(validation.success).toBe(true);
      expect(validation.data).toEqual(testData);
    });
  });
});
