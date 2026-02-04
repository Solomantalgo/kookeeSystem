/**
 * Customer & Route Management Types
 * Comprehensive domain models for the Customer Management Agent
 */

export enum CustomerCategory {
  WHOLESALE = 'wholesale',
  RETAIL = 'retail',
  KEY_ACCOUNT = 'key_account',
  LEADS = 'leads',
}

export enum VisitStatus {
  PENDING = 'pending',
  ARRIVED = 'arrived',
  CHECKED_IN = 'checked_in',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  SKIPPED = 'skipped',
}

export enum VerificationStatus {
  UNVERIFIED = 'unverified',
  GPS_VERIFIED = 'gps_verified',
  MANUALLY_VERIFIED = 'manually_verified',
}

export enum RouteType {
  FIXED = 'fixed',
  OPTIMIZED = 'optimized',
}

export enum RoleType {
  FIELD_SALES_REP = 'field_sales_rep',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

export interface GeoCoordinate {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  timestamp?: number;
}

export interface ContactPerson {
  name: string;
  phone: string;
  role: string;
}

export interface Customer {
  id: string;
  name: string;
  category: CustomerCategory;
  location: GeoCoordinate;
  address: string;
  phone: string;
  whatsappNumber?: string;
  contactPerson?: ContactPerson;
  photoUrl?: string;
  storefrontPhotoUrls?: string[];
  locationNotes?: string;
  whatToExpect?: string[];
  verificationStatus: VerificationStatus;
  lastVisitDate?: number;
  lastVisitNotes?: string;
  priority?: number;
  distanceFromCurrent?: number;
  estimatedTimeToReach?: number;
  stockData?: Record<string, number>;
  createdAt: number;
  updatedAt: number;
}

export interface Lead {
  id: string;
  name: string;
  location: GeoCoordinate;
  address: string;
  phone?: string;
  status: 'new' | 'interested' | 'contacted' | 'qualified';
  distance?: number;
  createdAt: number;
}

export interface RoutePoint {
  id: string;
  customerId: string;
  sequence: number;
  coordinates: GeoCoordinate;
  status: VisitStatus;
  estimatedArrivalTime?: number;
  actualArrivalTime?: number;
  checkInTime?: number;
  checkOutTime?: number;
  duration?: number;
  distance?: number;
}

export interface Route {
  id: string;
  userId: string;
  date: string;
  type: RouteType;
  points: RoutePoint[];
  totalDistance: number;
  totalEstimatedDuration: number;
  completionPercentage: number;
  status: 'planned' | 'active' | 'completed' | 'abandoned';
  createdAt: number;
  updatedAt: number;
}

export interface Visit {
  id: string;
  routeId: string;
  customerId: string;
  status: VisitStatus;
  checkInTime: number;
  checkInLocation: GeoCoordinate;
  checkOutTime?: number;
  checkOutLocation?: GeoCoordinate;
  duration?: number;
  photosCapture?: string[];
  notes?: string;
  voiceNotes?: string[];
  formData?: Record<string, any>;
  completedChecklist?: string[];
  requiredChecklist?: string[];
  timestamp?: number;
  createdAt: number;
  updatedAt: number;
  stockHistory?: any;
  repId: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: RoleType;
  phone?: string;
  territory?: string;
  deviceId?: string;
  permissions: string[];
  createdAt: number;
  updatedAt: number;
}

export interface CustomerUIState {
  allCustomers: Customer[];
  selectedCustomer: Customer | null;
  filteredCustomers: Customer[];
  activeRoute: Route | null;
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  selectedCategory: CustomerCategory | null;
  sortBy: 'distance' | 'name' | 'priority';
}

export interface RouteCalculationResult {
  totalDistance: number;
  totalDuration: number;
  optimizedPoints: RoutePoint[];
  estimatedBattery: number;
}

export interface CustomerSearchMatch {
  customer: Customer;
  score: number;
  matchedField: 'name' | 'address' | 'phone';
}

export interface GeoDistance {
  distance: number;
  duration: number;
  coordinates: GeoCoordinate[];
}

export interface DragDropEvent {
  fromIndex: number;
  toIndex: number;
  item: RoutePoint;
}

export interface SwipeAction {
  direction: 'left' | 'right';
  action: 'call' | 'visit' | 'whatsapp' | 'navigate';
  customerId: string;
}

export interface LocationPin {
  id: string;
  customerId: string;
  manualCoordinate: GeoCoordinate;
  originalCoordinate: GeoCoordinate;
  pinType: 'auto' | 'manual';
  verifiedBy?: string;
  verifiedAt?: number;
}

export interface StockData {
  customerId: string;
  productId: string;
  quantity: number;
  unit: string;
  lastRecordedAt: number;
  recordedBy: string;
}

export interface BrandPresence {
  customerId: string;
  brandId: string;
  rating: number;
  notes?: string;
  photoUrl?: string;
  lastAssessedAt: number;
}

export interface VisitDayMetrics {
  date: string;
  totalCustomersPlanned: number;
  totalCustomersVisited: number;
  completionPercentage: number;
  totalDistance: number;
  totalDuration: number;
  averageTimePerVisit: number;
  photosCaptured: number;
}
