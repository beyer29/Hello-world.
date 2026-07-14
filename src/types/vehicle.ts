export interface VinDecodeResult {
  vin: string;
  valid: boolean;
  manufacturer: string;
  region: string;
  modelYear: number | null;
  platformGuess: string | null;
}

export interface ConnectedVehicle {
  vin: string;
  decoded: VinDecodeResult;
  connectedAt: string;
  moduleIds: string[];
}
