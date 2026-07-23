export interface User {
  id: string;
  email: string;
}

export interface RiskPrediction {
  risk_percent: number;
  risk_level: 'Low' | 'Medium' | 'High';
  insight: string;
  interpretation: string;
  safety_advice: string[];
  forecast?: ForecastDay[];
}

export interface ForecastDay {
  date: string;
  temp_max: number;
  temp_min: number;
  humidity: number;
  rainfall: number;
  wind_speed: number;
  condition: string;
}

export interface PredictionResult {
  location: {
    full_name: string;
    lat: number;
    lon: number;
  };
  date: string;
  predictions: {
    flood: RiskPrediction;
    wildfire: RiskPrediction;
    landslide: RiskPrediction;
    earthquake: RiskPrediction;
    hurricane: RiskPrediction;
  };
}

export interface SavedPrediction {
  id: string;
  user_id: string;
  location_name: string;
  lat: number;
  lon: number;
  predictions: PredictionResult['predictions'];
  created_at: string;
}

export type DisasterType = 'flood' | 'wildfire' | 'landslide' | 'earthquake' | 'hurricane';
