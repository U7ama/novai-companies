// @vitest-environment node
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { resetCompaniesStore, getCompaniesStore } from './companies-store';
import { readCompaniesStore, mutateCompaniesStore } from './companies-repository';
const { send } = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: class {
    send = send;
  },
  GetItemCommand: class {
    constructor(public input: unknown) {}
  },
  PutItemCommand: class {
    constructor(public input: unknown) {}
  }
}));
const conflict = () =>
  Object.assign(new Error('Concurrent write'), { name: 'ConditionalCheckFailedException' });
const item = (revision: number, version = 1) => {
  const companies = structuredClone(getCompaniesStore());
  companies[0].version = version;
  return { Item: { revision: { N: String(revision) }, payload: { S: JSON.stringify(companies) } } };
};
beforeEach(() => {
  send.mockReset();
  resetCompaniesStore();
  vi.stubEnv('COMPANIES_TABLE', 'test-companies');
});
afterEach(() => vi.unstubAllEnvs());
it('keeps local development in memory without AWS calls', async () => {
  vi.stubEnv('COMPANIES_TABLE', '');
  await mutateCompaniesStore((companies) => {
    companies[0].name = 'Local edit';
    return { value: true, changed: true };
  });
  expect((await readCompaniesStore())[0].name).toBe('Local edit');
  expect(send).not.toHaveBeenCalled();
});
it('seeds an empty shared table conditionally with 40 companies', async () => {
  send.mockResolvedValueOnce({}).mockResolvedValueOnce({});
  expect(await readCompaniesStore()).toHaveLength(40);
  expect(send.mock.calls[1][0].input.ConditionExpression).toBe('attribute_not_exists(pk)');
});
it('does not overwrite state when another cold start initializes first', async () => {
  send
    .mockResolvedValueOnce({})
    .mockRejectedValueOnce(conflict())
    .mockResolvedValueOnce(item(2, 3));
  expect((await readCompaniesStore())[0].version).toBe(3);
});
it('rechecks the company version after a competing shared-state write', async () => {
  send
    .mockResolvedValueOnce(item(1))
    .mockRejectedValueOnce(conflict())
    .mockResolvedValueOnce(item(2, 2));
  const status = await mutateCompaniesStore((companies) => {
    if (companies[0].version !== 1) return { value: 409, changed: false };
    companies[0].name = 'My draft';
    companies[0].version++;
    return { value: 200, changed: true };
  });
  expect(status).toBe(409);
  expect(send).toHaveBeenCalledTimes(3);
  expect(send.mock.calls[1][0].input.ExpressionAttributeValues[':previous'].N).toBe('1');
});
it('propagates a storage failure instead of silently using a different local store', async () => {
  send.mockRejectedValue(new Error('Unavailable'));
  await expect(readCompaniesStore()).rejects.toThrow('Unavailable');
});
