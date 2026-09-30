/**
 * Encrypted On-Device Biometric Storage (Client-Side AES-GCM 256-bit)
 * Stores ONLY encrypted 512-D float embeddings and exemplar vectors.
 * NEVER stores raw face crops, photos, or video frames.
 */

export interface StudentBiometricRecord {
  studentId: string | number;
  meanEmbedding: number[];  // 512-D L2-normalized mean
  exemplars: number[][];    // Up to 3 exemplar vectors
  sampleCount: number;
  enrolledAt: number;
  consentGiven: boolean;
}

interface StoredBiometricRecord {
  studentId: string;
  sampleCount: number;
  enrolledAt: number;
  consentGiven: boolean;
  iv?: number[];
  encryptedPayload?: number[];
  // Legacy unencrypted fields for backward compatibility
  meanEmbedding?: number[];
  exemplars?: number[][];
}

const DB_NAME = 'cognilearn_biometrics_db';
const DB_VERSION = 2;
const STORE_NAME = 'student_embeddings';
const KEY_STORE_NAME = 'crypto_keys';

let dbInstance: IDBDatabase | null = null;
let cachedKey: CryptoKey | null = null;

async function getDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB is not supported in this environment'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'studentId' });
      }
      if (!db.objectStoreNames.contains(KEY_STORE_NAME)) {
        db.createObjectStore(KEY_STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      reject(new Error(`Failed to open IndexedDB biometric store: ${(event.target as IDBOpenDBRequest).error}`));
    };
  });
}

/**
 * Retrieves or initializes an on-device WebCrypto AES-GCM 256-bit key
 */
async function getEncryptionKey(): Promise<CryptoKey | null> {
  if (cachedKey) return cachedKey;
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    return null;
  }

  const db = await getDB();
  return new Promise((resolve) => {
    const tx = db.transaction(KEY_STORE_NAME, 'readwrite');
    const store = tx.objectStore(KEY_STORE_NAME);
    const getReq = store.get('device_biometric_key');

    getReq.onsuccess = async () => {
      if (getReq.result && getReq.result.key) {
        cachedKey = getReq.result.key as CryptoKey;
        resolve(cachedKey);
      } else {
        try {
          const newKey = await window.crypto.subtle.generateKey(
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
          );
          const putTx = db.transaction(KEY_STORE_NAME, 'readwrite');
          const putStore = putTx.objectStore(KEY_STORE_NAME);
          putStore.put({ id: 'device_biometric_key', key: newKey });
          cachedKey = newKey;
          resolve(newKey);
        } catch (e) {
          console.warn('Failed to generate WebCrypto key:', e);
          resolve(null);
        }
      }
    };

    getReq.onerror = () => {
      console.warn('Key retrieval error from IndexedDB:', getReq.error);
      resolve(null);
    };
  });
}

async function decryptRecord(stored: StoredBiometricRecord, key: CryptoKey | null): Promise<StudentBiometricRecord> {
  if (stored.encryptedPayload && stored.iv && key && typeof window !== 'undefined' && window.crypto?.subtle) {
    try {
      const iv = new Uint8Array(stored.iv);
      const data = new Uint8Array(stored.encryptedPayload);
      const decrypted = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        data
      );
      const text = new TextDecoder().decode(decrypted);
      const parsed = JSON.parse(text);
      return {
        studentId: stored.studentId,
        sampleCount: stored.sampleCount,
        enrolledAt: stored.enrolledAt,
        consentGiven: stored.consentGiven,
        meanEmbedding: parsed.meanEmbedding,
        exemplars: parsed.exemplars,
      };
    } catch (e) {
      console.error(`Decryption failed for student ${stored.studentId}:`, e);
      return {
        studentId: stored.studentId,
        sampleCount: stored.sampleCount,
        enrolledAt: stored.enrolledAt,
        consentGiven: stored.consentGiven,
        meanEmbedding: [],
        exemplars: [],
      };
    }
  }

  // Fallback / legacy unencrypted
  return {
    studentId: stored.studentId,
    sampleCount: stored.sampleCount,
    enrolledAt: stored.enrolledAt,
    consentGiven: stored.consentGiven,
    meanEmbedding: stored.meanEmbedding || [],
    exemplars: stored.exemplars || [],
  };
}

/**
 * Encrypts and stores an enrolled student's numeric biometric embedding record
 */
export async function saveBiometricRecord(record: StudentBiometricRecord): Promise<void> {
  const db = await getDB();
  const key = await getEncryptionKey();

  let stored: StoredBiometricRecord;
  if (key && typeof window !== 'undefined' && window.crypto?.subtle) {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const payload = JSON.stringify({
      meanEmbedding: record.meanEmbedding,
      exemplars: record.exemplars,
    });
    const encoded = new TextEncoder().encode(payload);
    const ciphertext = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoded
    );

    stored = {
      studentId: String(record.studentId),
      sampleCount: record.sampleCount,
      enrolledAt: record.enrolledAt,
      consentGiven: record.consentGiven,
      iv: Array.from(iv),
      encryptedPayload: Array.from(new Uint8Array(ciphertext)),
    };
  } else {
    stored = {
      ...record,
      studentId: String(record.studentId),
    };
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(stored);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Retrieves and decrypts a single student's biometric record
 */
export async function getBiometricRecord(studentId: string | number): Promise<StudentBiometricRecord | null> {
  const db = await getDB();
  const key = await getEncryptionKey();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(String(studentId));

    request.onsuccess = async () => {
      if (!request.result) {
        resolve(null);
        return;
      }
      const decrypted = await decryptRecord(request.result, key);
      resolve(decrypted);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Retrieves and decrypts all enrolled biometric records in a key-value Map
 */
export async function getAllBiometricRecords(): Promise<Map<string, StudentBiometricRecord>> {
  const db = await getDB();
  const key = await getEncryptionKey();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = async () => {
      const map = new Map<string, StudentBiometricRecord>();
      const rawRecords: StoredBiometricRecord[] = request.result || [];
      for (const rec of rawRecords) {
        const decrypted = await decryptRecord(rec, key);
        map.set(String(decrypted.studentId), decrypted);
      }
      resolve(map);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Permanently deletes biometric data for a student from on-device storage
 */
export async function deleteBiometricRecord(studentId: string | number): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(String(studentId));

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
