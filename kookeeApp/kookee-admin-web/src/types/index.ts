export interface User {
    user_id: string;
    name: string;
    employee_id: string;
    route_id: string;
    registered_at: string;
}

export interface Customer {
    customer_id: string;
    name: string;
    area: string;
    phone?: string;
    gps_lat: number;
    gps_lng: number;
    photo_uri: string;
    location_notes: string;
    visit_notes: string;
    active: boolean;
    route_id?: string;
}

export interface Visit {
    visit_id: string;
    user_id: string;
    customer_id: string;
    date: string;
    completed: boolean;
    arrival_time?: string;
    completion_time?: string;
    notes?: string;
    reason_missed?: 'Closed' | 'Unavailable' | 'No stock';
    order_value?: number;
}

export interface Route {
    route_id: string;
    name: string;
    created_by: string;
    customer_order: string[]; // Array of customer IDs
    created_at: string;
}

export interface LiveLocation {
    user_id: string;
    name: string;
    employee_id: string;
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: string;
    speed?: number;
    heading?: number;
    current_customer_name?: string;
    status: 'in_visit' | 'traveling' | 'idle';
}

export interface Alert {
    alert_id: string;
    user_id: string;
    user_name: string;
    type: 'off_route' | 'stationary' | 'behind_schedule' | 'long_visit';
    severity: 'low' | 'medium' | 'high';
    message: string;
    latitude?: number;
    longitude?: number;
    created_at: string;
    resolved: boolean;
}

export interface PerformanceMetrics {
    user_id: string;
    name: string;
    date: string;
    total_visits: number;
    completed_visits: number;
    missed_visits: number;
    completion_rate: number;
    avg_visit_duration_minutes: number;
    total_revenue: number;
    efficiency_score: number;
}

export interface TeamStats {
    total_salespeople: number;
    active_today: number;
    total_visits_today: number;
    total_revenue_today: number;
    avg_completion_rate: number;
}
export interface Merchandiser {
    merchandiser_id: string;
    name: string;
    employee_id: string;
    phone: string;
    active: boolean;
    password?: string;
    last_seen?: string;
    status?: 'active' | 'inactive';
}

export interface Outlet {
    outlet_id: string;
    name: string;
    location: string;
    gps_lat: number;
    gps_lng: number;
    active: boolean;
}

export interface OutletAssignment {
    assignment_id: string;
    merchandiser_id: string;
    merchandiser_name?: string;
    outlet_id: string;
    outlet_name?: string;
    instructions?: string;
    date: string;
    assigned_date?: string;
    completed: boolean;
}

export interface ProductCount {
    product_name: string;
    quantity: number;
}

export interface OutletReport {
    report_id: string;
    outlet_id: string;
    outlet_name: string;
    merchandiser_id: string;
    merchandiser_name: string;
    date: string;
    submitted_at: string;
    products: ProductCount[];
    quick_visit: boolean;
    image_url?: string;
}

export interface MerchandiserStats {
    merchandiser_id: string;
    name: string;
    assigned_outlets: number;
    visited_outlets: number;
    reports_submitted: number;
    missing_reports: number;
    status: 'active' | 'inactive';
}
