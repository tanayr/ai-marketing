import { helloWorld } from "./hello-world";
import { pollFashnAiPredictionStatus } from "./fashn-ai-poll"; // New import

// Define the payload structure for the new event
interface FashnAiPredictionPayload {
  lookrPredictionDbId: string;
  fashnAiPredictionId: string;
  organizationId: string;
  createdById: string;
  originalFileName?: string;
}

export type InngestEvents = {
  // TIP: Add your events here, where key is the event name and value is the event data format
  "test/hello.world": {
    data: {
      email: string;
    };
  };
  "fashn.ai/prediction.poll": { // New event
    data: FashnAiPredictionPayload;
  };
};

// TIP: Add your functions here, failing this will result in function not being registered
export const functions = [helloWorld, pollFashnAiPredictionStatus]; // Added new function
