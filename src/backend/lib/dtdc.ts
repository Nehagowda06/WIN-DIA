/**
 * DTDC Shipping Integration
 * ──────────────────────────
 * Server-to-server API integration using API key authentication.
 *
 * Base URL: https://pxapi.dtdc.in/api/customer/integration
 *
 * ENV vars required:
 *   DTDC_API_KEY, DTDC_CUSTOMER_CODE, DTDC_SERVICE_TYPE_ID, DTDC_COMMODITY_ID
 *   DTDC_PACKAGING_LENGTH_CM, DTDC_PACKAGING_WIDTH_CM, DTDC_PACKAGING_HEIGHT_CM,
 *   DTDC_PACKAGING_WEIGHT_GRAMS, DTDC_PACKAGING_VERIFIED
 *   DTDC_CONSIGNOR_NAME, DTDC_CONSIGNOR_ADDRESS, DTDC_CONSIGNOR_CITY,
 *   DTDC_CONSIGNOR_STATE, DTDC_CONSIGNOR_PIN, DTDC_CONSIGNOR_PHONE,
 *   DTDC_CONSIGNOR_EMAIL
 */

import type {
  ShipmentResult,
  TrackingResult,
  ShippingAddress,
  ShipmentItem,
  CreateShipmentParams,
  ShippingProvider,
} from './shipping-types';

const BASE_URL = 'https://pxapi.dtdc.in/api/customer/integration';

// ── DTDC Service Types ───────────────────────────────────────────────────────

export enum DtdcServiceType {
  B2C_PREMIUM = 'B2C PREMIUM',
  B2C_PRIORITY = 'B2C PRIORITY',
}

export type DtdcServiceTypeString = 'B2C PREMIUM' | 'B2C PRIORITY';

export interface DtdcServiceConfig {
  serviceType: DtdcServiceTypeString;
  description: string;
  recommendedFor: string;
}

export const DTDC_SERVICE_CONFIGS: Record<DtdcServiceTypeString, DtdcServiceConfig> = {
  'B2C PREMIUM': {
    serviceType: 'B2C PREMIUM',
    description: 'Standard B2C service for single-parcel shipments',
    recommendedFor: 'Single parcel deliveries',
  },
  'B2C PRIORITY': {
    serviceType: 'B2C PRIORITY',
    description: 'Priority B2C service for multi-parcel or urgent shipments',
    recommendedFor: 'Multi-parcel or priority deliveries',
  },
};

// ── Packaging Configuration ──────────────────────────────────────────────────

export interface PackagingDimensions {
  length: number;  // cm
  width: number;   // cm
  height: number;  // cm
}

/** Placeholder dimensions for LOCAL TESTING ONLY - NOT verified WIN-DIA packaging */
export const PLACEHOLDER_DIMENSIONS: PackagingDimensions = {
  length: 30,
  width: 25,
  height: 10,
};

function getPackagingConfig(): {
  dimensions: PackagingDimensions;
  weightGrams: number;
  isVerified: boolean;
} {
  const isVerified = process.env.DTDC_PACKAGING_VERIFIED === 'true';

  if (isVerified) {
    const length = Number(process.env.DTDC_PACKAGING_LENGTH_CM);
    const width = Number(process.env.DTDC_PACKAGING_WIDTH_CM);
    const height = Number(process.env.DTDC_PACKAGING_HEIGHT_CM);
    const weightGrams = Number(process.env.DTDC_PACKAGING_WEIGHT_GRAMS) || 0;

    if (!length || !width || !height) {
      throw new Error(
        'DTDC_PACKAGING_VERIFIED is true but dimensions are not configured. ' +
        'Set DTDC_PACKAGING_LENGTH_CM, DTDC_PACKAGING_WIDTH_CM, DTDC_PACKAGING_HEIGHT_CM'
      );
    }

    return {
      dimensions: { length, width, height },
      weightGrams,
      isVerified: true,
    };
  }

  return {
    dimensions: PLACEHOLDER_DIMENSIONS,
    weightGrams: 0,
    isVerified: false,
  };
}

