import AsyncStorage from '@react-native-async-storage/async-storage';

export const CUSTOMER_ACCOUNTS_STORAGE_KEY = 'imperialwood_customer_accounts';

export type CustomerAccount = {
  id: string;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  password: string;
  createdAt: string;
};

function isCustomerAccount(value: unknown): value is CustomerAccount {
  if (!value || typeof value !== 'object') return false;

  const account = value as Record<string, unknown>;
  return (
    typeof account.id === 'string' &&
    typeof account.fullName === 'string' &&
    typeof account.username === 'string' &&
    typeof account.email === 'string' &&
    typeof account.phone === 'string' &&
    typeof account.password === 'string' &&
    typeof account.createdAt === 'string'
  );
}

export async function loadCustomerAccounts(): Promise<CustomerAccount[]> {
  try {
    const storedAccounts = await AsyncStorage.getItem(CUSTOMER_ACCOUNTS_STORAGE_KEY);
    if (!storedAccounts) return [];

    const parsed: unknown = JSON.parse(storedAccounts);
    if (!Array.isArray(parsed) || !parsed.every(isCustomerAccount)) {
      throw new Error('Stored customer account data is not a valid account array.');
    }

    return parsed;
  } catch (error) {
    console.error('Failed to load ImperialWood customer accounts:', error);
    throw new Error('Customer accounts could not be loaded.', { cause: error });
  }
}

export async function saveCustomerAccounts(accounts: CustomerAccount[]): Promise<void> {
  try {
    // University demo only: production apps must use a secure backend and password hashing.
    await AsyncStorage.setItem(CUSTOMER_ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  } catch (error) {
    console.error('Failed to save ImperialWood customer accounts:', error);
    throw new Error('Customer accounts could not be saved.', { cause: error });
  }
}

export function createCustomerId(accounts: CustomerAccount[]): string {
  const highestNumber = accounts.reduce((highest, account) => {
    const match = /^CUS-(\d+)$/.exec(account.id);
    return match ? Math.max(highest, Number.parseInt(match[1], 10)) : highest;
  }, 0);

  return `CUS-${String(highestNumber + 1).padStart(3, '0')}`;
}
