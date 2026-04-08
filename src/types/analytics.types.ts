export interface CityAnalytics {
    _id: string;
    total_consults: number;
    avg_risk_score: number;
    symptom_summary: string[][];
}

export interface RiskDistribution {
    _id: string;
    count: number;
}

export interface CentralAnalytics {
    by_city: CityAnalytics[];
    risk_distribution: RiskDistribution[];
    timestamp: string;
}

export interface GeographicCoordinate {
    lat: number;
    lng: number;
}

export interface HeatMapNode {
    _id: string;
    city: string;
    coordinates: GeographicCoordinate;
    primary_diagnosis: string;
    risk_level: string;
}

export interface CentralAnalyticsResponse {
    code: number;
    message: string;
    data: CentralAnalytics;
}

export interface HeatMapResponse {
    code: number;
    message: string;
    data: HeatMapNode[];
}
