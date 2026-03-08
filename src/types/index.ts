export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    image_url: string;
    is_active: boolean;
    created_at: string;
}

export interface Order {
    id: string;
    user_id: string;
    total_amount: number;
    contact_email: string;
    shipping_address: {
        firstName: string;
        lastName: string;
        address: string;
        city: string;
        zipCode: string;
    };
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    created_at: string;
}

export interface FurnitureItem {
    id: string;
    type: 'sofa' | 'table' | 'plant' | 'bed' | 'shelf';
    name: string;
    position: [number, number, number];
    rotation: [number, number, number];
}

export interface SavedDesign {
    id: string;
    user_id: string;
    name: string;
    room_type: string;
    furniture_layout: FurnitureItem[];
    created_at: string;
}
