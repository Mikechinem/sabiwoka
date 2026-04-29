import { get, set } from 'idb-keyval';
import { createClient } from '@/lib/supabase/client';

const QUEUE_KEY = 'sabiwoka_offline_queue';

export async function queueOfflineAction(actionType: 'ADD_SALE' | 'ADD_INVENTORY' | 'ADD_LEAD', payload: any) {
  try {
    const currentQueue = await get(QUEUE_KEY) || [];
    const newAction = {
      id: Date.now().toString(),
      type: actionType,
      payload: payload,
      timestamp: new Date().toISOString()
    };
    currentQueue.push(newAction);
    await set(QUEUE_KEY, currentQueue);
    console.log(`Action ${actionType} queued locally.`);
  } catch (error) {
    console.error("Queue error:", error);
  }
}

export async function processSyncQueue() {
  try {
    const queue = await get(QUEUE_KEY) || [];
    if (queue.length === 0) return;

    console.log(`SabiWoka: Starting sync for ${queue.length} offline records...`);
    const supabase = createClient();

    for (const action of queue) {
      if (action.type === 'ADD_INVENTORY') {
        // Logic for Inventory sync
        const { error } = await supabase.from('products').insert(action.payload);
        if (error) throw error; 
      }
      
      if (action.type === 'ADD_SALE') {
        // 1. Insert Sale (Payload contains pre-generated ID)
        const { error: saleError } = await supabase.from('sales').insert(action.payload.sale);
        if (saleError) throw saleError;
        
        // 2. Insert Items (Linked to that pre-generated ID)
        if (action.payload.items && action.payload.items.length > 0) {
          const { error: itemsError } = await supabase.from('sale_items').insert(action.payload.items);
          if (itemsError) throw itemsError;
        }
      }

      if (action.type === 'ADD_LEAD') {
        const { error } = await supabase.from('leads').insert(action.payload);
        if (error) throw error;
      }
    }

    // Success! Clear the local waiting room.
    await set(QUEUE_KEY, []);
    console.log("SabiWoka Sync Complete: Warehouse updated.");

  } catch (error) {
    console.error("Sync failed mid-process. Items remain in queue for retry.", error);
  }
}