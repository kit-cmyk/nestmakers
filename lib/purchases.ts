import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL, PurchasesOfferings, PurchasesPackage } from 'react-native-purchases';

const IOS_KEY = 'test_DQEMYwWXIwtZfTHfEEIjSeQVzTX';
const ANDROID_KEY = 'test_DQEMYwWXIwtZfTHfEEIjSeQVzTX';

export function initPurchases() {
  Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.VERBOSE : LOG_LEVEL.ERROR);
  const apiKey = Platform.OS === 'ios' ? IOS_KEY : ANDROID_KEY;
  Purchases.configure({ apiKey });
}

export async function identifyUser(userId: string) {
  await Purchases.logIn(userId);
}

export async function getOfferings(): Promise<PurchasesOfferings | null> {
  try {
    return await Purchases.getOfferings();
  } catch {
    return null;
  }
}

export async function purchasePackage(pkg: PurchasesPackage) {
  return Purchases.purchasePackage(pkg);
}

export async function restorePurchases() {
  return Purchases.restorePurchases();
}

export async function getCustomerInfo() {
  return Purchases.getCustomerInfo();
}