function validatePackagingForLiveShipment(): void {
  const config = getPackagingConfig();

  if (!config.isVerified) {
    throw new Error(
      'LIVE DTDC SHIPMENT BLOCKED: Packaging dimensions and weight have not been verified. ' +
      'Measure the physical WIN-DIA shipping box and configure: ' +
      'DTDC_PACKAGING_LENGTH_CM, DTDC_PACKAGING_WIDTH_CM, DTDC_PACKAGING_HEIGHT_CM, ' +
      'DTDC_PACKAGING_WEIGHT_GRAMS, and set DTDC_PACKAGING_VERIFIED=true'
    );
  }

  console.log('[DTDC] ✓ Packaging verified:', config.dimensions);
}

// ── DTDC-specific Types ──────────────────────────────────────────────────────

interface DtdcConsignment {
  customer_code: string;
  service_type_id: string;
  load_type: 'NON-DOCUMENT' | 'DOCUMENT';
  consignment_type: 'Forward' | 'Reverse';
  description: string;
  dimension_unit: 'cm' | 'in';
  length: string | number;
  width: string | number;
  height: string | number;
  weight_unit: 'kg' | 'g';
  weight: string | number;
  declared_value: string | number;
  num_pieces: string | number;
  origin_details: {
    name: string;
    phone: string;
    alternate_phone?: string;
    address_line_1: string;
    address_line_2?: string;
    pincode: string;
    city: string;
    state: string;
  };
  destination_details: {
    name: string;
    phone: string;
    alternate_phone?: string;
    address_line_1: string;
    address_line_2?: string;
    pincode: string;
    city: string;
    state: string;
  };
  // NOTE: DTDC expects city_name / state_name here (not city / state)
  return_details?: {
    name: string;
    phone: string;
    address_line_1: string;
    address_line_2?: string;
    pincode: string;
    city_name: string;
    state_name: string;
  };
  customer_reference_number: string;
  cod_collection_mode?: 'Cash' | 'Cheque';
  cod_amount?: string | number;
  commodity_id: string;
  is_risk_surcharge_applicable: boolean;
  invoice_number?: string;
  invoice_date?: string;
  reference_number?: string;
}

interface DtdcConsignmentRequest {
  consignments: DtdcConsignment[];
}

/** One entry of the `data` array in DTDC's response (one per consignment) */
interface DtdcConsignmentResult {
  success: boolean;
  reference_number?: string;
  customer_reference_number?: string;
  message?: string;
  reason?: string;
  error?: string;
  [key: string]: any;
}

/** DTDC wraps results as: { status: "OK", data: [ { success, reference_number, ... } ] } */
interface DtdcConsignmentResponse {
  status?: string;
  data?: DtdcConsignmentResult[];
  message?: string;
  errors?: any;
}

// ── Helper Functions ─────────────────────────────────────────────────────────

function resolveCustomerName(addr: ShippingAddress): string {
  return (
    addr.name ||
    addr.full_name ||
    `${addr.firstName || ''} ${addr.lastName || ''}`.trim() ||
    'Customer'
  );
}

function calculateTotalWeightKg(items: ShipmentItem[]): number {
  const PACKETS_PER_BUNDLE = 6;
const PACKET_WEIGHT_G = 40;
const totalProductGrams = items.reduce(
  (sum, i) => sum + (i.qty || 1) * PACKETS_PER_BUNDLE * PACKET_WEIGHT_G,
  0
);

  const packagingConfig = getPackagingConfig();
  const packagingGrams = packagingConfig.weightGrams;

  const totalGrams = totalProductGrams + packagingGrams;
  const weightKg = totalGrams / 1000;
  const finalWeight = Math.max(0.1, weightKg);

  if (packagingGrams > 0) {
    console.log(`[DTDC] Product weight: ${totalProductGrams}g + Packaging: ${packagingGrams}g = Total: ${totalGrams}g (${finalWeight}kg)`);
  } else {
    console.log(`[DTDC] Total package weight: ${totalGrams}g = ${finalWeight}kg (no packaging weight configured)`);
  }

  return finalWeight;
}

