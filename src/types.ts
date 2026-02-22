import React from 'react';

export interface PlateResult {
  plateNumber: string;
  confidence: "high" | "medium" | "low";
  vehicleType?: string;
  vehicleModel?: string;
  color?: string;
  region?: string;
  ownerName?: string;
  registrationDate?: string;
  plateBoundingBox: {
    ymin: number;
    xmin: number;
    ymax: number;
    xmax: number;
  };
}

export interface RecognitionResult {
  plates: PlateResult[];
}

export interface HistoryItem {
  id: string;
  plates: PlateResult[];
  timestamp: number;
  imageUrl: string;
}

export interface HistoryItem extends RecognitionResult {
  id: string;
}
