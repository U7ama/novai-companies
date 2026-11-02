import { DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import type { Company } from '@/features/companies/types';
import { getCompaniesStore } from './companies-store';

let client: DynamoDBClient | undefined;
const key = { pk: { S: 'companies' } };

function database() {
  client ??= new DynamoDBClient({ region: process.env.AWS_REGION ?? 'us-east-1', maxAttempts: 3 });
  return client;
}

function isConflict(error: unknown) {
  return error instanceof Error && error.name === 'ConditionalCheckFailedException';
}

async function snapshot(table: string): Promise<{ companies: Company[]; revision: number }> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const response = await database().send(
      new GetItemCommand({
        TableName: table,
        Key: key,
        ConsistentRead: true
      })
    );
    if (response.Item) {
      return {
        companies: JSON.parse(response.Item.payload.S!) as Company[],
        revision: Number(response.Item.revision.N)
      };
    }
    const companies = structuredClone(getCompaniesStore());
    try {
      await database().send(
        new PutItemCommand({
          TableName: table,
          Item: { ...key, revision: { N: '0' }, payload: { S: JSON.stringify(companies) } },
          ConditionExpression: 'attribute_not_exists(pk)'
        })
      );
      return { companies, revision: 0 };
    } catch (error) {
      if (!isConflict(error)) throw error;
    }
  }
  throw new Error('Could not initialize company state');
}

export async function readCompaniesStore(): Promise<Company[]> {
  const table = process.env.COMPANIES_TABLE;
  return table ? (await snapshot(table)).companies : getCompaniesStore();
}

// Local development keeps the assessment's in-memory array. AWS uses one small
// shared snapshot so cold starts and parallel Lambda instances agree on versions.
export async function mutateCompaniesStore<T>(
  mutation: (companies: Company[]) => { value: T; changed: boolean }
): Promise<T> {
  const table = process.env.COMPANIES_TABLE;
  if (!table) return mutation(getCompaniesStore()).value;
  for (let attempt = 0; attempt < 5; attempt++) {
    const { companies, revision } = await snapshot(table);
    const outcome = mutation(companies);
    if (!outcome.changed) return outcome.value;
    try {
      await database().send(
        new PutItemCommand({
          TableName: table,
          Item: {
            ...key,
            revision: { N: String(revision + 1) },
            payload: { S: JSON.stringify(companies) }
          },
          ConditionExpression: 'revision = :previous',
          ExpressionAttributeValues: { ':previous': { N: String(revision) } }
        })
      );
      return outcome.value;
    } catch (error) {
      if (!isConflict(error)) throw error;
    }
  }
  throw new Error('Company state changed repeatedly; please retry');
}