function buildDtdcConsignmentPayload(
  params: CreateShipmentParams,
  originWarehouse: DtdcConsignment['origin_details'],
  serviceTypeOverride?: DtdcServiceTypeString
): DtdcConsignmentRequest {
  const { orderNumber, shippingAddress: addr, items, totalPrice, paymentMethod } = params;

  const customerName = resolveCustomerName(addr);
  const phone = String(addr.phone || '').replace(/\D/g, '').slice(-10);
  const address1 = addr.address_line1 || addr.street || '';
  const address2 = addr.address_line2 || '';
  const city = addr.city || '';
  const state = addr.state || '';
  const pincode = String(addr.pincode || addr.postalCode || '');

  const isCOD = paymentMethod === 'cod';
  const weight = calculateTotalWeightKg(items);

  const packagingConfig = getPackagingConfig();
  const dimensions = packagingConfig.dimensions;

  if (!packagingConfig.isVerified) {
    console.warn('[DTDC] WARNING: Using PLACEHOLDER dimensions for testing. NOT verified WIN-DIA packaging.');
  }

  const numPieces = items.reduce((sum, item) => sum + (item.qty || 1), 0);

  const customerCode = process.env.DTDC_CUSTOMER_CODE || '';
  const envServiceTypeId = process.env.DTDC_SERVICE_TYPE_ID || '';
  const commodityId = process.env.DTDC_COMMODITY_ID || '';

  const serviceTypeId = serviceTypeOverride || envServiceTypeId;

  if (!serviceTypeId) {
    throw new Error('DTDC_SERVICE_TYPE_ID is not configured in environment variables');
  }

  const validServiceTypes: DtdcServiceTypeString[] = ['B2C PREMIUM', 'B2C PRIORITY'];
  if (!validServiceTypes.includes(serviceTypeId as DtdcServiceTypeString)) {
    console.warn(`[DTDC] WARNING: Service type "${serviceTypeId}" is not a standard B2C service. Using as-is.`);
  }

  if (!customerCode) {
    throw new Error('DTDC_CUSTOMER_CODE is not configured in environment variables');
  }

  if (!commodityId) {
    console.warn('[DTDC] WARNING: DTDC_COMMODITY_ID not set, using default "1"');
  }

  console.log(`[DTDC] Using service type: ${serviceTypeId}`);

  const invoiceDate = new Date().toISOString().split('T')[0];

  const consignment: DtdcConsignment = {
    customer_code: customerCode,
    service_type_id: serviceTypeId,
    load_type: 'NON-DOCUMENT',
    consignment_type: 'Forward',
    description: 'WIN-DIA Food Products',
    dimension_unit: 'cm',
    length: dimensions.length,
    width: dimensions.width,
    height: dimensions.height,
    weight_unit: 'kg',
    weight: weight,
    declared_value: totalPrice,
    num_pieces: numPieces,

    origin_details: originWarehouse,

    destination_details: {
      name: customerName,
      phone: phone,
      address_line_1: address1,
      address_line_2: address2 || undefined,
      pincode: pincode,
      city: city,
      state: state,
    },

    return_details: {
      name: originWarehouse.name,
      phone: originWarehouse.phone,
      address_line_1: originWarehouse.address_line_1,
      address_line_2: originWarehouse.address_line_2,
      pincode: originWarehouse.pincode,
      city_name: originWarehouse.city,
      state_name: originWarehouse.state,
    },

    customer_reference_number: orderNumber,

    ...(isCOD && {
      cod_collection_mode: 'Cash' as const,
      cod_amount: totalPrice,
    }),

    commodity_id: commodityId || '1',
    is_risk_surcharge_applicable: false,
    invoice_number: orderNumber,
    invoice_date: invoiceDate,
  };

  return {
    consignments: [consignment],
  };
}

// ── DTDC API Client ──────────────────────────────────────────────────────────

async function dtdcFetch(
  path: string,
  options: RequestInit = {}
): Promise<{ ok: boolean; status: number; data: any }> {
  const apiKey = process.env.DTDC_API_KEY;

  if (!apiKey || apiKey.startsWith('REPLACE_ME')) {
    throw new Error('DTDC_API_KEY is not configured. Set DTDC_API_KEY in your .env file.');
  }

  const url = `${BASE_URL}${path}`;
  console.log(`[DTDC] API Request: ${options.method || 'GET'} ${url}`);

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey,
      ...(options.headers || {}),
    },
  });

  const text = await res.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    data = { success: false, message: text.slice(0, 200) };
  }

  console.log(`[DTDC] API Response: ${res.status}`, JSON.stringify(data));

  return { ok: res.ok, status: res.status, data };
}

// ── Warehouse Configuration ──────────────────────────────────────────────────

function getOriginWarehouse(): DtdcConsignment['origin_details'] {
  const name = process.env.DTDC_CONSIGNOR_NAME;
  const address1 = process.env.DTDC_CONSIGNOR_ADDRESS;
  const city = process.env.DTDC_CONSIGNOR_CITY;
  const state = process.env.DTDC_CONSIGNOR_STATE;
  const pincode = process.env.DTDC_CONSIGNOR_PIN;
  const phone = process.env.DTDC_CONSIGNOR_PHONE;
  const email = process.env.DTDC_CONSIGNOR_EMAIL;

  const missingFields: string[] = [];
  if (!name) missingFields.push('DTDC_CONSIGNOR_NAME');
  if (!address1) missingFields.push('DTDC_CONSIGNOR_ADDRESS');
  if (!city) missingFields.push('DTDC_CONSIGNOR_CITY');
  if (!state) missingFields.push('DTDC_CONSIGNOR_STATE');
  if (!pincode) missingFields.push('DTDC_CONSIGNOR_PIN');
  if (!phone) missingFields.push('DTDC_CONSIGNOR_PHONE');
  if (!email) missingFields.push('DTDC_CONSIGNOR_EMAIL');

  if (missingFields.length > 0) {
    throw new Error(
      `DTDC consignor configuration incomplete. Missing environment variables: ${missingFields.join(', ')}. ` +
      'Please configure these in your .env file before creating shipments.'
    );
  }

  const phoneDigits = phone!.replace(/\D/g, '');
  if (phoneDigits.length !== 10) {
    console.warn(`[DTDC] DTDC_CONSIGNOR_PHONE should be 10 digits. Current: ${phone}`);
  }

  if (!/^\d{6}$/.test(pincode!)) {
    console.warn(`[DTDC] DTDC_CONSIGNOR_PIN should be 6 digits. Current: ${pincode}`);
  }

  console.log('[DTDC] Using consignor details from environment:', {
    name,
    city,
    state,
    pincode,
    phone: phoneDigits,
  });

  return {
    name: name!,
    phone: phoneDigits,
    address_line_1: address1!,
    address_line_2: undefined,
    pincode: pincode!,
    city: city!,
    state: state!,
  };
}

// ── DTDC Provider Implementation ─────────────────────────────────────────────

export interface DtdcCreateShipmentParams extends CreateShipmentParams {
  /** Override service type for this shipment (optional) */
  serviceType?: DtdcServiceTypeString;
}

export const dtdcProvider: ShippingProvider = {
  /**
   * Creates a shipment on DTDC and returns AWB/tracking information
   */
  async createShipment(params: CreateShipmentParams): Promise<ShipmentResult> {
    try {
      validatePackagingForLiveShipment();

      const dtdcParams = params as DtdcCreateShipmentParams;
      const originWarehouse = getOriginWarehouse();
      const requestPayload = buildDtdcConsignmentPayload(
        params,
        originWarehouse,
        dtdcParams.serviceType
      );

      const serviceType = dtdcParams.serviceType || process.env.DTDC_SERVICE_TYPE_ID || 'B2C PREMIUM';

      console.log('[DTDC] Creating shipment for order:', params.orderNumber);
      console.log('[DTDC] Service type:', serviceType);
      console.log('[DTDC] Request payload structure:', {
        consignments_count: requestPayload.consignments.length,
        service_type_id: requestPayload.consignments[0].service_type_id,
        weight_kg: requestPayload.consignments[0].weight,
        weight_unit: requestPayload.consignments[0].weight_unit,
        num_pieces: requestPayload.consignments[0].num_pieces,
        dimensions: `${requestPayload.consignments[0].length}×${requestPayload.consignments[0].width}×${requestPayload.consignments[0].height}cm`,
        cod: requestPayload.consignments[0].cod_amount ? 'Yes' : 'No',
      });

      const response = await dtdcFetch('/consignment/softdata', {
        method: 'POST',
        body: JSON.stringify(requestPayload),
      });

      const body: DtdcConsignmentResponse = response.data;

      // DTDC returns one result per consignment inside body.data[]
      const item: DtdcConsignmentResult | undefined = Array.isArray(body?.data) ? body.data[0] : undefined;

      if (!response.ok || !item?.success) {
        const errorMessage =
          item?.message ||
          item?.reason ||
          item?.error ||
          body?.message ||
          body?.errors?.toString() ||
          'DTDC shipment creation failed';
        console.error('[DTDC] Shipment creation failed:', errorMessage);

        if (errorMessage.toLowerCase().includes('balance')) {
          return {
            success: false,
            error: 'Insufficient DTDC account balance. Please recharge your DTDC account.',
            raw: body,
          };
        }
        if (errorMessage.toLowerCase().includes('service type')) {
          return {
            success: false,
            error: `Invalid service type "${serviceType}". Please verify DTDC_SERVICE_TYPE_ID configuration.`,
            raw: body,
          };
        }
        if (errorMessage.toLowerCase().includes('duplicate')) {
          return {
            success: false,
            error: 'Duplicate booking attempt. This order may already have a shipment.',
            raw: body,
          };
        }

        return {
          success: false,
          error: errorMessage,
          raw: body,
        };
      }

      // DTDC's reference_number IS the AWB / consignment number
      const awbCode = item.reference_number;

      if (!awbCode) {
        console.error('[DTDC] No AWB number in response:', body);
        return {
          success: false,
          error: 'DTDC did not allocate AWB number. This may indicate an account configuration issue.',
          raw: body,
        };
      }

      const trackingUrl = `https://www.dtdc.in/tracking.asp?trackno=${awbCode}`;

      console.log('[DTDC] Shipment created successfully:', {
        awb: awbCode,
        service_type: serviceType,
      });

      return {
        success: true,
        awbCode: awbCode,
        shipmentId: awbCode,
        orderId: params.orderNumber,
        courierName: 'DTDC',
        trackingUrl: trackingUrl,
        raw: body,
      };

    } catch (error: any) {
      console.error('[DTDC] Shipment creation error:', error);

      if (error.message?.includes('fetch')) {
        return {
          success: false,
          error: 'Network error connecting to DTDC API. Please check internet connection.',
          raw: { error: error.toString() },
        };
      }

      return {
        success: false,
        error: error.message || 'DTDC API request failed',
        raw: { error: error.toString() },
      };
    }
  },

  /**
   * Track a shipment by AWB/consignment number
   * TODO: DTDC tracking uses a separate login (username/password -> token). Not implemented yet.
   */
  async trackShipment(awbCodeOrConsignmentNumber: string): Promise<TrackingResult> {
    try {
      console.log('[DTDC] Tracking shipment:', awbCodeOrConsignmentNumber);
      console.warn('[DTDC] Tracking API not yet implemented');

      return {
        success: false,
        error: 'DTDC tracking is not implemented yet.',
      };
    } catch (error: any) {
      console.error('[DTDC] Tracking error:', error);
      return {
        success: false,
        error: error.message || 'DTDC tracking request failed',
      };
    }
  },

  /**
   * Cancel a shipment on DTDC
   * TODO: cancellation endpoint is not in the DTDC docs we have.
   */
  async cancelShipment(dtdcReferenceNumber: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('[DTDC] Cancelling shipment:', dtdcReferenceNumber);
      console.warn('[DTDC] Cancellation API not yet implemented');

      return {
        success: false,
        error: 'DTDC cancellation API endpoint not yet configured.',
      };
    } catch (error: any) {
      console.error('[DTDC] Cancellation error:', error);
      return {
        success: false,
        error: error.message || 'DTDC cancellation request failed',
      };
    }
  },
};